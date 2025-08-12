import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
    apiKey: "AIzaSyD64I5-PlaRTKqzC5dP8VJCQqyn39cu63A",
    authDomain: "decentralized-cloud-stor-f3e80.firebaseapp.com",
    databaseURL: "https://decentralized-cloud-stor-f3e80-default-rtdb.firebaseio.com",
    projectId: "decentralized-cloud-stor-f3e80",
    storageBucket: "decentralized-cloud-stor-f3e80.firebasestorage.app",
    messagingSenderId: "1079390515711",
    appId: "1:1079390515711:web:fa60d08f3b7aa83df9f7ca"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


  export const pinataConfig = {
    pinataApiKey: "99d06493017333398cec",
    pinataSecretApiKey: "2f43eaba35fc6c463d8e11781558445bbff79583f7a397c6c7e15d806c644bfc"
};

export const contractAddress = {
  contractAddress: "0x6353B4a4Df241B12e565eB0Ddce7594Fd9d51f51", 
  BLAST_RPC_URL: "https://eth-sepolia.blastapi.io/2ce6555f-b97d-49d3-8168-9d8017670e65"
};

export const contractABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "fileId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "name": "FileUploaded",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "fileCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "files",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        }
      ],
      "name": "uploadFile",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_fileId",
          "type": "uint256"
        }
      ],
      "name": "getFile",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];