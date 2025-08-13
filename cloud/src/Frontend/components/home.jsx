// Home.js
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { db, auth } from "../components/config.js";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { pinataConfig } from "../components/config.js";
import * as THREE from "three";
import "../stylesheets/home.css";
import audio from "../assets/Images/audio.png";
import jpeg from "../assets/Images/jpeg.png";
import pdf from "../assets/Images/pdf.png";
import jpg from "../assets/Images/jpg.png";
import png from "../assets/Images/png-file.png";
import { encryptFile, decryptFile } from "./aesUtils.js";


const Home = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [user, setUser] = useState(null);
  const mountRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    isOpen: false,
    stage: 'encrypting', // 'encrypting', 'uploading', 'blockchain', 'success'
    fileName: ''
  });
  const [preview, setPreview] = useState({
    isOpen: false,
    type: null,
    content: null,
    fileName: ''
  });

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020210");
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !initialLoadComplete) {
        setShowWelcomeModal(true);
        fetchPinnedFilesFromPinata(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [initialLoadComplete]);

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

      const files = await Promise.all(filtered.map(async (file) => {
        const fileCID = file.ipfs_pin_hash;
        const type = file.metadata?.keyvalues?.type || "unknown";

        let previewURL = null;

        if (type.startsWith("image/") || type.startsWith("video/") || type === "application/pdf") {
          try {
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${fileCID}`);
            const encryptedText = await res.text();
            const decryptedBytes = decryptFile(encryptedText);
            const blob = new Blob([decryptedBytes], { type });
            previewURL = URL.createObjectURL(blob);
          } catch (err) {
            console.error("Failed to generate preview for:", fileCID, err);
          }
        }

        return {
          fileCID,
          fileName: file.metadata?.keyvalues?.name || file.metadata?.name || file.file_name,
          type,
          previewURL,
        };
      }));
      
      setFiles(files);
      setInitialLoadComplete(true);
      setShowWelcomeModal(false);

    } catch (err) {
      console.error("Error fetching from Pinata:", err);
      setFiles([]);
      setInitialLoadComplete(true);
      setShowWelcomeModal(false);
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
  let fileCID = null; // Track the CID for potential rollback

  try {
    // Step 1: Encrypting
    setUploadStatus({
      isOpen: true,
      stage: 'encrypting',
      fileName: file.name
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const originalBuffer = await file.arrayBuffer();
    const encryptedString = encryptFile(originalBuffer);
    const encryptedBlob = new Blob([encryptedString], { type: "text/plain" });
    const encryptedFile = new File([encryptedBlob], file.name + ".aes", { type: "text/plain" });

    // Step 2: Uploading to IPFS
    setUploadStatus(prev => ({
      ...prev,
      stage: 'uploading'
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));

    const formData = new FormData();
    formData.append("file", encryptedFile);
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        userId: user.uid,
        name: file.name,
        type: file.type || "unknown",
        timestamp: `${Date.now()}-${Math.floor(Math.random() * 100000)}`
      },
    });
    const options = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataMetadata", metadata);
    formData.append("pinataOptions", options);

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataConfig.pinataApiKey,
        pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
      },
    });

    fileCID = response.data.IpfsHash; // Store CID for potential rollback

    // Step 3: Blockchain
    setUploadStatus(prev => ({
      ...prev,
      stage: 'blockchain'
    }));

    await new Promise(resolve => setTimeout(resolve, 1200));

    // Try blockchain operation first
    try {
      await axios.post("http://localhost:3001/upload", {
        cid: fileCID,
        size: file.size
      });
    } catch (blockchainError) {
      // If blockchain fails, rollback the Pinata upload
      console.error("Blockchain transaction failed:", blockchainError);
      
      try {
        await axios.delete(`https://api.pinata.cloud/pinning/unpin/${fileCID}`, {
          headers: {
            pinata_api_key: pinataConfig.pinataApiKey,
            pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
          },
        });
        console.log("Successfully rolled back Pinata upload");
      } catch (rollbackError) {
        console.error("Failed to rollback Pinata upload:", rollbackError);
      }
      
      throw new Error("Blockchain transaction failed. Upload cancelled.");
    }

    // Only add to Firestore if blockchain succeeds
    await addDoc(collection(db, "files"), {
      userId: user.uid,
      fileCID,
      type: file.type || "unknown",
      timestamp: new Date(),
    });

    // Step 4: Success
    setUploadStatus(prev => ({
      ...prev,
      stage: 'success'
    }));

    setTimeout(() => {
      setUploadStatus({
        isOpen: false,
        stage: 'encrypting',
        fileName: ''
      });
      setLoading(false);
    }, 2500);

    fetchPinnedFilesFromPinata(user.uid);

  } catch (error) {
    console.error("Upload failed:", error);
    alert("Upload failed: " + error.message);
    setUploadStatus({
      isOpen: false,
      stage: 'encrypting',
      fileName: ''
    });
    setLoading(false);
  }
};

  const handleDelete = async (fileCID) => {
    try {
      await axios.delete(`https://api.pinata.cloud/pinning/unpin/${fileCID}`, {
        headers: {
          pinata_api_key: pinataConfig.pinataApiKey,
          pinata_secret_api_key: pinataConfig.pinataSecretApiKey,
        },
      });

      await axios.post("http://localhost:3001/delete", { cid: fileCID });

      alert("File deleted successfully.");
      setFiles(prev => prev.filter(f => f.fileCID !== fileCID));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete.");
    }
  };

  const handlePreview = async (file) => {
    try {
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${file.fileCID}`);
      const encryptedText = await res.text();

      const decryptedBytes = decryptFile(encryptedText);

      const blob = new Blob([decryptedBytes], { type: file.type });
      const url = URL.createObjectURL(blob);

      setPreview({
        isOpen: true,
        type: file.type,
        content: url,
        fileName: file.fileName
      });
    } catch (err) {
      console.error("Decryption failed:", err);
      alert("Preview failed. Something went wrong.");
    }
  };

  const closePreview = () => {
    setPreview({
      isOpen: false,
      type: null,
      content: null,
      fileName: ''
    });
  };

  // New Welcome Modal Component
  const WelcomeModal = () => {
    if (!showWelcomeModal) return null;

    return (
      <div className="welcome-modal-overlay">
        <div className="welcome-modal">
          <div className="welcome-modal-content">
            <div className="welcome-animation">
              <div className="welcome-icon">
                <div className="icon-glow"></div>
                <span className="welcome-emoji">📁</span>
              </div>
            </div>
            <h2 className="welcome-title">Welcome to Nebula</h2>         
            <div className="welcome-loading">
              <div className="loading-bar">
                <div className="loading-progress"></div>
              </div>
            </div>
            <p className="welcome-description">
              Please wait while your files are being loaded...
            </p>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => {
    if (!uploadStatus.isOpen) return null;

    const getStageInfo = () => {
      switch (uploadStatus.stage) {
        case 'encrypting':
          return {
            title: 'Encrypting File',
            icon: '🔐',
            description: 'Securing your file with AES encryption...',
            color: '#ff6b6b'
          };
        case 'uploading':
          return {
            title: 'Uploading to IPFS',
            icon: '🚀',
            description: 'Storing your encrypted file on IPFS...',
            color: '#4ecdc4'
          };
        case 'blockchain':
          return {
            title: 'Processing Blockchain',
            icon: '⛓️',
            description: 'Recording transaction on blockchain...',
            color: '#45b7d1'
          };
        case 'success':
          return {
            title: 'Upload Complete!',
            icon: '✅',
            description: (
              <div style={{ textAlign: 'left', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>🔐</span>
                  <span>File Encryption</span>
                  <span style={{ marginLeft: 'auto', color: '#96ceb4' }}>✅</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>🚀</span>
                  <span>IPFS Upload</span>
                  <span style={{ marginLeft: 'auto', color: '#96ceb4' }}>✅</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>⛓️</span>
                  <span>Blockchain Processing</span>
                  <span style={{ marginLeft: 'auto', color: '#96ceb4' }}>✅</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', padding: '10px', backgroundColor: 'rgba(150, 206, 180, 0.1)', borderRadius: '5px' }}>
                  <span style={{ marginRight: '8px' }}>🎉</span>
                  <span style={{ fontWeight: 'bold' }}>Your file has been successfully uploaded and secured!</span>
                </div>
              </div>
            ),
            color: '#96ceb4'
          };
        default:
          return {
            title: 'Processing',
            icon: '⏳',
            description: 'Please wait...',
            color: '#ffa500'
          };
      }
    };

    const stageInfo = getStageInfo();

    return (
      <div className="upload-modal-overlay">
        <div className="upload-modal" data-stage={uploadStatus.stage}>
          <div className="upload-modal-content">
            <div className="upload-icon-container">
              <div className="upload-icon" style={{ backgroundColor: stageInfo.color }}>
                <span className="upload-emoji">{stageInfo.icon}</span>
              </div>
            </div>

            <h3 className="upload-title">{stageInfo.title}</h3>
            <div className="upload-description">
              {typeof stageInfo.description === 'string' ? (
                <p>{stageInfo.description}</p>
              ) : (
                stageInfo.description
              )}
            </div>
            <p className="upload-filename">{uploadStatus.fileName}</p>

            {uploadStatus.stage === 'success' && (
              <div className="upload-success-animation">
                <div className="success-checkmark">
                  <div className="check-icon">
                    <span className="icon-line line-tip"></span>
                    <span className="icon-line line-long"></span>
                    <div className="icon-circle"></div>
                    <div className="icon-fix"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PreviewOverlay = () => {
    if (!preview.isOpen) return null;

    const getPreviewContent = () => {
      switch (true) {
        case preview.type?.startsWith('image/'):
          return <img src={preview.content} alt={preview.fileName} className="enlarged-image" />;

        case preview.type?.startsWith('video/'):
          return <video src={preview.content} controls className="enlarged-image" autoPlay />;

        case preview.type === 'application/pdf':
          return <iframe src={preview.content} title={preview.fileName} className="enlarged-image pdf-viewer" />;

        default:
          return (
            <div className="preview-error">
              <p>Preview not available for this file type</p>
              <a href={preview.content} alt={preview.fileName} target="_blank" rel="noopener noreferrer" className="download-link">Download File</a>
            </div>
          );
      }
    };

    return (
      <div className={`overlay ${preview.isOpen ? 'show' : ''}`} onClick={closePreview}>
        <div className="enlarged-container" onClick={e => e.stopPropagation()}>
          {getPreviewContent()}
          <button className="close-preview-btn" onClick={closePreview}>×</button>
        </div>
      </div>
    );
  };

  const getFileIcon = (fileType) => {
    switch (true) {
      case fileType?.startsWith('image/jpeg'):
        return jpg;
      case fileType?.startsWith('image/png'):
        return png;
      case fileType?.startsWith('audio/'):
        return audio;
      case fileType === 'application/pdf':
        return pdf;
      default:
        return jpeg;
    }
  };

  return (
    <div className="app-wrapper">
      <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}></div>

      <div style={{ position: "absolute", top: "20px", right: "30px", zIndex: 10, display: "flex", gap: "10px", alignItems: "center" }}>
        <button id="btn1" onClick={handleLogout}>Logout</button>
      </div>

      <div className="hello">
        <h2 className="welcome-text">Welcome <span style={{ color: "#ffa500" }}>{user ? user.email : ""}</span></h2>

        <button onClick={handleFileSelect} id="btn2" disabled={loading} style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          <p id="button__text">
            {[...'UPLOAD YOUR FILE'].map((char, index) => (
              <span key={index} style={{ "--index": index }}>{char}</span>
            ))}
          </p>
          <div id="button__circle">
            <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="button__icon" width="14">
              <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor"></path>
            </svg>
            <svg viewBox="0 0 14 15" fill="none" width="14" xmlns="http://www.w3.org/2000/svg" className="button__icon button__icon--copy">
              <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor"></path>
            </svg>
          </div>
        </button>
      </div>

      <div className="files-grid">
        {files.map((file, index) => (
          <div key={index} className="file-card" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => handlePreview(file)}>
            <div className="file-info">
              <img src={getFileIcon(file.type)} alt="file type" />
              <span id="file-name">{file.fileName}</span>
            </div>

            {file.type.startsWith("image/") && (
              <img src={file.previewURL} alt="Uploaded" className="file-image" />
            )}
            {file.type === "video/mp4" && (
              <video src={file.previewURL} muted loop autoPlay playsInline className="file-video" />
            )}
            {file.type === "application/pdf" && (
              <div className="pdf-preview">
                <iframe src={file.previewURL} title="PDF" className="file-pdf" />
              </div>
            )}

            {hoveredIndex === index && (
              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(file.fileCID); }}>✕</button>
            )}
          </div>
        ))}
      </div>

      <WelcomeModal />
      <UploadModal />
      <PreviewOverlay />
    </div>
  );
};

export default Home;