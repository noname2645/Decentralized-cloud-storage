import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { db, auth, contractABI, NEBULA_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "./config.js";
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import "../stylesheets/home.css";
import { encryptFile, decryptFile } from "./aesUtils.js";
import { PDFThumbnail, PDFFullViewer } from "./PDFRenderer.jsx";
import CryptoJS from "crypto-js";
import { 
  Cloud, 
  Search, 
  UploadCloud, 
  LogOut, 
  Network, 
  Check, 
  Copy, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  File as FileIcon, 
  ExternalLink,
  Loader2,
  HardDrive,
  Wallet,
  AlertCircle
} from "lucide-react";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [user, setUser] = useState(null);
  
  // Custom user-specific encryption key
  const [userKey, setUserKey] = useState(null);
  
  // Wallet (MetaMask) state
  const [walletAddress,   setWalletAddress]   = useState(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  // Custom Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedCID, setCopiedCID] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Lazy previews & DOM cards tracking
  const [previewCache, setPreviewCache] = useState({});
  const fileCardsRef = useRef({});
  
  const [uploadStatus, setUploadStatus] = useState({
    isOpen: false,
    stage: "encrypting", // 'encrypting', 'uploading', 'blockchain', 'success'
    fileName: "",
  });
  
  const [preview, setPreview] = useState({
    isOpen: false,
    type: null,
    content: null,
    fileName: "",
    transactionHash: "",
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

  // Auto-detect backend URL
  const backendBaseURL =
    window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : "https://decentralized-cloud-storage.onrender.com";

  // ─── MetaMask Wallet Connection ─────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it from metamask.io");
      return null;
    }
    try {
      setWalletConnecting(true);

      // Request accounts
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address  = accounts[0];

      // Ensure user is on Sepolia (chain 0xaa36a7 = 11155111)
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method:  "wallet_switchEthereumChain",
            params:  [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchErr) {
          // Chain not added yet — add it
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId:         SEPOLIA_CHAIN_ID,
                chainName:       "Sepolia Testnet",
                nativeCurrency:  { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls:         ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }

      setWalletAddress(address);
      setWalletConnecting(false);
      return address;
    } catch (err) {
      console.error("Wallet connect failed:", err);
      setWalletConnecting(false);
      return null;
    }
  };

  // Re-sync wallet on page load if already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0] || null);
      });
    }
  }, []);

  // Helper: sign a message hash with MetaMask personal_sign (FREE — no gas)
  const signMessage = async (msgHash) => {
    if (!window.ethereum) throw new Error("MetaMask not available");
    // personal_sign expects the data as hex string
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const account  = accounts[0];
    if (!account) throw new Error("No wallet connected");
    // eth_sign on the raw hash bytes
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [msgHash, account],
    });
    return { signature, account };
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowWelcomeModal(true);
        try {
          // SEC-02: Retrieve or generate unique AES key for this user in Firestore
          let keyVal = null;
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && userDocSnap.data().aesKey) {
            keyVal = userDocSnap.data().aesKey;
          } else {
            // Generate secure random 256-bit user key
            keyVal = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
            await setDoc(userDocRef, { aesKey: keyVal }, { merge: true });
          }
          
          setUserKey(keyVal);
          await fetchPinnedFilesFromBackend(currentUser);
        } catch (err) {
          console.error("Failed to load user credentials:", err);
          setInitialLoadComplete(true);
          setShowWelcomeModal(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPinnedFilesFromBackend = async (currentUser) => {
    try {
      // SEC-03: Retrieve Firebase ID Token
      const idToken = await currentUser.getIdToken(true);

      // Get files from Firestore to get transaction hashes
      const filesSnapshot = await getDocs(
        query(collection(db, "files"), where("userId", "==", currentUser.uid)),
      );
      const firestoreFiles = {};

      filesSnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreFiles[data.fileCID] = {
          transactionHash: data.transactionHash,
          timestamp: data.timestamp,
        };
      });

      // SEC-01: Call backend proxy to fetch Pinata rows securely
      const res = await axios.get(`${backendBaseURL}/api/user-files`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      // Map rows from backend response
      const filesList = res.data.rows.map((file) => {
        const fileCID = file.ipfs_pin_hash;
        const type = file.metadata?.keyvalues?.type || "unknown";
        const firestoreData = firestoreFiles[fileCID] || {};

        return {
          fileCID,
          fileName:
            file.metadata?.keyvalues?.name ||
            file.metadata?.name ||
            file.file_name,
          type,
          previewURL: null,
          transactionHash: firestoreData.transactionHash,
          timestamp: firestoreData.timestamp,
        };
      });

      // Sort by timestamp (newest first)
      filesList.sort(
        (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0),
      );

      setFiles(filesList);
      setPreviewCache({}); // Reset preview cache on refresh
      setInitialLoadComplete(true);
      setShowWelcomeModal(false);
    } catch (err) {
      console.error("Error fetching files via backend:", err);
      setFiles([]);
      setInitialLoadComplete(true);
      setShowWelcomeModal(false);
    }
  };

  // Lazy preview loader — downloads and decrypts a single file on demand
  const loadPreview = useCallback(async (fileCID, type) => {
    if (!userKey || !(type?.startsWith("image/") || type?.startsWith("video/") || type === "application/pdf")) return;
    try {
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${fileCID}`);
      const encryptedText = await res.text();
      const decryptedBytes = decryptFile(encryptedText, userKey);

      if (type === "application/pdf") {
        // Store raw Uint8Array bytes — PDFThumbnail renders them via PDF.js (no blob URL needed)
        setPreviewCache((prev) => ({ ...prev, [fileCID]: decryptedBytes }));
      } else {
        // Images and videos use blob object URLs
        const blob = new Blob([decryptedBytes], { type });
        const url = URL.createObjectURL(blob);
        setPreviewCache((prev) => ({ ...prev, [fileCID]: url }));
      }
    } catch (err) {
      console.error("Failed to load preview for CID:", fileCID);
    }
  }, [userKey]);

  // IntersectionObserver: load previews only when file cards scroll into view
  useEffect(() => {
    if (!files.length || !userKey) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cid = entry.target.dataset.cid;
            const type = entry.target.dataset.type;
            if (cid && !previewCache[cid]) {
              loadPreview(cid, type);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    Object.entries(fileCardsRef.current).forEach(([cid, el]) => {
      if (el && !previewCache[cid]) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [files, loadPreview, previewCache, userKey]);

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      "image/jpeg,image/png,image/gif,image/webp,image/jpg,.pdf,video/mp4,video/quicktime";
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
    if (!file || !user || !userKey) {
      alert("Please log in first.");
      return;
    }

    setLoading(true);

    try {
      // ── Step 1: AES-256 Encrypt ────────────────────────────────────────────
      setUploadStatus({ isOpen: true, stage: "encrypting", fileName: file.name });
      await new Promise((r) => setTimeout(r, 300));
      const originalBuffer  = await file.arrayBuffer();
      const encryptedString = encryptFile(originalBuffer, userKey);

      // ── Step 2: Upload encrypted blob to IPFS (backend handles Pinata) ─────
      setUploadStatus((p) => ({ ...p, stage: "uploading" }));
      const idToken = await user.getIdToken(true);

      // ── Step 3: Sign message for blockchain (FREE — personal_sign, no gas) ─
      setUploadStatus((p) => ({ ...p, stage: "blockchain" }));

      let signatureData = {};

      if (walletAddress) {
        try {
          // Ask backend for nonce + deadline first (we need CID from IPFS first)
          // So we upload to IPFS first, then sign with the returned CID
          // Upload without signature to get CID
          const ipfsRes = await axios.post(
            `${backendBaseURL}/api/upload`,
            { fileName: file.name, ciphertext: encryptedString, fileType: file.type || "unknown", fileSize: file.size },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          const { fileCID } = ipfsRes.data;

          // Get nonce + deadline from backend
          const prepRes = await axios.post(
            `${backendBaseURL}/api/prepare-upload`,
            { userAddress: walletAddress, fileName: file.name, fileCID },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          const { nonce, deadline, msgHash } = prepRes.data;

          // Sign the hash with MetaMask — this is FREE, no gas popup!
          const { signature } = await signMessage(msgHash);

          // Send signature to backend — backend pays gas and relays the tx
          const finalRes = await axios.post(
            `${backendBaseURL}/api/relay-upload`,
            { fileName: file.name, fileCID, userAddress: walletAddress, signature, nonce, deadline },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          signatureData = {
            fileCID,
            transactionHash: finalRes.data.txHash,
            blockNumber:     finalRes.data.blockNumber,
          };
        } catch (signErr) {
          // Wallet sign cancelled or failed — still save to IPFS-only
          if (signErr.code === 4001) {
            console.warn("User cancelled signature — saving IPFS-only");
          } else {
            console.warn("Signature/relay failed:", signErr.message);
          }
          // Fall through and do IPFS-only upload below
        }
      }

      // If no wallet or signature flow not used, do plain IPFS upload
      if (!signatureData.fileCID) {
        const ipfsRes = await axios.post(
          `${backendBaseURL}/api/upload`,
          { fileName: file.name, ciphertext: encryptedString, fileType: file.type || "unknown", fileSize: file.size },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        signatureData.fileCID = ipfsRes.data.fileCID;
      }

      // ── Step 4: Store receipt in Firestore ────────────────────────────────
      await addDoc(collection(db, "files"), {
        userId:          user.uid,
        walletAddress:   walletAddress || null,
        fileCID:         signatureData.fileCID,
        transactionHash: signatureData.transactionHash || null,
        blockNumber:     signatureData.blockNumber     || null,
        type:            file.type || "unknown",
        timestamp:       new Date(),
      });

      // ── Step 5: Success ───────────────────────────────────────────────────
      setUploadStatus((p) => ({ ...p, stage: "success" }));
      setTimeout(() => {
        setUploadStatus({ isOpen: false, stage: "encrypting", fileName: "" });
        setLoading(false);
      }, 1200);

      fetchPinnedFilesFromBackend(user);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + (error.response?.data?.details || error.message));
      setUploadStatus({ isOpen: false, stage: "encrypting", fileName: "" });
      setLoading(false);
    }
  };

  const handleDelete = async (fileCID, onChainFileId) => {
    if (!window.confirm("Delete this file from IPFS and the blockchain record?")) return;

    try {
      const idToken = await user.getIdToken(true);

      // 1. Unpin from Pinata IPFS (backend)
      await axios.post(
        `${backendBaseURL}/api/delete`,
        { cid: fileCID },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      // 2. If we have the on-chain fileId, soft-delete via user's wallet
      if (onChainFileId && walletAddress) {
        try {
          const contract = await getSignedContract();
          const tx = await contract.deleteFile(onChainFileId);
          await tx.wait();
          console.log("✅ On-chain soft-delete confirmed:", tx.hash);
        } catch (chainErr) {
          // User rejected or not owner — still remove from UI
          console.warn("On-chain delete skipped:", chainErr.message);
        }
      }

      setFiles((prev) => prev.filter((f) => f.fileCID !== fileCID));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete: " + error.message);
    }
  };

  const handlePreview = async (file) => {
    try {
      const cached = previewCache[file.fileCID];
      if (cached) {
        setPreview({
          isOpen: true,
          type: file.type,
          content: cached, // Uint8Array for PDFs, blob URL for images/videos
          fileName: file.fileName,
          transactionHash: file.transactionHash,
        });
        return;
      }

      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${file.fileCID}`);
      const encryptedText = await res.text();
      const decryptedBytes = decryptFile(encryptedText, userKey);

      let content;
      if (file.type === "application/pdf") {
        // Keep raw bytes for PDF.js — no blob URL needed
        content = decryptedBytes;
      } else {
        const blob = new Blob([decryptedBytes], { type: file.type });
        content = URL.createObjectURL(blob);
      }

      // Cache for next open
      setPreviewCache((prev) => ({ ...prev, [file.fileCID]: content }));

      setPreview({
        isOpen: true,
        type: file.type,
        content,
        fileName: file.fileName,
        transactionHash: file.transactionHash,
      });
    } catch (err) {
      console.error("❌ Preview failed:", err);
      alert("Preview failed: " + err.message);
    }
  };

  const closePreview = () => {
    setPreview({
      isOpen: false,
      type: null,
      content: null,
      fileName: "",
      transactionHash: "",
    });
  };

  const handleCopyCID = (e, cid) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cid);
    setCopiedCID(cid);
    setTimeout(() => setCopiedCID(null), 2000);
  };

  const getFileCategory = (type) => {
    if (type?.startsWith("image/")) return "Images";
    if (type?.startsWith("video/")) return "Videos";
    if (type === "application/pdf" || type?.startsWith("text/")) return "Documents";
    return "Others";
  };

  // Filter and search logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || getFileCategory(file.type) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals for navigation stats
  const totalFiles = files.length;
  const imageCount = files.filter(f => getFileCategory(f.type) === "Images").length;
  const videoCount = files.filter(f => getFileCategory(f.type) === "Videos").length;
  const docCount = files.filter(f => getFileCategory(f.type) === "Documents").length;
  const otherCount = files.filter(f => getFileCategory(f.type) === "Others").length;

  const getFileIconComponent = (fileType) => {
    if (fileType?.startsWith("image/")) return <ImageIcon className="fallback-type-icon-img" style={{ color: "#38bdf8" }} />;
    if (fileType?.startsWith("video/")) return <VideoIcon className="fallback-type-icon-img" style={{ color: "#a855f7" }} />;
    if (fileType === "application/pdf") return <FileText className="fallback-type-icon-img" style={{ color: "#ef4444" }} />;
    return <FileIcon className="fallback-type-icon-img" style={{ color: "#64748b" }} />;
  };

  // Welcome Modal Component
  const WelcomeModal = () => {
    if (!showWelcomeModal) return null;
    return (
      <div className="welcome-modal-overlay">
        <div className="welcome-modal">
          <div className="welcome-icon-box">
            <Cloud />
          </div>
          <h2 className="welcome-title-glow">Nebula Vault</h2>
          <p className="welcome-desc-text">
            Connecting node networks and synchronizing private encrypted assets.
          </p>
          <div className="hologram-loader-bar">
            <div className="hologram-progress-fill"></div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Modal Component
  const UploadModal = () => {
    if (!uploadStatus.isOpen) return null;

    const getStageDetails = () => {
      switch (uploadStatus.stage) {
        case "encrypting":
          return {
            title: "Securing Content",
            desc: "Encrypting local buffer with user-derived AES-256...",
            color: "rgba(239, 68, 68, 0.2)",
            borderColor: "rgba(239, 68, 68, 0.4)",
            icon: "🔐",
            index: 0
          };
        case "uploading":
          return {
            title: "Relaying payload",
            desc: "Pulsing encrypted bytes to IPFS storage nodes...",
            color: "rgba(56, 189, 248, 0.2)",
            borderColor: "rgba(56, 189, 248, 0.4)",
            icon: "🛰️",
            index: 1
          };
        case "blockchain":
          return {
            title: "Web3 Ledger Entry",
            desc: "Committing tamper-proof cryptographic audit log to Sepolia...",
            color: "rgba(168, 85, 247, 0.2)",
            borderColor: "rgba(168, 85, 247, 0.4)",
            icon: "⛓️",
            index: 2
          };
        case "success":
          return {
            title: "Broadcast Finalized",
            desc: "Block verification completed. Secured file index updated.",
            color: "rgba(16, 185, 129, 0.2)",
            borderColor: "rgba(16, 185, 129, 0.4)",
            icon: "✅",
            index: 3
          };
        default:
          return {
            title: "Syncing Nodes",
            desc: "Securing block transaction updates...",
            color: "rgba(100, 116, 139, 0.2)",
            borderColor: "rgba(100, 116, 139, 0.4)",
            icon: "⏳",
            index: 0
          };
      }
    };

    const details = getStageDetails();
    const steps = [
      { id: "encrypting", label: "Local Cryptography Encryption", icon: "🔐" },
      { id: "uploading", label: "Decentralized IPFS Storage", icon: "🛰️" },
      { id: "blockchain", label: "Ethereum Contract Verification", icon: "⛓️" }
    ];

    return (
      <div className="upload-modal-overlay">
        <div className="upload-modal-box">
          <div 
            className="upload-icon-glow-ring" 
            style={{ 
              backgroundColor: details.color, 
              border: `1px solid ${details.borderColor}`,
              boxShadow: `0 0 25px ${details.color}`
            }}
          >
            <span>{details.icon}</span>
          </div>

          <h3 className="upload-process-title">{details.title}</h3>
          <p className="upload-process-subtitle">{details.desc}</p>
          <span className="uploading-filename-txt">{uploadStatus.fileName}</span>

          <div className="stages-flow-checklist">
            {steps.map((step, idx) => {
              const isCompleted = idx < details.index;
              const isActive = uploadStatus.stage === step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={`checklist-step-row ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-label-group">
                    <span style={{ fontSize: "1.1rem" }}>{step.icon}</span>
                    <span>{step.label}</span>
                  </div>
                  <div className="step-status-icon-wrap">
                    {isCompleted ? (
                      <Check style={{ color: "#10b981" }} />
                    ) : isActive ? (
                      <Loader2 className="process-loading-spinner-svg" style={{ color: "#4facfe" }} />
                    ) : (
                      <span style={{ color: "#475569", fontSize: "0.85rem" }}>Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Preview Overlay Modal Component
  const PreviewOverlay = () => {
    if (!preview.isOpen) return null;

    const getPreviewContent = () => {
      if (preview.type?.startsWith("image/")) {
        return <img src={preview.content} alt={preview.fileName} />;
      }
      if (preview.type?.startsWith("video/")) {
        return <video src={preview.content} controls autoPlay />;
      }
      if (preview.type === "application/pdf") {
        // preview.content is a Uint8Array — render all pages via PDF.js
        return <PDFFullViewer pdfBytes={preview.content} />;
      }
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>Interactive preview unavailable for this type.</p>
          <a
            href={preview.content}
            download={preview.fileName}
            className="tx-scan-link-btn"
            style={{ display: "inline-flex" }}
          >
            Download File
          </a>
        </div>
      );
    };

    return (
      <div className={`media-overlay-backdrop ${preview.isOpen ? "active-overlay" : ""}`} onClick={closePreview}>
        <div className="media-enlarged-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="media-modal-header">
            <h3 className="media-modal-title">{preview.fileName}</h3>
            <button className="close-modal-round-btn" onClick={closePreview}>×</button>
          </div>

          <div className="media-modal-body">
            {getPreviewContent()}
          </div>

          {preview.transactionHash && (
            <div className="media-modal-transaction-bar">
              <div className="modal-tx-row">
                <div className="modal-tx-label-box">
                  <Network />
                  <span>Ledger Verify:</span>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${preview.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-tx-link-hash"
                  title="View Contract Proof on Etherscan"
                >
                  <span>{preview.transactionHash}</span>
                  <ExternalLink />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">
            <Cloud />
          </div>
          <span className="logo-text-title">Nebula</span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <button 
              className={`menu-item-btn ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => setSelectedCategory("All")}
            >
              <div className="menu-item-left">
                <HardDrive />
                <span>All Drive</span>
              </div>
              <span className="category-badge-count">{totalFiles}</span>
            </button>
          </li>
          <li>
            <button 
              className={`menu-item-btn ${selectedCategory === "Images" ? "active" : ""}`}
              onClick={() => setSelectedCategory("Images")}
            >
              <div className="menu-item-left">
                <ImageIcon />
                <span>Images</span>
              </div>
              <span className="category-badge-count">{imageCount}</span>
            </button>
          </li>
          <li>
            <button 
              className={`menu-item-btn ${selectedCategory === "Videos" ? "active" : ""}`}
              onClick={() => setSelectedCategory("Videos")}
            >
              <div className="menu-item-left">
                <VideoIcon />
                <span>Videos</span>
              </div>
              <span className="category-badge-count">{videoCount}</span>
            </button>
          </li>
          <li>
            <button 
              className={`menu-item-btn ${selectedCategory === "Documents" ? "active" : ""}`}
              onClick={() => setSelectedCategory("Documents")}
            >
              <div className="menu-item-left">
                <FileText />
                <span>Documents</span>
              </div>
              <span className="category-badge-count">{docCount}</span>
            </button>
          </li>
        </ul>

        {/* Network & Block Index Info */}
        <div className="sidebar-status-panel">
          <div className="status-row">
            <span className="status-label">Network</span>
            <div className="status-value-badge">
              <span className="status-indicator-dot active"></span>
              <span>Sepolia Testnet</span>
            </div>
          </div>
          <div className="status-row">
            <span className="status-label">Storage</span>
            <div className="status-value-badge">
              <span className="status-indicator-dot active"></span>
              <span>Pinata IPFS</span>
            </div>
          </div>
          <div className="status-row">
            <span className="status-label">Wallet</span>
            <div className="status-value-badge">
              {walletAddress ? (
                <>
                  <span className="status-indicator-dot active"></span>
                  <span title={walletAddress}>
                    {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--warning)", fontSize: "0.75rem" }}>Not connected</span>
              )}
            </div>
          </div>
          <div className="status-row">
            <span className="status-label">Encryption</span>
            <div className="status-value-badge">
              <span>AES-256</span>
            </div>
          </div>
        </div>

        {/* Wallet Connect Button */}
        {!walletAddress ? (
          <button
            className="wallet-connect-btn"
            onClick={connectWallet}
            disabled={walletConnecting}
          >
            <Wallet size={15} />
            <span>{walletConnecting ? "Connecting…" : "Connect Wallet"}</span>
          </button>
        ) : (
          <div className="wallet-connected-pill">
            <span className="wallet-dot-active" />
            <span title={walletAddress}>
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </span>
            <button
              className="wallet-disconnect-btn"
              onClick={() => setWalletAddress(null)}
              title="Disconnect wallet"
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Card Info */}
        <div className="sidebar-profile">
          <div className="profile-detail-box">
            <div className="profile-avatar-icon">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
            </div>
            <span className="profile-email-text" title={user?.email}>
              {user?.email || "Unknown Guest"}
            </span>
          </div>
          <button className="logout-icon-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-dashboard-content">
        {/* Top Controls Header */}
        <header className="dashboard-controls-header">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="Search by filename" 
              className="search-input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon-svg" />
          </div>

          <div className="header-actions-panel">
            {/* Wallet connect shortcut in header if not already shown in sidebar */}
            {!walletAddress && (
              <button
                className="wallet-connect-btn-inline"
                onClick={connectWallet}
                disabled={walletConnecting}
                title="Connect MetaMask to sign blockchain transactions"
              >
                <AlertCircle size={15} />
                <span>Connect Wallet</span>
              </button>
            )}
            <button 
              className="upload-action-btn"
              onClick={handleFileSelect}
              disabled={loading}
            >
              <UploadCloud size={18} />
              <span>Upload file</span>
            </button>
          </div>
        </header>

        {/* Welcome Banner */}
        <section className="welcome-hero-banner">
          <div className="welcome-banner-left">
            <h1 className="welcome-banner-title">
              Secured Web3 <span>Vault</span>
            </h1>
            <p className="welcome-banner-desc">
              All files are client-side AES encrypted before broadcast, distributed redundantly across IPFS, and verified via immutable Ethereum ledger receipts.
            </p>
          </div>

          <div className="welcome-banner-metrics">
            <div className="metrics-status-card">
              <div className="metric-num-val">{filteredFiles.length}</div>
              <div className="metric-lbl-text">Files Displayed</div>
            </div>
            <div className="metrics-status-card">
              <div className="metric-num-val">{files.length}</div>
              <div className="metric-lbl-text">Total Secured</div>
            </div>
          </div>
        </section>

        {/* Active Files Grid */}
        <section>
          <h2 className="files-grid-section-heading">
            {selectedCategory} <span>({filteredFiles.length})</span>
          </h2>

          {filteredFiles.length === 0 ? (
            <div className="empty-state-card-view">
              <div className="empty-state-glow-icon-wrap">
                <Cloud />
              </div>
              <h3 className="empty-state-title">No Secured Files Located</h3>
              <p className="empty-state-desc">
                {searchQuery 
                  ? `No matching records found for "${searchQuery}" in your current filter category.` 
                  : "Your decentralized locker is currently empty. Protect and broadcast your files instantly using client-side cryptography."}
              </p>
              {!searchQuery && (
                <button className="empty-state-upload-btn" onClick={handleFileSelect}>
                  <UploadCloud size={16} />
                  <span>Secure Your First File</span>
                </button>
              )}
            </div>
          ) : (
            <div className="files-layout-grid">
              {filteredFiles.map((file, index) => {
                const cachedPreview = previewCache[file.fileCID];
                // Blob URL string for images/videos, Uint8Array for PDFs
                const cachedPreviewUrl = typeof cachedPreview === "string" ? cachedPreview : null;
                const cachedPdfBytes = cachedPreview instanceof Uint8Array ? cachedPreview : null;
                const hasPreviewType = file.type?.startsWith("image/") || file.type?.startsWith("video/") || file.type === "application/pdf";
                
                return (
                  <div 
                    key={file.fileCID}
                    ref={(el) => { fileCardsRef.current[file.fileCID] = el; }}
                    data-cid={file.fileCID}
                    data-type={file.type}
                    className="glass-file-card"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => handlePreview(file)}
                  >
                    {/* Media Display Preview / Fallback icons */}
                    <div className="card-media-view-box">
                      {file.type?.startsWith("image/") && cachedPreviewUrl ? (
                        <img src={cachedPreviewUrl} alt={file.fileName} loading="lazy" />
                      ) : file.type?.startsWith("video/") && cachedPreviewUrl ? (
                        <video src={cachedPreviewUrl} muted loop autoPlay playsInline />
                      ) : file.type === "application/pdf" && cachedPdfBytes ? (
                        // PDF.js thumbnail — renders page 1 directly to canvas
                        <PDFThumbnail pdfBytes={cachedPdfBytes} width={280} />
                      ) : (
                        <div className="card-fallback-doc-box">
                          {getFileIconComponent(file.type)}
                          <span className="fallback-badge-info-label">
                            {file.type?.split("/")[1]?.toUpperCase() || "BIN"}
                          </span>
                        </div>
                      )}

                      {/* Shimmer loader while content is decrypting client-side */}
                      {hasPreviewType && !cachedPreviewUrl && !cachedPdfBytes && (
                        <div className="preview-skeleton">
                          <span>Decrypting Block...</span>
                        </div>
                      )}
                    </div>

                    {/* Meta Footer Details panel */}
                    <div className="file-card-details-footer">
                      <div className="file-title-row-box">
                        <h4 className="file-display-name-text" title={file.fileName}>
                          {file.fileName}
                        </h4>
                        <span className="file-type-pill-label">
                          {file.type?.split("/")[0] || "File"}
                        </span>
                      </div>

                      <div className="file-details-meta-row">
                        {file.transactionHash ? (
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${file.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tx-scan-link-btn"
                            onClick={(e) => e.stopPropagation()}
                            title="Verify Smart Contract Transaction proof"
                          >
                            <span>Etherscan Proof</span>
                            <ExternalLink />
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-sub)" }}>Off-ledger proof</span>
                        )}

                        <button 
                          className="round-control-action-btn"
                          onClick={(e) => handleCopyCID(e, file.fileCID)}
                          title="Copy Decentralized IPFS CID Reference Hash"
                          style={{ color: copiedCID === file.fileCID ? "var(--success)" : "inherit" }}
                        >
                          {copiedCID === file.fileCID ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Card Actions overlay buttons */}
                    <div className="card-overlay-actions-top">
                      <button 
                        className="round-control-action-btn delete-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.fileCID, file.onChainFileId);
                        }}
                        title="Delete Secure Node Resource"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Overlay Modals */}
      <WelcomeModal />
      <UploadModal />
      <PreviewOverlay />
    </div>
  );
};

export default Home;
