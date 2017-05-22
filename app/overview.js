const dom_js = require('dom_js');
const geth_status = require('../app/geth_status');
const accounts = require('../app/accounts');

const labels = {
    title: 'Overview'
};

const render = () => {
    const title = dom_js.create_element('h2.title', null, [labels.title]);
    const view = dom_js.create_element('div.overview', {}, [
        title,
        geth_status.render(),
        accounts.render()
    ]);
    const root = document.querySelector('#root');
    dom_js.empty_element(root);
    dom_js.append_child(root, view);
};

module.exports = {render};
