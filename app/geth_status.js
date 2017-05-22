const child_process = require('child_process');
const dom_js = require('dom_js');
const events = require('../app/events');
const setup = require('../app/setup');

const model = {
    status: 'not_started' // not_started | starting | ready
};

const labels = {
    button_not_started: 'Start',
    button_starting: '...',
    button_ready: 'Stop',
    text_not_started: 'geth is not running',
    text_starting: 'trying to start geth',
    text_ready: 'geth is running'
};

let view;
let geth_process;
let button_action;
let text_status;

const update_status = (from, to) => {
    model.status = to;
    from && view.classList.remove(from);
    view.classList.add(to);
    dom_js.empty_element(text_status);
    dom_js.append_child(text_status, labels[`text_${to}`]);
    dom_js.empty_element(button_action);
    dom_js.append_child(button_action, labels[`button_${to}`]);
    if (to === 'ready') events.trigger(events.create('get_accounts'));
};

const on_data_from_geth = data => {
    if (data.indexOf('HTTP endpoint opened: http://localhost:8545') > -1) update_status('starting', 'ready');
};

const on_close_of_geth = (code, signal) => {
    if (signal === 'SIGTERM') update_status('ready', 'not_started');
};

const start = () => {
    update_status('not_started', 'starting');
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
    button_action = dom_js.create_element('button.button');
    text_status = dom_js.create_element('span.text');
    view = dom_js.create_element(
        `div.geth_status ${model.status}`,
        null,
        [button_action, text_status],
        {click: button_action_click}
    );
    update_status(null, 'not_started');
    return view;
};

module.exports = {render};
