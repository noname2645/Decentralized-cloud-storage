import CryptoJS from "crypto-js";

const SECRET_KEY = "superSecret123"; 

export const encryptFile = (arrayBuffer) => {
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, SECRET_KEY).toString();
  return encrypted;
};

export const decryptFile = (encryptedText) => {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  const decryptedWords = decrypted.words.map(word => [
    (word >> 24) & 0xff,
    (word >> 16) & 0xff,
    (word >> 8) & 0xff,
    word & 0xff,
  ]).flat();
  return new Uint8Array(decryptedWords);
};
