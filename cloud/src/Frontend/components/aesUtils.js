import CryptoJS from "crypto-js";

// Use environment variable for encryption key with fallback for backward compatibility
const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY || "superSecret123";

export const encryptFile = (arrayBuffer) => {
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, SECRET_KEY).toString();
  return encrypted;
};

export const decryptFile = (encryptedText) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);

    // Convert the decrypted WordArray to a string of bytes
    const decryptedWordArray = decrypted.toString(CryptoJS.enc.Latin1);

    if (!decryptedWordArray) {
      throw new Error("Decryption failed - empty result");
    }

    // Convert string to Uint8Array
    const bytes = new Uint8Array(decryptedWordArray.length);
    for (let i = 0; i < decryptedWordArray.length; i++) {
      bytes[i] = decryptedWordArray.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    console.error("Decryption error");
    throw new Error("Failed to decrypt file");
  }
};