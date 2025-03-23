import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { db, storage, auth } from "../config.js";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { pinataConfig, contractAddress, contractABI } from "../config.js";
import "../stylesheets/home.css";
import { Buffer } from "buffer";

window.Buffer = Buffer;

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
const signer = new ethers.Wallet(contractAddress.Accprivate, provider);
const contract = new ethers.Contract(contractAddress.Accaddress, contractABI, signer);
const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchUserFiles(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserFiles = async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, "files"));
      const filesData = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((file) => file.userId === userId);
      setFiles(filesData);
    } catch (error) {
      console.error("Error fetching user files:", error);
    }
  };

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
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      return null;
    }
  };

  const uploadFileToBlockchain = async (fileCID, fileSize) => {
    try {
      const tx = await contract.uploadFile(fileCID, fileSize);
      await tx.wait();
    } catch (error) {
      console.error("Error interacting with contract:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      alert("Please select a file and log in first.");
      return;
    }
    setLoading(true);
    const fileCID = await pinFileToIPFS(selectedFile);
    if (!fileCID) {
      alert("Failed to upload file to IPFS.");
      setLoading(false);
      return;
    }
    await uploadFileToBlockchain(fileCID, selectedFile.size);
    await addDoc(collection(db, "files"), {
      userId: user.uid,
      fileCID,
      type: selectedFile.type,
      timestamp: new Date(),
    });
    fetchUserFiles(user.uid);
    setSelectedFile(null);
    setLoading(false);
  };

  const deleteFile = async (fileId, fileCID) => {
    try {
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${fileCID}`, {
        headers: {
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
      });
      await deleteDoc(doc(db, "files", fileId));
      setFiles(files.filter((file) => file.id !== fileId));
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file.");
    }
  };

  return (
    <div className="dashboard">
      <h1 className="text-3xl font-bold text-center">Welcome, {user?.email || "Guest"}!</h1>
      <div className="upload-container">
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </div>
      <section className="files-section">
        <h2>Uploaded Files</h2>
        {files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul className="file-list">
            {files.map((file) => (
              <li key={file.id} className="file-item" onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}>
                <p className="text-lg font-medium cursor-pointer">{file.type}</p>
                {expandedFile === file.id && (
                  file.type.startsWith("image") ? (
                    <img src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`} alt="Preview" className="file-preview" />
                  ) : file.type.startsWith("video") ? (
                    <video controls className="file-preview">
                      <source src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`} type={file.type} />
                    </video>
                  ) : file.type.startsWith("application/pdf") ? (
                    <iframe src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`} className="file-preview" title="File Preview"></iframe>
                  ) : (
                    <a href={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`} target="_blank" rel="noopener noreferrer">Download File</a>
                  )
                )}
                <button className="delete-btn" onClick={() => deleteFile(file.id, file.fileCID)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Home;
