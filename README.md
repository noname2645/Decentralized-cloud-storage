# 🌩️ Nebula — Decentralized Cloud Storage System

A decentralized and secure file storage solution built using **Web3, IPFS, AES encryption, and Ethereum blockchain**.  
Created as a third-year mini project by a team of 3 Computer Engineering students 👨‍💻👩‍💻👨‍💻.

---

## 🚀 Project Overview

Nebula allows users to:

- 🔐 **Encrypt** files using AES-256
- 🗂️ **Upload** them to a decentralized network (IPFS via Pinata)
- ⛓️ **Store file metadata** on the Ethereum blockchain using a smart contract
- 🦊 **Sign transactions** via MetaMask for secure verification
- 🔁 **Fetch and decrypt** files securely

This ensures complete data privacy, immutability, and decentralization — the future of cloud storage!

---

## 🛠 Tech Stack

| Technology              | Purpose                                          |
|-------------------------|--------------------------------------------------|
| ⚛️ React.js            | Frontend UI                                       |
| 🧠 Node.js + Express   | Backend server & API                              |
| 🔐 AES-256             | Client-side encryption                            |
| 🗃️ IPFS + Pinata       | Decentralized file storage                        |
| ⛓️ Ethereum + Solidity | Smart contracts for metadata                      |
| 🔌 ethers.js           | Blockchain interaction                            |
| 🔥 Firebase            | User authentication and storing file metadata     |
| 🦊 MetaMask            | Wallet & transaction signing                      |

---

## 📸 Project Flow
1. User uploads a file via the React frontend.
2. File is **AES-256 encrypted** before leaving the client.
3. Encrypted file is uploaded to **IPFS via Pinata**.
4. Metadata (file name + IPFS CID) is sent to a **Solidity smart contract** on **Ethereum Sepolia Testnet**. Then it is recorded on firestore database.
5. MetaMask signs and sends the transaction.
6. User can fetch, decrypt, and view their file securely.

---

## 🔒 AES-256 Encryption
Files are encrypted in-browser using the **AES-256 standard**.  When accessed directly from IPFS, files show ciphertext like: U2FsdGVkX182rVKp2SOMAjJwSIy4dVBid6GisgZZzm29nEVx.......

Check video on Linkedin : https://www.linkedin.com/posts/rohit-karmokar-654788257_web3-blockchain-ethereum-activity-7348041119387021312-PyqM?utm_source=share&utm_medium=member_desktop&rcm=ACoAAD9MBaAB-dvUSyFA06kJ_Kv9WzvaAcqhc8k

