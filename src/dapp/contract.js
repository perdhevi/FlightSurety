import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    isAirlineRegister(address, callback){
        let self = this;
        self.flightSuretyData.methods
            .isAirline(address)
            .call({from: self.owner} ,callback);
    }

    registerAirline(fromAddress, airlineAddress, callback){
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airlineAddress)
            .send({from:fromAddress}, callback);
    }

    airlineFund(fromAddress, amount, callback) {
        let self = this;
        self.flightSuretyData.methods
            .fund()
            .send({from:fromAddress, value:amount}, callback)
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    registerFlight(flight, airlineAddr, callback) {
        let self = this;
        let payload = {
            airline: airlineAddr,
            flight:flight,
            timestamp:Math.floor(Date.now() / 1000),
        }
        console.log(payload);

        self.flightSuretyApp.methods
            .registerFlight(payload.flight, payload.timestamp)
            .send({from: payload.airline, gas:9999999}, (error, result) =>{
                callback(error, payload);
            });
    }

    passengerBuy(flight, amount, address, callback){
        let self = this;
        self.flightSuretyData.methods
            .buy(flight)
            .send({from: address, value: amount, gas:9999999}, (error, result) =>{
                callback(error, result);
            });
    }
    passengerBalance(address, callback){
        let self = this;
        self.flightSuretyData.methods
            .getInsuranceBalance()
            .call({from:address}, (error, result)=> {
                callback(error, result);
            })
    }

    passengerWithdraw(address,  callback){
        let self = this;
        self.flightSuretyData.methods
            .pay()
            .send({from: address, gas:9999999}, (error, result) =>{
                callback(error, result);
            });
    }
        
}