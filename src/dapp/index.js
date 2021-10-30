
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Web3 from 'web3';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {


        function listAirlines(airlines){
            let airlinesDiv = DOM.elid("airline-wrapper");
            while(airlinesDiv.firstChild){
                airlinesDiv.removeChild(airlinesDiv.firstChild);
            }
            let section = DOM.section();

            let row = section.appendChild(DOM.div({className:'row'}));
            row.appendChild(DOM.div({className: 'col-sm-0 field'}, 'owner '+contract.owner));
            row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + contract.owner.toString()}, "-"));
            contract.isAirlineRegister(contract.owner, (error, result) =>{
                let status = DOM.elid("row-"+result[0].toString());
                status.textContent = result[1] ? "registered" : "not registered"; 
            })

            airlines.map((airline)=>{
                let row = section.appendChild(DOM.div({className:'row'}));
                row.appendChild(DOM.div({className: 'col-sm-0 field'}, airline));
                row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + airline.toString()}, "-"));
                contract.isAirlineRegister(airline, (error, result) =>{
                    let status = DOM.elid("row-"+result[0].toString());
                    status.textContent = result[1] ? "registered" : "not registered"; 
                })
    
            })
            airlinesDiv.append(section)    
        }

        function listPassengers(passengers){
            let passengerDiv = DOM.elid("passenger-wrapper");
            while(passengerDiv.firstChild){
                passengerDiv.removeChild(passengerDiv.firstChild);
            }

            let section = DOM.section();
            passengers.map((passenger)=>{
                let row = section.appendChild(DOM.div({className:'row'}));
                row.appendChild(DOM.div({className: 'col-sm-0 field'}, passenger));
                row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + passenger.toString()}, "-"));
    
            })
            passengerDiv.append(section)    
        }


        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        listAirlines(contract.airlines);
        listPassengers(contract.passengers);
        DOM.elid('executor').value = contract.owner;
        DOM.elid('authorizeApp').addEventListener('click', () => {
            contract.authorizeAppServer((error, result) => {
                display('Authorize AppServer', 'Authorize App Server', [ { label: 'Authorize caller', error: error, value: result} ]);
            })
        });


        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('register-flight').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let airlineAddr = DOM.elid('airline-operator').value;
            // Write transaction
            contract.registerFlight(flight, airlineAddr, (error, result) => {
                display('Airline', 'Airline register flight', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });

        });
        DOM.elid('fund-airline').addEventListener('click', () =>{
            let airlineAddr = DOM.elid('airline-operator').value;
            contract.airlineFund(airlineAddr, Web3.utils.toWei("1","ether"), (error, result) => {
                display('Airline', 'Add Fund', [ { label: 'fund airline', error: error, value: result} ]);
            });            
        })
        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let buyAddress = DOM.elid('buy-address').value;
            let amount = DOM.elid('buy-amount').value;
            contract.passengerBuy(flight, amount, buyAddress, (error, result) => {
                display('Passenger', 'Buy Insurance', [ { label: 'Buy Insurance', error: error, value: result} ])
            })
        });
        DOM.elid('first-time').addEventListener('click', () => {
            contract.airlineFund(contract.owner, Web3.utils.toWei("1","ether"), (error, result) => {
                display('Airline', 'Add Fund', [ { label: 'fund airline', error: error, value: result} ]);
            });
        
             for(let x =0;x<4;x++){
                contract.registerAirline(contract.owner, contract.airlines[x], (error, result) =>{
                    display('Airline', 'Register Airline '+contract.airlines[x].toString(), [ { label: 'register airline', error: error, value: result} ]);
            
                });
            }
        });
        
        DOM.elid('passenger-balance').addEventListener('click', () => {
            let buyAddress = DOM.elid('buy-address').value; 
            contract.passengerBalance(buyAddress, (error, result)=>{
                let element = DOM.elid('balance')
                element.removeChild(element.firstChild);
                element.appendChild(DOM.div({className: 'col-sm-0 field'}, 'balance '+result))
            })
        });

        DOM.elid('passenger-withdrawal').addEventListener('click', () => {
            let buyAddress = DOM.elid('buy-address').value; 
            contract.passengerWithdraw(buyAddress, (error, result)=>{
                display('Passenger', 'Passenger Withdrawal', [ { label: 'Passenger Withdraw', error: error, value: result} ]);
            })
        });

    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-4 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.insertBefore(section, displayDiv.firstChild);

}









