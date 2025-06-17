require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const privateKey = process.env.PRIVATE_KEY;
const BlastAPIKey = process.env.BLAST_API_KEY;

module.exports = {
  networks: {
    sepolia: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: BlastAPIKey,
        }),
      network_id: 11155111, // Sepolia chain ID
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Compiler
  compilers: {
    solc: {
      version: "0.5.16", // or your version
    },
  },
};
