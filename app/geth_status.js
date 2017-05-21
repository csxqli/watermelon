const child_process = require('child_process');
const dom_js = require('dom_js');
const setup = require('../app/setup');

const model = {
    status: 'not_started'
};

const labels = {
    start: 'Start geth',
    trying_to_start: 'Trying to start geth process',
    stop: 'Stop geth'
};

let view;
let geth_process;
let button_action;

const on_data_from_geth = data => {
    if (data.indexOf('HTTP endpoint opened: http://localhost:8545') > -1) {
        model.status = 'ready';
        view.classList.remove('starting');
        view.classList.add(model.status);
        dom_js.empty_element(button_action);
        dom_js.append_child(button_action, labels.stop);
    }
};

const on_close_of_geth = (code, signal) => {
    if (signal === 'SIGTERM') {
        model.status = 'not_started';
        view.classList.remove('ready');
        view.classList.add(model.status);
        dom_js.empty_element(button_action);
        dom_js.append_child(button_action, labels.start);
    }
};

const start = () => {
    model.status = 'starting';
    view.classList.remove('not_started');
    view.classList.add(model.status);
    dom_js.empty_element(button_action);
    dom_js.append_child(button_action, labels.trying_to_start);

    // now do it
    let geth_path = setup.get_setup().geth;
    geth_process = child_process.exec(`${geth_path} --rpc --light --fast`);
    geth_process.stdout.on('data', on_data_from_geth);
    geth_process.stderr.on('data', on_data_from_geth);
    geth_process.on('close', on_close_of_geth);
};

const button_action_click = () => {
    if (model.status === 'not_started') start();
    else if (model.status === 'ready') geth_process.kill();
};

const render = () => {
    button_action = dom_js.create_element('button.button', null, [labels.start]);
    view = dom_js.create_element(
        `div.geth_status ${model.status}`,
        null,
        [button_action],
        {click: button_action_click}
    );
    return view;
};

module.exports = {render};
