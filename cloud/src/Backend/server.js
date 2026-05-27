const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const https = require('https');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');

console.log("ENV PATH:", path.resolve(__dirname, '../../.env'));
console.log("Loaded RPC:", process.env.BLAST_API_URL ? '✅ Configured' : '❌ Missing');

// Contract ABI
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "fileId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "uploader",
        "type": "address"
      }
    ],
    "name": "FileUploaded",
    "type": "event"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "fileCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "files",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "uploader",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      }
    ],
    "name": "uploadFile",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_fileId",
        "type": "uint256"
      }
    ],
    "name": "getFile",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

console.log('✅ Contract ABI loaded successfully');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
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

// Set body limit higher for large encrypted files (e.g. 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ethers setup
const provider = new ethers.providers.JsonRpcProvider(process.env.BLAST_API_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

(async () => {
  try {
    console.log("Signer Address:", signer.address.slice(0, 6) + '...' + signer.address.slice(-4));
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    console.log("Contract Code:", code && code !== '0x' ? '✅ Deployed' : '❌ Not found');
  } catch (err) {
    console.error("Initialization error checking signer:", err.message);
  }
})();

console.log('✅ Ethers provider and contract initialized');

// ==========================================================================
// SEC-03: CRITICAL CRYPTOGRAPHIC FIREBASE TOKEN VERIFIER (NO CREDENTIALS NEEDED)
// ==========================================================================
let publicKeysCache = null;
let cacheExpiration = 0;

const fetchGooglePublicKeys = () => {
  return new Promise((resolve, reject) => {
    if (publicKeysCache && Date.now() < cacheExpiration) {
      return resolve(publicKeysCache);
    }
    
    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const keys = JSON.parse(data);
          publicKeysCache = keys;
          // Cache for 6 hours
          cacheExpiration = Date.now() + 6 * 60 * 60 * 1000;
          resolve(keys);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const verifyFirebaseToken = async (idToken) => {
  if (!idToken) throw new Error('No token provided');
  
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const [headerB64, payloadB64, signatureB64] = parts;
  
  const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  
  const kid = header.kid;
  if (!kid) throw new Error('Missing key ID in JWT header');
  
  const publicKeys = await fetchGooglePublicKeys();
  const cert = publicKeys[kid];
  if (!cert) throw new Error('Public key not found for kid');
  
  // Verify signature using Crypto
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  
  const isValid = verify.verify(cert, signatureB64, 'base64');
  if (!isValid) throw new Error('Invalid token signature');
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token has expired');
  
  // Verify audience and issuer
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (payload.aud !== projectId) throw new Error('Audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Issuer mismatch');
  
  // Map standard Firebase JWT claims to uid
  payload.uid = payload.sub || payload.user_id;
  
  return payload;
};

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization Header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = await verifyFirebaseToken(token);
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials', details: err.message });
  }
};

// Create API router
const apiRouter = express.Router();

// Health check route
apiRouter.get('/', (req, res) => {
  res.send('Backend is running securely 🚀');
});

// ==========================================================================
// SEC-01: SECURE UPLOAD RELAY (PINATA SECRETS HELD ENTIRELY ON BACKEND SERVER)
// ==========================================================================
apiRouter.post('/upload', authenticateToken, async (req, res) => {
  const { fileName, ciphertext, fileType, fileSize } = req.body;

  if (!fileName || !ciphertext || !fileType || !fileSize) {
    return res.status(400).json({ error: 'Missing parameters. fileName, ciphertext, fileType, and fileSize are required.' });
  }

  let fileCID = null;

  try {
    console.log(`📥 Secure upload request from ${req.user.email} (UID: ${req.user.uid})`);
    
    // Step 1: Upload encrypted ciphertext string to Pinata via Buffer
    const buffer = Buffer.from(ciphertext, 'utf-8');
    const form = new FormData();
    form.append('file', buffer, {
      filename: `${fileName}.aes`,
      contentType: 'text/plain'
    });

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        userId: req.user.uid,
        name: fileName,
        type: fileType,
        timestamp: `${Date.now()}`
      }
    });
    form.append('pinataMetadata', metadata);
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    console.log('🛰️ Relaying file payload to Pinata...');
    const pinataRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
      headers: {
        ...form.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
      },
      maxBodyLength: Infinity
    });

    fileCID = pinataRes.data.IpfsHash;
    console.log(`✅ File pinned to IPFS. CID: ${fileCID}`);

    // Step 2: Write Transaction proof to Solidity Contract on Sepolia
    console.log('⛓️ Committing block event on blockchain ledger...');
    const gasEstimate = await contract.estimateGas.uploadFile(fileName, fileCID);
    const tx = await contract.uploadFile(fileName, fileCID, {
      gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
    });

    console.log(`✅ Ledger transaction sent. Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log('🎉 Block transaction confirmed!');

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      fileName,
      fileCID,
      fileSize,
      gasUsed: receipt.gasUsed.toString(),
      from: tx.from,
      to: tx.to
    });

  } catch (err) {
    console.error('🔥 Upload execution failed:', err.message);
    
    // Attempt rollback of pinned file on Pinata if transaction fails
    if (fileCID) {
      try {
        console.log(`🔄 Rolling back Pinata pin for CID: ${fileCID}`);
        await axios.delete(`https://api.pinata.cloud/pinning/unpin/${fileCID}`, {
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
          }
        });
      } catch (rollbackErr) {
        console.error('Rollback unpin failed:', rollbackErr.message);
      }
    }

    res.status(500).json({
      error: 'Upload transaction failed',
      details: err.message,
      reason: err.reason || null
    });
  }
});

// ==========================================================================
// SEC-01: SECURE USER FILES FETCH (FILTERED BY UID SERVER-SIDE)
// ==========================================================================
apiRouter.get('/user-files', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching file list for user ${req.user.email} (UID: ${req.user.uid})`);
    
    const pinataRes = await axios.get('https://api.pinata.cloud/data/pinList', {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
      },
      params: {
        status: 'pinned',
        pageLimit: 100,
        'metadata[keyvalues]': JSON.stringify({
          userId: { value: req.user.uid, op: 'eq' }
        })
      }
    });

    res.json({
      success: true,
      rows: pinataRes.data.rows
    });
  } catch (err) {
    console.error('Failed to query user files:', err.message);
    res.status(500).json({ error: 'Failed to retrieve storage lists', details: err.message });
  }
});

// ==========================================================================
// SEC-01: SECURE FILE DELETION (UNPIN FROM BACKEND)
// ==========================================================================
apiRouter.post('/delete', authenticateToken, async (req, res) => {
  const { cid } = req.body;

  if (!cid) {
    return res.status(400).json({ error: 'CID is required' });
  }

  try {
    console.log(`🗑️ Processing delete request from ${req.user.email} for CID: ${cid}`);

    // Verify ownership or proceed with unpinning
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
      }
    });

    console.log(`✅ Unpinned CID: ${cid} from Pinata`);

    res.json({
      success: true,
      message: 'Resource successfully unpinned from decentralized network',
      cid
    });
  } catch (err) {
    console.error('Delete failed:', err.message);
    res.status(500).json({
      error: 'Delete failed',
      details: err.message
    });
  }
});

// Get all files from Blockchain (General Ledger)
apiRouter.get('/files', async (req, res) => {
  try {
    const fileCount = await contract.fileCount();
    const filesList = [];
    for (let i = 0; i < fileCount; i++) {
      try {
        const file = await contract.getFile(i);
        filesList.push({
          id: i,
          name: file.name || file[0],
          ipfsHash: file.ipfsHash || file[1],
        });
      } catch (fileError) {
        console.log(`Error getting file ${i}:`, fileError.message);
      }
    }
    res.json({ success: true, files: filesList, totalCount: fileCount.toString() });
  } catch (err) {
    console.error('Error getting files:', err.message);
    res.status(500).json({ error: 'Failed to get ledger files', details: err.message });
  }
});

// Mount API router
app.use('/api', apiRouter);

// Serve Frontend Build statically
const frontendPath = path.join(__dirname, '../Frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend build found at:', frontendPath);
  app.use(express.static(frontendPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.log('⚠️ Frontend build not found. Running in API-only mode.');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Uncaught server error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});