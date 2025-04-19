// Home.js

import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { db, auth } from "../config.js";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { pinataConfig, contractAddress, contractABI } from "../config.js";
import * as THREE from "three";
import "../stylesheets/home.css";
import audio from "../assets/Images/audio.png";
import jpeg from "../assets/Images/jpeg.png";
import pdf from "../assets/Images/pdf.png";
import jpg from "../assets/Images/jpg.png";
import png from "../assets/Images/png-file.png";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const mountRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [pdfModal, setPdfModal] = useState({ isOpen: false, cid: "" });

  // 3D Background Setup
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020210");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1600;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color("#ffffff");

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchPinnedFilesFromPinata(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchPinnedFilesFromPinata = async (userId) => {
    try {
      const res = await axios.get("https://api.pinata.cloud/data/pinList", {
        headers: {
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
        params: {
          status: "pinned",
          pageLimit: 100,
        },
      });

      const filtered = res.data.rows.filter(
        (file) => file.metadata?.keyvalues?.userId === userId
      );

      const files = filtered.map((file) => ({
        fileCID: file.ipfs_pin_hash,
        fileName: file.metadata?.keyvalues?.name || file.metadata?.name || file.file_name,  // better fallback
        type: file.metadata?.keyvalues?.type || "unknown",
      }));

      setFiles(files);
    } catch (err) {
      console.error("Error fetching from Pinata:", err);
      setFiles([]);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,video/mp4";
    input.className = "hidden-input";

    input.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
      }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleUpload = async (file) => {
    if (!file || !user) {
      alert("Please log in first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: file.name, // this sets the visible file name in Pinata
      keyvalues: {
        userId: user.uid,
        name: file.name,         // <- this makes sure you can access it in fetch
        type: file.type || "unknown",
      },
    });


    formData.append("pinataMetadata", metadata);

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
      });

      const fileCID = response.data.IpfsHash;

      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
      const signer = new ethers.Wallet(contractAddress.Accprivate, provider);
      const contract = new ethers.Contract(contractAddress.Accaddress, contractABI, signer);
      await contract.uploadFile(fileCID, file.size);

      await addDoc(collection(db, "files"), {
        userId: user.uid,
        fileCID,
        type: file.type || "unknown",
        timestamp: new Date(),
      });

      fetchPinnedFilesFromPinata(user.uid);
    } catch (error) {
      console.error("Upload failed:", error);
    }

    setLoading(false);
  };

  const handleImageClick = (fileCID, type) => {
    setSelectedImage({ fileCID, type });
    setIsOverlayVisible(true);
  };

  const closeImagePreview = () => {
    setIsOverlayVisible(false);
    setSelectedImage(null);
  };

  const handleDelete = async (fileCID) => {
    try {
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${fileCID}`, {
        headers: {
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
      });
      alert("File deleted from Pinata.");
      setFiles(prev => prev.filter(f => f.fileCID !== fileCID));
    } catch (error) {
      console.error("Error deleting file from Pinata:", error);
      alert("Failed to delete from Pinata.");
    }
  };

  return (
    <div className="app-wrapper">
      <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}></div>
      <div className="hello">
        <h2 className="welcome-text">
          Welcome <span style={{ color: "#ffa500" }}>{user ? user.email : ""}</span>
        </h2>

        <button onClick={handleFileSelect} disabled={loading} className="upload-btn">
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      <div className="files-grid">
        {files.map((file, index) => (
          <div
            key={index}
            className="file-card"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* File Icon and Name */}
            <div className="file-info">
              {/* Show icon based on file type */}
              {file.type.startsWith("image/png") ? (
                <img src={png} alt="PNG"></img>
              ) : file.type === "video/mp4" ? (
                <img src={audio} alt="MP4"></img>
              ) : file.type === "application/pdf" ? (
                <img src={pdf} alt="PDF"></img>
              ) : file.type.startsWith("image/jpeg") ? (
                <img src={jpeg} alt="JPEG"></img>
              ) : file.type.startsWith("image/jpg") ? (
                <img src={jpg} alt="JPG"></img>
              ) : (
                <span role="img" aria-label="file">📁</span>
              )}
              <span id="file-name">
                {file.fileName}
              </span>

            </div>

            {/* Display file preview */}
            {file.type.startsWith("image/") ? (
              <img
                src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`}
                alt="Uploaded"
                className="file-image"
                onClick={() => handleImageClick(file.fileCID, file.type)}
              />
            ) : file.type === "video/mp4" ? (
              <video
                src={`https://gateway.pinata.cloud/ipfs/${file.fileCID}`}
                muted
                loop
                autoPlay
                playsInline
                className="file-video"
                onClick={() => handleImageClick(file.fileCID, file.type)}
              />
            ) : file.type === "application/pdf" ? (
              <div className="pdf-preview">
                <div
                  className="pdf-thumbnail"
                  onClick={() => setPdfModal({ isOpen: true, cid: file.fileCID })}
                >
                  📄 <span className="underline cursor-pointer text-blue-500">Click to Preview PDF</span>
                </div>
            
                {/* Fullscreen PDF Modal */}
                {pdfModal.isOpen && pdfModal.cid === file.fileCID && (
                  <div className="modal-overlay" onClick={() => setPdfModal({ isOpen: false, cid: "" })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <embed
                        src={`https://gateway.pinata.cloud/ipfs/${pdfModal.cid}`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                      <button className="close-btn" onClick={() => setPdfModal({ isOpen: false, cid: "" })}>
                        ✖ Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>📁 Unsupported file type</p>
            )}
            

            {/* Delete button on hover */}
            {hoveredIndex === index && (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.fileCID);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>


      {selectedImage && (
        <div className={`overlay ${isOverlayVisible ? "show" : ""}`} onClick={closeImagePreview}>
          <div className="enlarged-container" onClick={(e) => e.stopPropagation()}>
            {selectedImage.type.startsWith("image/") ? (
              <img
                src={`https://gateway.pinata.cloud/ipfs/${selectedImage.fileCID}`}
                alt="Enlarged"
                className="enlarged-image"
              />
            ) : selectedImage.type === "video/mp4" ? (
              <video
                src={`https://gateway.pinata.cloud/ipfs/${selectedImage.fileCID}`}
                controls
                autoPlay
                controlsList="nodownload"
                className="enlarged-video"
              />
            ) : (
              <p>Unsupported preview type</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
