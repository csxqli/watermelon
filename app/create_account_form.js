const lightwallet = require('eth-lightwallet');
const dom_js = require('dom_js');
const events = require('../app/events');
const setup = require('../app/setup');

const labels = {
    create_new_account: 'Create new account',
    account_name: 'Account name',
    save: 'Save',
};

const create_account_form = () => {
    let view;
    let button_create;
    let input_name;
    let button_save;
    const save_account = () => {
        const setup_data = setup.get_setup();
        const account_name = input_name.value;
        if (!account_name) window.alert('Choose an account name');
        else {
            const keystore = lightwallet.keystore.deserialize(setup_data.keystore);
            keystore.keyFromPassword(setup_data.password, (err, derived_key) => {
                if (err) console.log(err);
                const number_of_accounts = setup_data.accounts.length;
                const new_account_index = number_of_accounts;
                keystore.generateNewAddress(derived_key, number_of_accounts + 1);
                const addresses = keystore.getAddresses();
                setup_data.accounts.push({
                    name: account_name,
                    created_on: new Date(),
                    address: '0x' + addresses[new_account_index]
                });
                setup.save(setup_data);
                dom_js.remove_element(input_name);
                dom_js.remove_element(button_save);
                dom_js.append_child(view, button_create);
                events.trigger('render_overview');
            });
        }
    };
    input_name = dom_js.create_element(
        'input.input',
        {type: 'text', placeholder: labels.account_name},
        null,
        {keyup: event => event.keyCode === dom_js.key_codes.enter && save_account()}
    );
    button_save = dom_js.create_element(
        'button.button',
        {type: 'button'},
        [labels.save],
        {click: save_account}
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
        [labels.create_new_account],
        {click: show_form}
    );
    view = dom_js.create_element('div.create_account_form', null, [button_create]);
    return view;
};

module.exports = create_account_form;