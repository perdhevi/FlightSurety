
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const { default: Web3 } = require('web3');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //console.log(config);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    //console.log("check Operational");
    //console.log(config.flightSuretyData );
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial data operating status value");
    let statusApp = await config.flightSuretyApp.isOperational.call();
    assert.equal(statusApp, true, "Incorrect initial app operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result[1], false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
  
  it('airline can add fund', async() => {
    let fundValue = web3.utils.toWei("10","ether");
    await config.flightSuretyData.fund({from:config.owner, value:fundValue});
    //console.log('fund Value',fundValue);
    let result = await config.flightSuretyData.getAirlineFund.call(config.owner);
    //console.log('fund ',result.toString());
    assert.equal(result==fundValue, true, "deposited fund must be the same "+fundValue.toString() + " == "+ result.toString());
  });

  it('airline can add register airline', async() => {
    let airlineAddress = config.firstAirline;
    let addResult = await config.flightSuretyApp.registerAirline(airlineAddress, {from:config.owner});

    let result = await config.flightSuretyData.isAirline(airlineAddress);

    assert.equal(result[1], true, "Airline can register another airline");
  });

  it('airline can add multiple airline', async() => {
    let fundValue = web3.utils.toWei("10","ether");
    await config.flightSuretyData.fund({from:config.firstAirline, value:fundValue});
    for(let i=2;i<=6;i++){
      await config.flightSuretyApp.registerAirline(config.testAddresses[i], {from:config.firstAirline})
    }
    let result = await config.flightSuretyData.isAirline(config.testAddresses[5]);
    assert.equal(result[1], false, "Airline needs to be voted after 4");
  });

  it('airline can vote other airline', async() => {
    let fundValue = web3.utils.toWei("10","ether");
    for(let i=2;i<=4;i++){
      //await config.flightSuretyApp.registerAirline(config.testAddresses[i], {from:config.firstAirline})

      await config.flightSuretyData.fund({from:config.testAddresses[i], value:fundValue});
    }

    for(let i=2;i<=4;i++){
      //console.log('voting - ', config.testAddresses[i]);
      await config.flightSuretyApp.voteAirline(config.testAddresses[5], {from:config.testAddresses[i]});
    }

    let result = await config.flightSuretyData.isAirline(config.testAddresses[5]);
    assert.equal(result[1], true, "Voted airline can be added");
  });  

  it('airline can register Flight', async() => {
    await config.flightSuretyApp.registerFlight(
        'ND101',
        Date.now(), {from:config.firstAirline});
    let address = await config.flightSuretyData.getFlightAirline('ND101');

    assert.equal(config.firstAirline == address, true, 'Airlne address should match after registration');
    
  });

  it('can buy and pay insurance', async() => {
    var BN = web3.utils.BN;
    let beforeBuy = await web3.eth.getBalance(accounts[3]);
    //console.log('before buy', beforeBuy);

    await config.flightSuretyData.buy('ND101', {from: accounts[3], value : 1000});
    let afterBuy = await web3.eth.getBalance(accounts[3]);
    //console.log('after buy ', afterBuy);

    let aBal = await config.flightSuretyData.getInsuranceBalance.call({from: accounts[3]});
    //console.log('aBal ', aBal.toString());
    await config.flightSuretyData.pay({from: accounts[3]});
    let bBal = await config.flightSuretyData.getInsuranceBalance.call({from: accounts[3]});
    

    let actualBal = await web3.eth.getBalance(accounts[3]);
    //console.log(' after pay', actualBal);

    assert.equal(aBal > 0,true,'Insurance Fee Deposited should be more than 0');
    assert.equal(bBal == 0,true,'Insurance Fee Deposited should be 0');
  })
 

});
