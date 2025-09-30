import CryptoJS from "crypto-js";

const SECRET_KEY = "superSecret123"; 

export const encryptFile = (arrayBuffer) => {
  console.log('🔐 Encrypting - Input size:', arrayBuffer.byteLength);
  
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, SECRET_KEY).toString();
  
  console.log('🔐 Encrypted - Output length:', encrypted.length);
  return encrypted;
};

export const decryptFile = (encryptedText) => {
  try {
    console.log('🔓 Decrypting - Input length:', encryptedText.length);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    
    // Convert the decrypted WordArray to a string of bytes
    const decryptedWordArray = decrypted.toString(CryptoJS.enc.Latin1);
    
    console.log('🔓 Decrypted string length:', decryptedWordArray?.length);
    
    if (!decryptedWordArray) {
      throw new Error("Decryption failed - empty result");
    }
    
    // Convert string to Uint8Array
    const bytes = new Uint8Array(decryptedWordArray.length);
    for (let i = 0; i < decryptedWordArray.length; i++) {
      bytes[i] = decryptedWordArray.charCodeAt(i);
    }
    
    console.log('🔓 Final bytes length:', bytes.length);
    return bytes;
  } catch (error) {
    console.error("❌ Decryption error:", error);
    throw new Error("Failed to decrypt file: " + error.message);
  }
};