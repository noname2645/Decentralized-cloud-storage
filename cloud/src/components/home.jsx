import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { pinataConfig, contractAddress, contractABI } from "../config.js";

// Ganache RPC URL
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");

// Create a wallet with your specific account
const signer = new ethers.Wallet(contractAddress.Accprivate, provider);

// Load contract with manually defined signer
const contract = new ethers.Contract(contractAddress.Accaddress, contractABI, signer);

// Pinata API URL
const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// Function to upload the file to Pinata and get its IPFS CID
const pinFileToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("📤 Uploading file to IPFS...");
    const response = await axios.post(pinataUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataConfig.pinataApiKey,
        pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
      },
    });
    console.log("✅ File uploaded to IPFS: ", response.data.IpfsHash);
    return response.data.IpfsHash; // IPFS CID
  } catch (error) {
    console.error("❌ Error uploading to Pinata:", error);
    return null;
  }
};

// Function to upload the file's CID to the blockchain
const uploadFileToBlockchain = async (fileCID, fileSize) => {
  try {
    console.log("📡 Uploading CID to blockchain...");
    const tx = await contract.uploadFile(fileCID, fileSize);
    console.log("📜 Transaction Hash:", tx.hash);
    await tx.wait();
    console.log("✅ File uploaded to blockchain successfully!");
  } catch (error) {
    console.error("❌ Error interacting with contract:", error);
  }
};

// Upload component
const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("❗ Please select a file first.");
      return;
    }

    console.log("🔗 Connecting to blockchain...");
    try {
      await provider.getBlockNumber(); // Check blockchain connection
      console.log("✅ Connected to blockchain");
    } catch (error) {
      console.error("❌ Failed to connect to blockchain:", error);
      return;
    }

    console.log("📤 Uploading file to IPFS...");
    const fileCID = await pinFileToIPFS(selectedFile);
    if (!fileCID) {
      alert("❌ Failed to upload file to IPFS.");
      return;
    }

    console.log("✅ File uploaded to IPFS:", fileCID);

    // Upload CID to blockchain
    await uploadFileToBlockchain(fileCID, selectedFile.size);
  };

  return (
    <div>
      <h2>Upload Your File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

// App component
const App = () => (
  <div>
    <h1>Decentralized Cloud Storage</h1>
    <Upload />
  </div>
);

export default App
