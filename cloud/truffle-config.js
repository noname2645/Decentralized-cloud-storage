module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache RPC server
      port: 7545,        // Default Ganache port
      network_id: "*",   // ✅ Allow any network ID
    },
  },
  compilers: {
    solc: {
      version: "0.5.16", // ✅ Match Solidity version with your contract
    },
  },
};
