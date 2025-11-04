const path = require("path");

module.exports = {
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",      // Match Ganache RPC Host
      port: 7545,             // Match Ganache RPC Port
      network_id: "1337",     // Must match Ganache network ID (from your screenshot)
      gas: 6721975,
      gasPrice: 20000000000,
    },
  },
  compilers: {
    solc: {
      version: "0.5.16",      // Your contract version
    },
  },
};
