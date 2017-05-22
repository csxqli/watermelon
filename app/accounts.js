const Web3 = require('web3');
const dom_js = require('dom_js');
const events = require('../app/events');

let web3;

const get_accounts = () => {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    console.log(web3);
    window.web3 = web3;
};

const render = () => {
    return 'accounts';
};

module.exports = {render};

dom_js.add_event_listeners(document, {get_accounts});
