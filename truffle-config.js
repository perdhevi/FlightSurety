var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    develop: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 50);
      },
      host: "127.0.0.1",  
      network_id: "5777", 
      port: 9545,
      gas: 9999999,
      accounts: 20
    }
  },
  compilers: {
    solc: {
      version: "^0.5.0"
    }
  }
};