import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
var defAccount = null;


web3.eth.getAccounts((error, accts) => {
  defAccount = accts[0];
});
console.log("flightSurety Oracle Server..")

flightSuretyApp.events.OracleRequest({
   // fromBlock: 0
  }, function (error, event) {
    if (error) console.log("event error - ",error);
    let result = event.returnValues;
    console.log('oracle id', defAccount);
      console.log("events fired ",result);

      flightSuretyApp.methods
      .submitOracleResponse(
        result.index,
        result.airline,
        result.flight,
        result.timestamp,
        20       
      )
      .send({from:defAccount, gas:9999999}, (error, result)=>{
        console.log('error: ',error);
        console.log('result: ',result);
      })
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


