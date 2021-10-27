import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const TEST_ORACLES_COUNT = 10;
console.log("flightSurety Oracle Server..")

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let oracleAccounts = [];

class OracleEntity {
  address = ""
  indexes = []

  constructor(address, indexes){
    this.address = address;
    this.indexes = indexes;
  }
}

console.log("registering oracles..")
let fee = web3.utils.toWei("1","ether");

function setAccount(address, idx){
  oracleAccounts.push(new OracleEntity(address, idx));
  console.log('oracle account added', address);
}

web3.eth.getAccounts((error, accts) => {
  for(var i=0;i<TEST_ORACLES_COUNT;i++){
    let curAddress = accts[i+11];
    let curIdx = []
    let curId = i;
    flightSuretyApp.methods
      .registerOracle()
      .send({from:curAddress, value:fee, gas:9999999}
      ).then((result) =>  {
        flightSuretyApp.methods
        .getMyIndexes()
        .call({from:curAddress, gas:9999999})
        .then((result)=>{
          // console.log('curAddress ', curAddress);
          // console.log('idx', result);
          // console.log('id',curId);
          setAccount(curAddress, result);
        });
      });
  }
});


flightSuretyApp.events.OracleRequest({
   // fromBlock: 0
  }, function (error, event) {
    console.log('oracle accounts', oracleAccounts);
    if (error) console.log("event error - ");
    let result = event.returnValues;
    console.log("events fired ",result);
    console.log('length',oracleAccounts.length);
    oracleAccounts.forEach( function(value, id) {
      console.log('oracleAccount id :',value.indexes);
      //console.log('oracleAccount result :',indexes);
      if(value.indexes.includes(result.index) ){
        console.log('submit Oracle response');
        let idx = result.index;
        flightSuretyApp.methods
        .submitOracleResponse(
          result.index,
          result.airline,
          result.flight,
          result.timestamp,
          STATUS_CODE_LATE_AIRLINE       
        )
        .send({from:value.address, gas:9999999})
        .then((result)=>{
          console.log('submitOracleResponse ', idx);
        }, err => {
          console.log('submit error', idx);
          console.log('submit error', err);
        });
        
      }
    });      
  }
);

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


