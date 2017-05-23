const dom_js = require('dom_js');
const create_account_form = require('../app/create_account_form');

const render = () => {
    const view = dom_js.create_element('div.accounts', null, [create_account_form()]);
    return view;
};

module.exports = {render};
