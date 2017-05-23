const dom_js = require('dom_js');
const create_account_form = require('../app/create_account_form');
const setup = require('../app/setup');

const account_item = account => {
    const name = dom_js.create_element('div.name', null, [account.name]);
    const address = dom_js.create_element('div.address', null, [`0x${account.address}`]);
    return dom_js.create_element('div.account_item', null, [name, address]);
};

const render = () => {
    let view;
    let list;
    let details;
    list = dom_js.create_element('div.accounts_list', null, setup.get_setup().accounts.map(account_item));
    details = dom_js.create_element('div.details');
    view = dom_js.create_element('div.accounts', null, [
        list,
        details,
        create_account_form(),
    ]);
    return view;
};

module.exports = {render};
