const fs = require('fs');
const lightwallet = require('eth-lightwallet');
const dom_js = require('dom_js');
const events = require('../app/events');

const path = './data/setup.json';

const labels = {
    title: 'Setup',
    save: 'Save',
    path_to_geth: 'Path to geth',
    password: 'Password',
    password_confirm: 'Confirm password',
    seed: 'Wallet seed',
    seed_text: 'Generated wallet seed (keep it safe)',
};

const get_setup = () => {
    if (!fs.existsSync(path)) return {};
    else return JSON.parse(fs.readFileSync(path));
};

const geth_path_is_invalid = path => {
    if (!path || path.length === 0) return true;
    else if (!fs.existsSync(path)) return true;
    else if (fs.statSync(path).isDirectory()) return true;
    return false;
};

const invalid = () => {
    let invalid = false;
    const setup_file_does_not_exist = !fs.existsSync(path);
    if (setup_file_does_not_exist) invalid = true;
    else {
        const setup = get_setup();
        invalid = geth_path_is_invalid(setup.geth) || !setup.password || !setup.keystore;
    }
    return invalid;
};

const save = data => fs.writeFileSync(path, JSON.stringify(data, null, 2));

const render = () => {
    let setup = get_setup();
    const title = dom_js.create_element('h1.title', null, [labels.title]);
    const button = dom_js.create_element(
        'button.button',
        {type: 'button', disabled: true},
        [labels.save]
    );
    let input_geth_path;
    let input_password;
    let input_password_confirm;
    let text_seed;
    let input_seed;
    const password_is_invalid = () => {
        const password = input_password.value;
        const confirm = input_password_confirm.value;
        return password.length === 0 || password !== confirm;
    };
    const verify = event => {
        if (!password_is_invalid() && !get_setup().keystore) {
            input_seed.value = lightwallet.keystore.generateRandomSeed(input_password.value);
        }
        button.disabled = geth_path_is_invalid(input_geth_path.value) || password_is_invalid();
        if (!button.disabled && event.keyCode === dom_js.key_codes.enter) button.click();
    };
    input_geth_path = dom_js.create_element(
        'input.input',
        {placeholder: labels.path_to_geth, type: 'text', value: setup.geth || ''},
        null,
        {keyup: verify}
    );
    input_password = dom_js.create_element(
        'input.input',
        {placeholder: labels.password, type: 'password', value: setup.password || ''},
        null,
        {keyup: verify}
    );
    input_password_confirm = dom_js.create_element(
        'input.input',
        {placeholder: labels.password_confirm, type: 'password', value: setup.password || ''},
        null,
        {keyup: verify}
    );
    text_seed = dom_js.create_element('div.text', null, [labels.seed_text]);
    input_seed = dom_js.create_element(
        'input.input seed',
        {placeholder: labels.seed, type: 'text', readonly: true, value: setup.seed || ''},
        null,
        {change: verify}
    );
    const on_save_click = () => {
        lightwallet.keystore.deriveKeyFromPassword(input_password.value, function (err, derived_key) {
            if (err) throw err;
            const keystore = new lightwallet.keystore(input_seed.value, derived_key);
            save({
                geth: input_geth_path.value,
                password: input_password.value,
                keystore: keystore.serialize(),
                accounts: get_setup().accounts || [],
            });
            events.trigger('start');
        });
    };
    dom_js.add_event_listeners(button, {click: on_save_click});
    const view = dom_js.create_element('div.setup', null, [
        title,
        input_geth_path,
        input_password,
        input_password_confirm,
        text_seed,
        input_seed,
        button
    ]);
    const root = document.querySelector('#root');
    dom_js.empty_element(root);
    dom_js.append_child(root, view);
};

module.exports = {invalid, render, get_setup, save};
