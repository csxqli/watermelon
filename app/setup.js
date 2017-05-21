const fs = require('fs');
const dom_js = require('dom_js');
const events = require('../app/events');

const path = './data/setup.json';

const invalid = () => {
    let invalid = false;
    const setup_file_does_not_exist = !fs.existsSync(path);
    if (setup_file_does_not_exist) invalid = true;
    else {
        const setup = JSON.parse(fs.readFileSync(path));
        const geth_path_does_not_exist = !setup.geth || setup.geth.length === 0;
        const geth_does_not_exist = fs.existsSync(geth_path_does_not_exist);
        if (geth_path_does_not_exist) invalid = true;
        if (geth_does_not_exist) invalid = true;
    }
    return invalid;
};

const render = () => {
    let setup = {};
    if (fs.existsSync(path)) setup = JSON.parse(fs.readFileSync(path));
    const title = dom_js.create_element('h1.title', null, ['setup']);
    const button_save = dom_js.create_element(
        'button.button',
        {type: 'button', disabled: true},
        ['Save']
    );
    const verify_path = path => {
        const does_not_exist = !fs.existsSync(path);
        const is_a_directory = !does_not_exist && fs.statSync(path).isDirectory();
        button_save.disabled = does_not_exist || is_a_directory;
    };
    const input_geth_path = dom_js.create_element(
        'input.input',
        {placeholder: 'Path to geth', type: 'text', value: setup.geth || ''},
        null,
        {keyup: () => verify_path(input_geth_path.value)}
    );
    const save = () => {
        const data = {geth: input_geth_path.value};
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        dom_js.empty_element(root);
        events.trigger(events.create('start'));
    };
    dom_js.add_event_listeners(button_save, {click: save});
    const view = dom_js.create_element('div.setup', null, [title, input_geth_path, button_save]);
    const root = document.querySelector('#root');
    dom_js.empty_element(root);
    dom_js.append_child(root, view);
};

module.exports = {invalid, render};
