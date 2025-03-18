import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { pinataConfig, contractAddress, contractABI } from "../config.js";

// Pinata API URL
const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// Function to upload the file to Pinata and get its IPFS CID
const pinFileToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(pinataUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataConfig.pinataApiKey,
        pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
      },
    });
    return response.data.IpfsHash; // IPFS CID
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
  }
};

// Function to upload the file's CID to the blockchain
const uploadFileToBlockchain = async (fileCID, fileSize) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545"); // Ganache default URL
    const signer = provider.getSigner(0); // Using first Ganache account
    const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

    const tx = await contract.uploadFile(fileCID, fileSize);
    console.log("Transaction Hash:", tx.hash);
    await tx.wait();
    console.log("File uploaded to blockchain successfully");
  } catch (error) {
    console.error("Error interacting with contract:", error);
  }
};

// Upload component
const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    // Upload file to Pinata and get CID
    const fileCID = await pinFileToIPFS(selectedFile);

    if (fileCID) {
      console.log("File uploaded to IPFS:", fileCID);

      // Upload CID to blockchain
      await uploadFileToBlockchain(fileCID, selectedFile.size);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

// App component
const App = () => (
  <div>
    <h1>Decentralized Cloud Storage</h1>
    <Upload /> {/* Include the Upload component */}
  </div>
);

export default App;