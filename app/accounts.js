const exec = require('child_process').exec;
const Web3 = require('web3');
const dom_js = require('dom_js');
const setup = require('../app/setup');

// const HookedWeb3Provider = require('hooked-web3-provider');
// const lightwallet = require('eth-lightwallet');
//
// let web3;
// let keystore;
//
// const get_accounts = () => {
//     keystore = lightwallet.keystore.deserialize(setup.get_setup().keystore);
//     web3 = new Web3(new HookedWeb3Provider({host: 'http://localhost:8545', transaction_signer: keystore}));
//     lightwallet.keystore.deriveKeyFromPassword(setup.get_setup().password, function (err, derived_key) {
//         // keystore.generateNewAddress(derived_key);
//         console.log(keystore);
//     });
// };

const labels = {
    create_new_pump: 'Create new pump',
    pump_name: 'Pump name',
    save: 'Save',
};

const create_pump_form = () => {
    let state = 'button'; // button | form
    let view;
    let button_create;
    let input_name;
    let button_save;
    const save_pump = () => {
        dom_js.remove_element(input_name);
        dom_js.remove_element(button_save);
        dom_js.append_child(view, button_create);
    };
    input_name = dom_js.create_element('input.input', {type: 'text', placeholder: labels.pump_name});
    button_save = dom_js.create_element(
        'button.button',
        {type: 'button'},
        [labels.save],
        {click: save_pump}
    );
    const show_form = () => {
        dom_js.remove_element(button_create);
        dom_js.append_child(view, input_name);
        dom_js.append_child(view, button_save);
        input_name.value = '';
        input_name.focus();
    };
    button_create = dom_js.create_element(
        'button.button',
        {type: 'button'},
        [labels.create_new_pump],
        {click: show_form}
    );
    view = dom_js.create_element('div.create_pump_form', null, [button_create]);
    return view;
};

const render = () => {
    const view = dom_js.create_element('div.accounts', null, [create_pump_form()]);
    return view;
};

module.exports = {render};
