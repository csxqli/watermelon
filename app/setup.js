const fs = require('fs');
const dom_js = require('dom_js');
const events = require('../app/events');

const path = './data/setup.json';

const labels = {
    title: 'Setup',
    save: 'Save',
    path_to_geth: 'Path to geth',
    password: 'Password',
    password_confirm: 'Confirm password'
};

const get_setup = () => JSON.parse(fs.readFileSync(path));

const geth_path_is_invalid = path => {
    let invalid = false;
    const geth_path_does_not_exist = !path || path.length === 0;
    const geth_does_not_exist = !geth_path_does_not_exist && !fs.existsSync(path);
    const geth_path_is_a_dir = !geth_does_not_exist && fs.statSync(path).isDirectory();
    if (geth_path_does_not_exist) invalid = true;
    else if (geth_path_is_a_dir) invalid = true;
    else if (geth_does_not_exist) invalid = true;
    return invalid;
};

const invalid = () => {
    let invalid = false;
    const setup_file_does_not_exist = !fs.existsSync(path);
    if (setup_file_does_not_exist) invalid = true;
    else {
        const setup = get_setup();
        invalid = geth_path_is_invalid(setup.geth) || !setup.password;
    }
    return invalid;
};

const render = () => {
    let setup = {};
    if (fs.existsSync(path)) setup = get_setup();
    const title = dom_js.create_element('h1.title', null, [labels.title]);
    const button = dom_js.create_element(
        'button.button',
        {type: 'button', disabled: true},
        [labels.save]
    );
    let input_geth_path;
    let input_password;
    let input_password_confirm;
    const password_is_invalid = () => {
        const password = input_password.value;
        const confirm = input_password_confirm.value;
        return password.length === 0 || password !== confirm;
    };
    const verify = event => {
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
    const save = () => {
        const data = {
            geth: input_geth_path.value,
            password: input_password.value,
        };
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        dom_js.empty_element(root);
        events.trigger('start');
    };
    dom_js.add_event_listeners(button, {click: save});
    const view = dom_js.create_element('div.setup', null, [
        title,
        input_geth_path,
        input_password,
        input_password_confirm,
        button
    ]);
    const root = document.querySelector('#root');
    dom_js.empty_element(root);
    dom_js.append_child(root, view);
};

module.exports = {invalid, render, get_setup};
