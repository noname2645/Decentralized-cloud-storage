const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

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
app.use(express.json());

// Ethers setup
const provider = new ethers.providers.JsonRpcProvider(process.env.BLAST_API_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

console.log('✅ Ethers provider and contract initialized');

// Create API router to separate API routes
const apiRouter = express.Router();

// Health check route
apiRouter.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Upload endpoint
apiRouter.post('/upload', async (req, res) => {
  const { cid, size } = req.body;

  console.log('📥 Upload request received:');
  console.log('CID:', cid);
  console.log('Size:', size);

  if (!cid || !size) {
    return res.status(400).json({ error: 'CID and size are required' });
  }

  try {
    const fileName = `file-${Date.now()}`;
    const ipfsHash = cid;

    console.log('📤 Calling contract.uploadFile with:');
    console.log('  - name:', fileName);
    console.log('  - ipfsHash:', ipfsHash);
    console.log('  - Contract Address:', process.env.CONTRACT_ADDRESS);
    console.log('  - Network:', await provider.getNetwork());

    const gasEstimate = await contract.estimateGas.uploadFile(fileName, ipfsHash);
    console.log('Gas estimate successful:', gasEstimate.toString());

    const tx = await contract.uploadFile(fileName, ipfsHash, {
      gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
    });

    console.log('✅ Transaction sent successfully!');
    console.log('  - Hash:', tx.hash);
    console.log('  - From:', tx.from);
    console.log('  - To:', tx.to);
    console.log('  - Nonce:', tx.nonce);
    console.log('  - Gas Limit:', tx.gasLimit.toString());
    console.log('⏳ Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('🎉 Transaction confirmed!');
    console.log('  - Block Number:', receipt.blockNumber);
    console.log('  - Gas Used:', receipt.gasUsed.toString());
    console.log('  - Transaction Hash:', receipt.transactionHash);

    res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      fileName,
      ipfsHash,
      fileSize: size,
      gasUsed: receipt.gasUsed.toString(),
      from: tx.from,
      to: tx.to,
    });
  } catch (err) {
    console.error('🔥 Upload failed:', err.message);
    console.error('Error details:', {
      code: err.code,
      reason: err.reason,
      transaction: err.transaction,
    });
    
    res.status(500).json({
      error: 'Upload failed',
      details: err.message,
      reason: err.reason || null,
      code: err.code || null,
    });
  }
});

// Get all files endpoint
apiRouter.get('/files', async (req, res) => {
  try {
    const fileCount = await contract.fileCount();
    console.log('📊 Total files:', fileCount.toString());

    const files = [];
    for (let i = 0; i < fileCount; i++) {
      try {
        const file = await contract.getFile(i);
        files.push({
          id: i,
          name: file.name || file[0],
          ipfsHash: file.ipfsHash || file[1],
        });
      } catch (fileError) {
        console.log(`Error getting file ${i}:`, fileError.message);
      }
    }

    res.json({ success: true, files, totalCount: fileCount.toString() });
  } catch (err) {
    console.error('Error getting files:', err.message);
    res.status(500).json({ error: 'Failed to get files', details: err.message });
  }
});

// Delete file endpoint (just dummy, no contract call)
apiRouter.post('/delete', async (req, res) => {
  const { cid } = req.body;

  console.log('🗑️ Delete request received:');
  console.log('CID:', cid);

  if (!cid) {
    return res.status(400).json({ error: 'CID is required' });
  }

  try {
    console.log('File deletion processed for CID:', cid);

    res.json({
      success: true,
      message: 'File deletion processed',
      cid,
    });
  } catch (err) {
    console.error('Delete failed:', err.message);
    res.status(500).json({
      error: 'Delete failed',
      details: err.message,
      reason: err.reason || null,
    });
  }
});

// Get single file by id
apiRouter.get('/file/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (isNaN(fileId) || fileId < 0) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    const file = await contract.getFile(fileId);

    res.json({
      success: true,
      file: {
        id: fileId,
        name: file.name || file[0],
        ipfsHash: file.ipfsHash || file[1],
      },
    });
  } catch (err) {
    console.error('Error getting file:', err.message);
    res.status(500).json({ error: 'File not found', details: err.message });
  }
});

// 1. Mount API router FIRST
app.use('/api', apiRouter);

// Frontend static files handling
const frontendPath = path.join(__dirname, '../Frontend/dist');
const fs = require('fs');

if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend build found at:', frontendPath);
  
  // Log the contents of the dist folder for debugging
  const distContents = fs.readdirSync(frontendPath);
  console.log('📁 Dist folder contents:', distContents);
  
  // 2. Serve static files
  app.use(express.static(frontendPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      // Set proper content types
      if (filepath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filepath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filepath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    }
  }));

  // 3. Serve index.html for the root route
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // 4. Simple SPA handling - manually define common routes
  const spaRoutes = ['/upload', '/files', '/settings', '/profile', '/dashboard'];
  
  spaRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  });

  // 5. Final middleware for SPA - check if request is for API or static file
  app.use((req, res, next) => {
    // If it's an API request that wasn't handled, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other non-API requests that aren't static files, serve index.html
    const requestedFile = path.join(frontendPath, req.path);
    fs.access(requestedFile, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, serve index.html for SPA routing
        res.sendFile(path.join(frontendPath, 'index.html'));
      } else {
        // File exists, it should have been served by static middleware
        // If we get here, it means static middleware didn't handle it, so send 404
        res.status(404).send('File not found');
      }
    });
  });
} else {
  console.log('⚠️  Frontend build not found at:', frontendPath);
  console.log('🔍 API-only mode: Only /api routes will work');
  
  app.use((req, res) => {
    res.send(`
      <h1>Backend is running! 🚀</h1>
      <p>Frontend build not found. Please build the frontend first:</p>
      <ol>
        <li>Navigate to the Frontend directory: <code>cd ../Frontend</code></li>
        <li>Install dependencies: <code>npm install</code></li>
        <li>Build the project: <code>npm run build</code></li>
        <li>Restart this server</li>
      </ol>
      <p>API endpoints are available at <code>/api/*</code></p>
    `);
  });
}

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📍 Frontend path: ${frontendPath}`);
  console.log(`🔌 API available at: http://localhost:${PORT}/api`);
});