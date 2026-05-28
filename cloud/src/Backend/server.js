const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express  = require('express');
const cors     = require('cors');
const https    = require('https');
const crypto   = require('crypto');
const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const { ethers } = require('ethers');

// ─── Startup checks ──────────────────────────────────────────────────────────
console.log("ENV PATH:", path.resolve(__dirname, '../../.env'));
console.log("Pinata API Key:  ", process.env.PINATA_API_KEY        ? '✅ Configured' : '❌ Missing');
console.log("Firebase Project:", process.env.FIREBASE_PROJECT_ID   ? '✅ Configured' : '❌ Missing');
console.log("Blockchain relay:", process.env.PRIVATE_KEY           ? '✅ Relay wallet configured' : '❌ Missing');
console.log("Contract address:", process.env.NEBULA_CONTRACT_ADDRESS || '❌ Missing');

/*
 * API ROUTE MAP
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/upload          → Encrypt file → pin to IPFS via Pinata
 * POST /api/prepare-upload  → Get nonce + message hash for the user to sign
 * POST /api/relay-upload    → Submit signed meta-tx to blockchain (backend pays gas)
 * POST /api/delete          → Unpin from IPFS + optional on-chain soft-delete
 * GET  /api/user-files      → List all files belonging to the logged-in user
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes require a Firebase ID token in the Authorization header.
 */

// ─── Blockchain relay setup ────────────────────────────────────────────────────
// Backend wallet only RELAYS transactions — pays gas on behalf of users.
// It does NOT own any files; ecrecover in the contract stores the user's address.
const provider = new ethers.providers.JsonRpcProvider(process.env.BLAST_API_URL);
const relayWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const NEBULA_ABI = [
  "function uploadFileMeta(string _name, string _ipfsHash, address _user, uint256 _nonce, uint256 _deadline, bytes _signature) external",
  "function deleteFileMeta(uint256 _fileId, address _user, uint256 _nonce, uint256 _deadline, bytes _signature) external",
  "function nonces(address) view returns (uint256)",
  "function fileCount() view returns (uint256)"
];

const nebulaContract = new ethers.Contract(
  process.env.NEBULA_CONTRACT_ADDRESS,
  NEBULA_ABI,
  relayWallet
);

(async () => {
  try {
    const count = await nebulaContract.fileCount();
    console.log(`✅ NebulaStorage contract live — ${count} files on-chain`);
  } catch (err) {
    console.error('❌ Contract init check failed:', err.message);
  }
})();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://decentralized-cloud-storage.onrender.com',
    'https://nebulastorage.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Firebase token verification (no Admin SDK needed) ──────────────────────
// Firebase sends users a JWT (JSON Web Token) after login.
// We verify it here using Google's public keys — no Firebase Admin SDK required.
let publicKeysCache = null;
let cacheExpiration = 0;

// Downloads Google's public signing keys (cached for 6 hours to avoid spam).
const fetchGooglePublicKeys = () => new Promise((resolve, reject) => {
  if (publicKeysCache && Date.now() < cacheExpiration) return resolve(publicKeysCache);
  https.get(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          publicKeysCache = JSON.parse(data);
          cacheExpiration = Date.now() + 6 * 60 * 60 * 1000; // cache for 6 hours
          resolve(publicKeysCache);
        } catch (e) { reject(e); }
      });
    }
  ).on('error', reject);
});

// Verifies a Firebase ID token and returns its payload (includes uid, email).
const verifyFirebaseToken = async (idToken) => {
  if (!idToken) throw new Error('No token provided');

  // A JWT has three parts separated by dots: header.payload.signature
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header  = JSON.parse(Buffer.from(headerB64,  'base64').toString());
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

  // Find the matching public key using the key ID in the token header
  const keys = await fetchGooglePublicKeys();
  const cert = keys[header.kid];
  if (!cert) throw new Error('Public key not found');

  // Verify the signature to confirm the token was signed by Google
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  if (!verifier.verify(cert, signatureB64, 'base64')) throw new Error('Invalid token signature');

  // Check the token hasn't expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');

  // Check the token was issued for this Firebase project
  const pid = process.env.FIREBASE_PROJECT_ID;
  if (payload.aud !== pid) throw new Error('Audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${pid}`) throw new Error('Issuer mismatch');

  payload.uid = payload.sub || payload.user_id;
  return payload;
};

const authenticateToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    req.user = await verifyFirebaseToken(auth.split(' ')[1]);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
};

// ─── API Router ────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => res.json({
  status: 'ok',
  message: 'Nebula Backend 🚀',
  version: '3.0.0 (meta-tx relay)',
  contract: process.env.NEBULA_CONTRACT_ADDRESS
}));

// =============================================================================
// STEP 1 — Frontend requests a message for the user to sign (free, no gas)
// Returns: the nonce + deadline the user must sign
// =============================================================================
apiRouter.post('/prepare-upload', authenticateToken, async (req, res) => {
  const { userAddress, fileName, fileCID } = req.body;
  if (!userAddress || !fileName || !fileCID)
    return res.status(400).json({ error: 'userAddress, fileName, fileCID required' });

  try {
    const nonce    = (await nebulaContract.nonces(userAddress)).toNumber();
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

    // This is the exact message the frontend must sign with personal_sign
    const contractAddress = process.env.NEBULA_CONTRACT_ADDRESS;
    const msgHash = ethers.utils.solidityKeccak256(
      ['string', 'string', 'address', 'uint256', 'uint256', 'address'],
      [fileName, fileCID, userAddress, nonce, deadline, contractAddress]
    );

    res.json({ nonce, deadline, msgHash, contractAddress });
  } catch (err) {
    console.error('prepare-upload failed:', err.message);
    res.status(500).json({ error: 'Failed to prepare upload', details: err.message });
  }
});

// =============================================================================
// RELAY-UPLOAD — Receive user signature, relay uploadFileMeta() (backend pays gas)
// IPFS upload already done by /upload. This just submits the on-chain tx.
// =============================================================================
apiRouter.post('/relay-upload', authenticateToken, async (req, res) => {
  const { fileName, fileCID, userAddress, signature, nonce, deadline } = req.body;

  if (!fileName || !fileCID || !userAddress || !signature || nonce === undefined || !deadline)
    return res.status(400).json({ error: 'Missing required fields for relay' });

  try {
    console.log(`⛓️  Relaying meta-tx for ${userAddress} — file: ${fileName}`);

    const tx = await nebulaContract.uploadFileMeta(
      fileName, fileCID, userAddress, nonce, deadline, signature,
      { gasLimit: 350000 }
    );
    console.log(`📤 Tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

    res.json({
      success:     true,
      txHash:      tx.hash,
      blockNumber: receipt.blockNumber,
      fileCID,
      uploader:    userAddress
    });
  } catch (err) {
    console.error('Relay failed:', err.message);
    res.status(500).json({ error: 'Blockchain relay failed', details: err.reason || err.message });
  }
});

// =============================================================================
// UPLOAD — Encrypt → IPFS → prepare meta-tx → relay on-chain (backend pays gas)
// =============================================================================
apiRouter.post('/upload', authenticateToken, async (req, res) => {
  const { fileName, ciphertext, fileType, fileSize, userAddress, signature, nonce, deadline } = req.body;

  if (!fileName || !ciphertext || !fileType || !fileSize)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    console.log(`📥 Upload — ${req.user.email} | wallet: ${userAddress || 'not provided'}`);

    // ── 1. Pin encrypted file to IPFS via Pinata ─────────────────────────────
    const buffer = Buffer.from(ciphertext, 'utf-8');
    const form   = new FormData();
    form.append('file', buffer, { filename: `${fileName}.aes`, contentType: 'text/plain' });
    form.append('pinataMetadata', JSON.stringify({
      name: fileName,
      keyvalues: { userId: req.user.uid, name: fileName, type: fileType, timestamp: `${Date.now()}` }
    }));
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    console.log('🛰️ Pinning to IPFS…');
    const pinataRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS', form,
      {
        headers: { ...form.getHeaders(), pinata_api_key: process.env.PINATA_API_KEY, pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY },
        maxBodyLength: Infinity
      }
    );
    const fileCID = pinataRes.data.IpfsHash;
    console.log(`✅ IPFS CID: ${fileCID}`);

    // ── 2. Relay blockchain tx if wallet + signature provided ─────────────────
    let txHash = null;
    let blockNumber = null;

    if (userAddress && signature && nonce !== undefined && deadline) {
      console.log(`⛓️  Relaying meta-tx for wallet ${userAddress}…`);
      const tx = await nebulaContract.uploadFileMeta(
        fileName, fileCID, userAddress, nonce, deadline, signature,
        { gasLimit: 300000 }
      );
      console.log(`✅ Tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      txHash      = tx.hash;
      blockNumber = receipt.blockNumber;
      console.log(`🎉 Confirmed in block ${blockNumber}`);
    } else {
      console.log('ℹ️  No wallet signature provided — IPFS only, no on-chain record.');
    }

    res.json({ success: true, fileCID, txHash, blockNumber, fileName, fileSize });

  } catch (err) {
    console.error('🔥 Upload failed:', err.message);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// =============================================================================
// DELETE — unpin from IPFS + relay on-chain soft-delete (backend pays gas)
// =============================================================================
apiRouter.post('/delete', authenticateToken, async (req, res) => {
  const { cid, fileId, userAddress, signature, nonce, deadline } = req.body;
  if (!cid) return res.status(400).json({ error: 'CID required' });

  try {
    console.log(`🗑️  Unpin CID: ${cid} — ${req.user.email}`);

    // Unpin from Pinata
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      headers: { pinata_api_key: process.env.PINATA_API_KEY, pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY }
    });
    console.log(`✅ Unpinned: ${cid}`);

    // Relay on-chain soft-delete if signature provided
    if (fileId && userAddress && signature && nonce !== undefined && deadline) {
      try {
        const tx = await nebulaContract.deleteFileMeta(
          fileId, userAddress, nonce, deadline, signature,
          { gasLimit: 150000 }
        );
        await tx.wait();
        console.log(`✅ On-chain delete: ${tx.hash}`);
      } catch (chainErr) {
        console.warn('On-chain delete skipped:', chainErr.message);
      }
    }

    res.json({ success: true, message: 'File removed', cid });
  } catch (err) {
    console.error('Delete failed:', err.message);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// =============================================================================
// USER FILES — fetch from Pinata (filtered by userId)
// =============================================================================
apiRouter.get('/user-files', authenticateToken, async (req, res) => {
  try {
    const pinataRes = await axios.get('https://api.pinata.cloud/data/pinList', {
      headers: { pinata_api_key: process.env.PINATA_API_KEY, pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY },
      params: {
        status: 'pinned', pageLimit: 100,
        'metadata[keyvalues]': JSON.stringify({ userId: { value: req.user.uid, op: 'eq' } })
      }
    });
    res.json({ success: true, rows: pinataRes.data.rows });
  } catch (err) {
    console.error('Fetch files failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve files', details: err.message });
  }
});

// Mount router
app.use('/api', apiRouter);

// ─── Serve Frontend build ──────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../Frontend/dist');
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend build found at:', frontendPath);
  app.use(express.static(frontendPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.log('⚠️  No frontend build — API-only mode.');
}

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => console.log(`🚀 Nebula Backend on http://localhost:${PORT}`));