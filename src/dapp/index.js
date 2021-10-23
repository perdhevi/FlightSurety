
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
            row.appendChild(DOM.div({className: 'col-sm-0 field'}, contract.owner));
            row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + contract.owner.toString()}, "-"));
            contract.isAirlineRegister(contract.owner, (error, result) =>{
                let status = DOM.elid("row-"+result[0].toString());
                status.textContent = result[1] ? "registered" : "not registered"; 
            })
            row.appendChild(DOM.button({id : 'airline-register'},"register"));

            airlines.map((airline)=>{
                let row = section.appendChild(DOM.div({className:'row'}));
                row.appendChild(DOM.div({className: 'col-sm-0 field'}, airline));
                row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + airline.toString()}, "-"));
                contract.isAirlineRegister(airline, (error, result) =>{
                    let status = DOM.elid("row-"+result[0].toString());
                    status.textContent = result[1] ? "registered" : "not registered"; 
                })
                row.appendChild(DOM.button({id : 'airline-register'},"register"));
    
            })
            airlinesDiv.append(section)    
        }


        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        listAirlines(contract.airlines);

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
            // Write transaction
            contract.registerFlight(flight, (error, result) => {
                display('Airline', 'Airline register flight', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });

        });
        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let amount = DOM.elid('buy-amount').value
            passengerBuy(flight, amount, (error, result) => {
                display('Passenger', 'Buy Insurance')
            })
        });
        DOM.elid('first-time').addEventListener('click', () => {
            contract.airlineFund(contract.owner, Web3.utils.toWei("1","ether"), (error, result) => {
                display('Airline', 'Add Fund', [ { label: 'fund airline', error: error, value: result} ]);
            });
        
            contract.registerAirline(contract.owner, contract.airlines[0], (error, result) =>{
                display('Airline', 'Register Airline '+contract.airlines[0].toString(), [ { label: 'register airline', error: error, value: result} ]);
        
            });
            contract.registerAirline(contract.owner, contract.airlines[1], (error, result) =>{
                display('Airline', 'Register Airline', [ { label: 'register airline', error: error, value: result} ]);
        
            });
                });
        
        //console.log('listing airlines');

        contract.airlines.map((airline) => {
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
    displayDiv.append(section);

}

function firstTimeInit(){
}









