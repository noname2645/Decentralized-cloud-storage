// Home.js
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { db, auth } from "../config.js";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { pinataConfig } from "../config.js";
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
  const [user, setUser] = useState(null);
  const mountRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    isOpen: false,
    stage: 'encrypting', // 'encrypting', 'uploading', 'blockchain', 'success'
    progress: 0,
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

  const simulateProgress = (stage, duration) => {
    return new Promise((resolve) => {
      // Set initial state without progress jump
      setUploadStatus(prev => ({
        ...prev,
        stage,
        progress: 0 // Start at 0, not jumping to any value
      }));

      let progress = 0;
      const totalSteps = 100;
      const stepDuration = duration / totalSteps;

      const updateProgress = () => {
        progress += 1;

        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min(progress, 100)
        }));

        if (progress >= 100) {
          // Small delay before resolving to show 100% completion
          setTimeout(resolve, 150);
        } else {
          setTimeout(updateProgress, stepDuration);
        }
      };

      // Start the progress animation with a small delay to prevent jitter
      setTimeout(updateProgress, 50);
    });
  };

  // Alternative smoother version using requestAnimationFrame
  const simulateProgressSmooth = (stage, duration) => {
    return new Promise((resolve) => {
      setUploadStatus(prev => ({
        ...prev,
        stage,
        progress: 0
      }));

      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        setUploadStatus(prev => ({
          ...prev,
          progress: Math.round(progress)
        }));

        if (progress >= 100) {
          setTimeout(resolve, 100);
        } else {
          requestAnimationFrame(animate);
        }
      };

      // Start animation with small delay to prevent jitter
      setTimeout(() => requestAnimationFrame(animate), 50);
    });
  };

  // Updated handleUpload function with better stage management
  // Option 1: Completely remove delays between stages
const handleUpload = async (file) => {
  if (!file || !user) {
    alert("Please log in first.");
    return;
  }

  setLoading(true);

  // Initialize modal with first stage
  setUploadStatus({
    isOpen: true,
    stage: 'encrypting',
    progress: 100, // Set to 100% immediately
    fileName: file.name
  });

  try {
    // Stage 1: Encrypting - Complete immediately
    const originalBuffer = await file.arrayBuffer();
    const encryptedString = encryptFile(originalBuffer);
    const encryptedBlob = new Blob([encryptedString], { type: "text/plain" });
    const encryptedFile = new File([encryptedBlob], file.name + ".aes", { type: "text/plain" });

    // Stage 2: Uploading to IPFS - Show immediately after encryption
    setUploadStatus(prev => ({
      ...prev,
      stage: 'uploading',
      progress: 100
    }));

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

    const fileCID = response.data.IpfsHash;

    // Stage 3: Blockchain processing - Show immediately after upload
    setUploadStatus(prev => ({
      ...prev,
      stage: 'blockchain',
      progress: 100
    }));

    await axios.post("http://localhost:3001/upload", {
      cid: fileCID,
      size: file.size
    });

    await addDoc(collection(db, "files"), {
      userId: user.uid,
      fileCID,
      type: file.type || "unknown",
      timestamp: new Date(),
    });

    // Stage 4: Success - Show immediately after blockchain
    setUploadStatus(prev => ({
      ...prev,
      stage: 'success',
      progress: 100
    }));

    // Auto close after 2.5 seconds (keep this delay for success message)
    setTimeout(() => {
      setUploadStatus({
        isOpen: false,
        stage: 'encrypting',
        progress: 0,
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
      progress: 0,
      fileName: ''
    });
    setLoading(false);
  }
};

// Option 2: Keep minimal delays (200ms) for visual feedback
const handleUploadWithMinimalDelays = async (file) => {
  if (!file || !user) {
    alert("Please log in first.");
    return;
  }

  setLoading(true);

  // Initialize modal with first stage
  setUploadStatus({
    isOpen: true,
    stage: 'encrypting',
    progress: 100,
    fileName: file.name
  });

  try {
    // Stage 1: Encrypting
    const originalBuffer = await file.arrayBuffer();
    const encryptedString = encryptFile(originalBuffer);
    const encryptedBlob = new Blob([encryptedString], { type: "text/plain" });
    const encryptedFile = new File([encryptedBlob], file.name + ".aes", { type: "text/plain" });

    // Brief pause to show encryption completed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 2: Uploading to IPFS
    setUploadStatus(prev => ({
      ...prev,
      stage: 'uploading',
      progress: 100
    }));

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

    const fileCID = response.data.IpfsHash;

    // Brief pause to show upload completed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 3: Blockchain processing
    setUploadStatus(prev => ({
      ...prev,
      stage: 'blockchain',
      progress: 100
    }));

    await axios.post("http://localhost:3001/upload", {
      cid: fileCID,
      size: file.size
    });

    await addDoc(collection(db, "files"), {
      userId: user.uid,
      fileCID,
      type: file.type || "unknown",
      timestamp: new Date(),
    });

    // Brief pause to show blockchain completed
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 4: Success
    setUploadStatus(prev => ({
      ...prev,
      stage: 'success',
      progress: 100
    }));

    // Auto close after 2.5 seconds
    setTimeout(() => {
      setUploadStatus({
        isOpen: false,
        stage: 'encrypting',
        progress: 0,
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
        progress: 0,
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
            description: 'Your file has been successfully uploaded and secured.',
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
            <p className="upload-description">{stageInfo.description}</p>
            <p className="upload-filename">{uploadStatus.fileName}</p>

            <div className="upload-progress-container">
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{
                    width: `${uploadStatus.progress}%`,
                    backgroundColor: stageInfo.color
                  }}
                ></div>
              </div>
              <span className="upload-progress-text">{uploadStatus.progress}%</span>
            </div>

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

      <UploadModal />
      <PreviewOverlay />
    </div>
  );
};

export default Home;