pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    uint8 private constant MIN_FOR_REGISTER = 4;

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => uint256) authorizedCaller;

    struct Airline {
        address airlineAddress;
        bool isRegistered;
        uint256 voteCount;
        uint256 fundDeposit;
        bool processing;
    }
    mapping(address => Airline) private airlines;
    uint256 private airlineCount;

    struct Flight {
        address airlineAddress;
        string flightCode;
        uint256 timestamp;
        uint8 status;
        uint8 processed;
    }
    mapping(bytes32 => Flight) private flights;
    mapping(string => bytes32) private flightKeys;

    struct Insurance {
        address passangerAddress;
        uint256 insuranceFee;
        bytes32 flightKey;
        bool isProcessed;
        uint256 timestamp;
    }
    mapping(address => Insurance) insurances;

    struct FlightInsuree {
        mapping(uint8 => address) passengers;
        uint8 passengersCount;
    }

    mapping(string => FlightInsuree) private insuree;
    mapping(address => uint256) private miscFundAddress;
    uint256 private miscfund;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
        //set the contractOwner as the first Airline
        airlines[contractOwner].isRegistered = true;
        airlineCount = 1;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller() {
        require(authorizedCaller[msg.sender] == 1, "Caller is not authorized");
        _;
    }

    /**
     *   @dev the caller needs to be a registered airline
     */
    modifier requireAirlineRegistered() {
        require(
            airlines[msg.sender].isRegistered == true,
            "Caller is not Registered Airline"
        );
        _;
    }

    modifier requireValue() {
        require(msg.value > 0, "Value must be provided");
        _;
    }
    modifier requireLessThan1Ether() {
        require(msg.value <= 1 ether, "value must be less than 1 ether");
        _;
    }

    modifier requireAvailableBalance() {
        require(
            insurances[msg.sender].insuranceFee > 0,
            "sender doesn't have any balance in insurance fee"
        );
        _;
    }

    modifier requireNotProcessing(address airlineAddress) {
        Airline memory airline = airlines[airlineAddress];
        require(airline.processing == false, "airline is being processed");
        _;
    }

    modifier requireFlightNotProcessed(string memory flightNumber) {
        bytes32 flightKey = flightKeys[flightNumber];
        Flight memory flight = flights[flightKey];
        require(flight.processed == 0, "Airline is being processed");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address addr) external requireContractOwner {
        authorizedCaller[addr] = 1;
    }

    function deauthorizeCaller(address addr) external requireContractOwner {
        delete authorizedCaller[addr];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function addAirline(address airlineAddress, uint256 voteCount)
        external
        requireAuthorizedCaller
    {
        Airline storage airline = airlines[airlineAddress];

        airline.airlineAddress = airlineAddress;

        airline.isRegistered = true;
        airline.voteCount = voteCount;
        airline.fundDeposit = 0;
        airline.processing = false;

        airlineCount++;
    }

    function isAirline(address airlineAddress)
        public
        view
        returns (address, bool)
    {
        return (airlineAddress, airlines[airlineAddress].isRegistered);
    }

    function countAirlines() public view returns (uint256 count) {
        return airlineCount;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(string calldata flightNumber)
        external
        payable
        requireFlightNotProcessed(flightNumber)
        requireValue
        requireLessThan1Ether
    {
        bytes32 flightKey = flightKeys[flightNumber];
        insurances[msg.sender] = Insurance(
            msg.sender,
            msg.value,
            flightKey,
            false,
            0
        );
        uint8 count = insuree[flightNumber].passengersCount;
        insuree[flightNumber].passengers[count] = msg.sender; //let's use 0 index
        insuree[flightNumber].passengersCount++;
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(
        address airlineAddress,
        string calldata flightNumber,
        uint256 timestamp
    )
        external
        requireAuthorizedCaller
        requireNotProcessing(airlineAddress)
        requireFlightNotProcessed(flightNumber)
    {
        Airline storage airline = airlines[airlineAddress];
        airline.processing = true;
        bytes32 flightKey = flightKeys[flightNumber];
        Flight storage flight = flights[flightKey];
        flight.processed = 1;
        uint8 count = insuree[flightNumber].passengersCount;
        uint256 totalCredit = 0;
        for (uint8 idx = 0; idx < count; idx++) {
            address passengerAddress = insuree[flightNumber].passengers[idx];
            Insurance storage insurance = insurances[passengerAddress];
            uint256 origFee = insurance.insuranceFee;
            uint256 insure = origFee / 2;
            insurance.insuranceFee = origFee + insure;
            insurance.isProcessed = true;
            insurance.timestamp = timestamp;
            totalCredit = totalCredit + insure;
        }
        //deduct deposit from airlines

        airline.fundDeposit = airline.fundDeposit - totalCredit;
        airline.processing = false;
        flight.processed = 2;
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external payable requireAvailableBalance {
        uint256 balance = insurances[msg.sender].insuranceFee;
        delete insurances[msg.sender];
        msg.sender.transfer(balance);
    }

    function getInsuranceBalance() public view returns (uint256) {
        return insurances[msg.sender].insuranceFee;
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() external payable requireAirlineRegistered {
        Airline storage airline = airlines[msg.sender];
        uint256 curFund = airline.fundDeposit;
        airline.fundDeposit = curFund.add(msg.value);
    }

    function getAirlineFund(address airlineAddress)
        public
        view
        returns (uint256)
    {
        return airlines[airlineAddress].fundDeposit;
    }

    //returns (bytes32)
    function addFlight(
        address airlineAddress,
        string calldata flightCode,
        uint256 timestamp
    ) external requireAuthorizedCaller {
        bytes32 flightKey = getFlightKey(airlineAddress, flightCode, timestamp);
        flights[flightKey] = Flight(
            airlineAddress,
            flightCode,
            timestamp,
            0,
            0
        );
        flightKeys[flightCode] = flightKey;

        FlightInsuree storage fi = insuree[flightCode];
        fi.passengersCount = 0;

        //return flightKey;
    }

    function getFlightAirline(string memory flightCode)
        public
        view
        returns (address)
    {
        bytes32 flightKey = flightKeys[flightCode];
        return flights[flightKey].airlineAddress;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function withdrawMiscFunds() external payable requireContractOwner {
        uint256 balance = miscfund;
        miscfund = 0;
        msg.sender.transfer(balance);
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        uint256 curMiscFund = miscFundAddress[msg.sender];
        miscFundAddress[msg.sender] = curMiscFund.add(msg.value);
        miscfund = miscfund.add(msg.value);
    }
}
