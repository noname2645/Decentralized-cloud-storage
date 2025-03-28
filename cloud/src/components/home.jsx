import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { db, auth } from "../config.js";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { pinataConfig, contractAddress, contractABI } from "../config.js";
import "../stylesheets/home.css";


// 📌 Connect to Ethereum (Ganache)
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
const signer = new ethers.Wallet(contractAddress.Accprivate, provider);
const contract = new ethers.Contract(contractAddress.Accaddress, contractABI, signer);
const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // 🔍 Detect user login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchUserFiles(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  // 📌 Fetch User's Uploaded Files from Firestore
  const fetchUserFiles = async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, "files"));
      const filesData = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((file) => file.userId === userId);
      setFiles(filesData);
    } catch (error) {
      console.error("🚨 Error fetching user files:", error);
    }
  };

  // 📌 Handle File Selection
  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    input.accept = "image/*";

    input.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
      }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  // 📌 Handle File Upload to Pinata and Firestore
  const handleUpload = async (file) => {
    if (!file || !user) {
      alert("❌ Please log in first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("🚀 Uploading to Pinata...");
      const response = await axios.post(pinataUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
      });

      const fileCID = response.data.IpfsHash;
      console.log("✅ File uploaded to IPFS:", fileCID);

      await contract.uploadFile(fileCID, file.size);
      console.log("✅ File stored on blockchain.");

      await addDoc(collection(db, "files"), {
        userId: user.uid,
        fileCID,
        type: file.type || "unknown",
        timestamp: new Date(),
      });

      fetchUserFiles(user.uid);
    } catch (error) {
      console.error("🚨 Upload failed:", error);
    }

    setLoading(false);
  };

  // 🔹 Handle Image Click (with Transition Delay)
  const handleImageClick = (fileCID) => {
    setSelectedImage(fileCID);
    setTimeout(() => {
      setIsOverlayVisible(true);
    }, 50);
  };

  // 🔹 Close Image Preview
  const closeImagePreview = () => {
    setIsOverlayVisible(false);
    setTimeout(() => {
      setSelectedImage(null);
    }, 300); // Wait for transition
  };

  return (
    <div className="dashboard">
      <h2 className="welcome-text">Welcome {user ? user.email : "Guest"}</h2>
      <button onClick={handleFileSelect} disabled={loading} className="upload-btn">
        {loading ? "Uploading..." : "Upload File"}
      </button>

      {/* 🔹 Image Clickable Grid */}
      <div className="files-grid">
        {files.map((file, index) =>
          file.type.startsWith("image/") ? (
            <div key={index} className="file-card" onClick={() => handleImageClick(file.fileCID)}>
              <img src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`} alt="Uploaded" className="file-image" />
            </div>
          ) : null
        )}
      </div>

      {/* 🔹 Enlarged Image Popup */}
      {selectedImage && (
        <div className={`overlay ${isOverlayVisible ? "show" : ""}`} onClick={closeImagePreview}>
          <div className="enlarged-container" onClick={(e) => e.stopPropagation()}>
            <img src={`https://gateway.pinata.cloud/ipfs/${selectedImage}`} alt="Enlarged" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
