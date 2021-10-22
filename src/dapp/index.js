
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Web3 from 'web3';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        contract.registerAirline(contract.owner, contract.airlines[1], 1, (error, result) =>{
            display('Airline', 'Register Airline', [ { label: 'register airline', error: error, value: result} ]);

        })

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
        console.log('listing airlines');
        listAirlines(contract.airlines);

        contract.airlines.map((airline) => {
            //console.log('checking airline ', airline);
           contract.isAirlineRegister(airline, (error, result) =>{
                let status = DOM.elid("row-"+result[0].toString());
                //console.log(status.textContent);
                status.textContent = result[1] ? "registered" : "not registered"; 
                //console.log('airline ', result);
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
    displayDiv.append(section);

}

function listAirlines(airlines){
    let airlinesDiv = DOM.elid("airline-wrapper");
    while(airlinesDiv.firstChild){
        airlinesDiv.removeChild(airlinesDiv.firstChild);
    }
    let section = DOM.section();
    airlines.map((result)=>{
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-0 field'}, result));
        row.appendChild(DOM.div({className: 'col-sm-4 field-value' ,id : 'row-' + result.toString()}, "-"));

    })
    airlinesDiv.append(section)    
}







