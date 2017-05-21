const fs = require('fs');
const dom_js = require('dom_js');
const events = require('../app/events');

const path = './data/setup.json';

const labels = {
    title: 'Setup',
    save: 'Save',
    path_to_geth: 'Path to geth'
};

const get_setup = () => JSON.parse(fs.readFileSync(path));

const invalid = () => {
    let invalid = false;
    const setup_file_does_not_exist = !fs.existsSync(path);
    if (setup_file_does_not_exist) invalid = true;
    else {
        const setup = get_setup();
        const geth_path_does_not_exist = !setup.geth || setup.geth.length === 0;
        const geth_does_not_exist = !geth_path_does_not_exist && !fs.existsSync(setup.geth);
        const geth_path_is_a_dir = !geth_does_not_exist && fs.statSync(setup.geth).isDirectory();
        if (geth_path_does_not_exist) invalid = true;
        else if (geth_path_is_a_dir) invalid = true;
        else if (geth_does_not_exist) invalid = true;
    }
    return invalid;
};

const render = () => {
    let setup = {};
    if (fs.existsSync(path)) setup = get_setup();
    const title = dom_js.create_element('h1.title', null, [labels.title]);
    const button_save = dom_js.create_element(
        'button.button',
        {type: 'button', disabled: true},
        [labels.save]
    );
    const verify_path = path => {
        const does_not_exist = !fs.existsSync(path);
        const is_a_dir = !does_not_exist && fs.statSync(path).isDirectory();
        button_save.disabled = does_not_exist || is_a_dir;
    };
    const input_geth_path = dom_js.create_element(
        'input.input',
        {placeholder: labels.path_to_geth, type: 'text', value: setup.geth || ''},
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

module.exports = {invalid, render, get_setup};
