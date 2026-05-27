import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ─── Firebase ─────────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── Blockchain ───────────────────────────────────────────────────────────────
// CONTRACT_ADDRESS is set in .env as VITE_NEBULA_CONTRACT_ADDRESS after deploy.
export const NEBULA_CONTRACT_ADDRESS =
  import.meta.env.VITE_NEBULA_CONTRACT_ADDRESS || "";

export const SEPOLIA_CHAIN_ID   = "0xaa36a7"; // 11155111 in hex
export const SEPOLIA_CHAIN_NAME = "Sepolia Testnet";
export const SEPOLIA_RPC_URL    = import.meta.env.VITE_BLAST_RPC_URL || "";

// ─── NebulaStorage ABI (Solidity 0.8.20) ────────────────────────────────────
// Generated from: contracts/NebulaStorage.sol
export const contractABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "fileId",    "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "name",      "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",  "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "uploader",  "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FileUploaded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "fileId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "owner",  "type": "address" }
    ],
    "name": "FileDeleted",
    "type": "event"
  },
  // Write functions
  {
    "inputs": [
      { "internalType": "string", "name": "_name",     "type": "string" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" }
    ],
    "name": "uploadFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_fileId", "type": "uint256" }
    ],
    "name": "deleteFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Read functions
  {
    "inputs": [],
    "name": "fileCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_fileId", "type": "uint256" }
    ],
    "name": "getFile",
    "outputs": [
      { "internalType": "string",  "name": "name",      "type": "string"  },
      { "internalType": "string",  "name": "ipfsHash",  "type": "string"  },
      { "internalType": "address", "name": "uploader",  "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool",    "name": "exists",    "type": "bool"    }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_owner", "type": "address" }
    ],
    "name": "getFilesByOwner",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "files",
    "outputs": [
      { "internalType": "string",  "name": "name",      "type": "string"  },
      { "internalType": "string",  "name": "ipfsHash",  "type": "string"  },
      { "internalType": "address", "name": "uploader",  "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool",    "name": "exists",    "type": "bool"    }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];