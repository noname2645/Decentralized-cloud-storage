import CryptoJS from "crypto-js";

// Fallback encryption key used only if the user's personal key isn't ready yet.
// In normal usage the user's key (stored in Firestore) is always passed in.
const FALLBACK_KEY = import.meta.env.VITE_AES_SECRET_KEY || "superSecret123";

/**
 * Encrypts a file using AES-256.
 *
 * @param {ArrayBuffer} arrayBuffer - The raw file bytes to encrypt.
 * @param {string}      userKey     - The user's unique encryption key.
 * @returns {string} A Base64-encoded encrypted string ready to upload to IPFS.
 */
export const encryptFile = (arrayBuffer, userKey) => {
  const secretKey = userKey || FALLBACK_KEY;
  // Convert raw bytes into a format CryptoJS understands (WordArray)
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  return CryptoJS.AES.encrypt(wordArray, secretKey).toString();
};

/**
 * Decrypts an AES-256 encrypted string back into raw file bytes.
 *
 * @param {string} encryptedText - The encrypted string downloaded from IPFS.
 * @param {string} userKey       - The user's unique encryption key.
 * @returns {Uint8Array} Raw file bytes, ready to display or download.
 */
export const decryptFile = (encryptedText, userKey) => {
  const secretKey = userKey || FALLBACK_KEY;
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, secretKey);

    // CryptoJS returns a WordArray — convert it to a plain Latin-1 string first
    const latin1String = decrypted.toString(CryptoJS.enc.Latin1);
    if (!latin1String) throw new Error("Decryption produced an empty result");

    // Convert each character's char code into a byte array
    const bytes = new Uint8Array(latin1String.length);
    for (let i = 0; i < latin1String.length; i++) {
      bytes[i] = latin1String.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Failed to decrypt file — wrong key or corrupted data.");
  }
};