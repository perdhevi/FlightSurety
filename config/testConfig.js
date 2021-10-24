
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    /*let testAddresses = [
        "0x4cc752c8335bf341091c2f5cb0cac2121f6fa63f",
        "0x13bf37db03d7dfadc7ce3907d8eadeaa1046ad65",
        "0xdfe4911800bcc544cd00e0cbc1e51041f291068e",
        "0x5a153a361c3f5c02b4163d4bd066d27bc33aebff",
        "0x135f593779bc4e7f39503b4659367821944fc5c9",
        "0x9c2b28feb305319dca74adc5b84e1ccf2bd81b2c",
        "0x3b2775cdea3ea9e4f34a8b9667da77c579ef8d8c",
        "0x1580a7f01c046d44cb18a07a4f25ec20d99f3038",
        "0xa83245bbfdc0f928288f530059a19ce1eda6b674",
        "0xfed10d71a34112f9b4d8e83d3b01444eb197da4a",       
    ];

    */
   var testAddresses =[];
    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    for(var i =2;i<accounts.length;i++){
        testAddresses.push(accounts[i]);
    }
    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};