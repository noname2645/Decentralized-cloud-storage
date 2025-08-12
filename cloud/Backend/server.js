require('dotenv').config({ path: '/Decentralized cloud storage/cloud/.env' });
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const contractJson = require('/Decentralized cloud storage/cloud/build/contracts/PinataStorage.json');
const contractABI = contractJson.abi;

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

// Serve static frontend files from dist
// Serve frontend build from Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend/dist'))); // for Vite

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
});



app.use(cors());
app.use(express.json());

// Ethers setup
const provider = new ethers.providers.JsonRpcProvider(process.env.BLAST_API_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

// Health check route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// CORRECTED: uploadFile(string name, string ipfsHash)
app.post('/upload', async (req, res) => {
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

    // Estimate gas with correct parameters
    const gasEstimate = await contract.estimateGas.uploadFile(fileName, ipfsHash);
    console.log('Gas estimate successful:', gasEstimate.toString());

    // Send transaction with correct parameters
    const tx = await contract.uploadFile(fileName, ipfsHash, {
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    res.json({ 
      success: true, 
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      fileName: fileName,
      ipfsHash: ipfsHash,
      fileSize: size 
    });

  } catch (err) {
    console.error('🔥 Upload failed:');
    console.error('   Message:', err.message);
    console.error('   Reason:', err.reason);
    console.error('   Code:', err.code);
    
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message,
      reason: err.reason
    });
  }
});


app.get('/files', async (req, res) => {
  try {
    const fileCount = await contract.fileCount();
    console.log('📁 Total files:', fileCount.toString());
    
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

// Add this endpoint to your server.js file

app.post('/delete', async (req, res) => {
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
      cid: cid
    });

  } catch (err) {
    console.error('Delete failed:');
    console.error('Message:', err.message);
    console.error('Reason:', err.reason);
    console.error('Code:', err.code);
    
    res.status(500).json({ 
      error: 'Delete failed', 
      details: err.message,
      reason: err.reason
    });
  }
});


app.get('/file/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = await contract.getFile(fileId);
    
    res.json({
      success: true,
      file: {
        id: fileId,
        name: file.name || file[0],
        ipfsHash: file.ipfsHash || file[1],
      }
    });
  } catch (err) {
    console.error('Error getting file:', err.message);
    res.status(500).json({ error: 'File not found', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});