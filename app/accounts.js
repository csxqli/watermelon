const ethereum_units = require('ethereum-units');
const dom_js = require('dom_js');
const create_account_form = require('../app/create_account_form');
const setup = require('../app/setup');

const fake_address = '0x14c48295274d66dff94fc815006dc9108d8a3b8a';
const labels = {
    incoming_transactions: 'Incoming transactions',
    transfer_to_address: 'Recipient address',
    transfer_submit: 'Transfer ETH',
    distribute_owner_address: 'Owner address',
    distribute_owner_percent: 'Owner percentage',
    distribute_submit: 'Distribute',
};
const etherscan_api_token = '14CDYEPHA94J5RWFJMJ1UMRMC94BNRG5GB';
let details;

const update_details = account => {
    dom_js.empty_element(details);
    // header
    const name = dom_js.create_element('h3.title_small', null, [account.name]);
    const address = dom_js.create_element('div.address', null, [`${account.address}`]);
    const balance = dom_js.create_element('div.balance', null, []);
    const left = dom_js.create_element('div.left', null, [name, address]);
    const right = dom_js.create_element('div.right', null, [balance]);
    const header = dom_js.create_element('div.header', null, [left, right]);

    // incoming transactions
    const transactions_list = dom_js.create_element('div.incoming_transactions', null, [
        dom_js.create_element('h4.title_tiny', null, [labels.incoming_transactions])
    ]);
    account.address = fake_address;
    fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${account.address}&tag=latest&apikey=${etherscan_api_token}`)
        .then(res => res.json())
        .then(res => dom_js.append_child(balance, ethereum_units.convert(res.result, 'wei', 'ether').toString() + ' ether'));
    fetch(`http://api.etherscan.io/api?module=account&action=txlist&address=${account.address}&startblock=0&endblock=99999999&sort=asc&apikey=${etherscan_api_token}`)
        .then(res => res.json())
        .then(res => res.result.filter(t => t.to === account.address))
        .then(incoming_transactions => {
            incoming_transactions.forEach(t => {
                dom_js.append_child(transactions_list, dom_js.create_element('div.transaction_item', null, [
                    dom_js.create_element('div.from', null, [t.from]),
                    dom_js.create_element('div.value', null, [ethereum_units.convert(t.value, 'wei', 'ether').toString() + ' ether']),
                    dom_js.create_element('div.hash', null, [t.hash]),
                    dom_js.create_element('div.gas', null, [t.gas]),
                ]));
            });
        });

    let button_transfer;
    let button_start_bots;
    let button_withdraw;
    let button_distribute;
    const update_buttons_state = () => {
        button_transfer.disabled = account.transfer_to_exchange !== 'ready';
        button_start_bots.disabled = account.start_bots !== 'ready';
        button_withdraw.disabled = account.withdraw_from_exchange !== 'ready';
        button_distribute.disabled = account.distribute !== 'ready';
    };

    // transfer form
    const on_transfer_submit = () => {
        transfer_form.classList.add('hidden');
        account.transfer_to_exchange = 'done';
        account.start_bots = 'ready';
        update_buttons_state();
    };
    const transfer_to_address = dom_js.create_element('input.input', {type: 'text', placeholder: labels.transfer_to_address});
    const transfer_submit = dom_js.create_element('button.button', {type: 'button'}, [labels.transfer_submit], {click: on_transfer_submit});
    const transfer_form = dom_js.create_element('form.transfer_form hidden', null, [
        transfer_to_address,
        transfer_submit,
    ]);

    // distribute form
    const on_distribute_submit = () => {
        distribute_form.classList.add('hidden');
        account.start_bots = 'done';
        update_buttons_state();
    };
    const distribute_owner_address = dom_js.create_element('input.input', {type: 'text', placeholder: labels.distribute_owner_address});
    const distribute_owner_percent = dom_js.create_element('input.input', {type: 'number', placeholder: labels.distribute_owner_percent});
    const distribute_submit = dom_js.create_element('button.button', {type: 'button'}, [labels.distribute_submit], {click: on_distribute_submit});
    const distribute_form = dom_js.create_element('form.distribute_form hidden', null, [
        distribute_owner_address,
        distribute_owner_percent,
        distribute_submit,
    ]);

    // control panel
    const on_button_transfer_click = () => {
        transfer_form.classList.remove('hidden');
        transfer_to_address.focus();
    };
    const on_start_bots_click = () => {
        account.start_bots = 'done';
        account.withdraw_from_exchange = 'ready';
        update_buttons_state();
    };
    const on_withdraw_click = () => {
        account.withdraw_from_exchange = 'done';
        account.distribute = 'ready';
        update_buttons_state();
    };
    const on_distribute_click = () => {
        distribute_form.classList.remove('hidden');
        distribute_owner_address.focus();
    };

    button_transfer = dom_js.create_element('button.button', null, ['1. Transfer to exchange'], {click: on_button_transfer_click});
    button_start_bots = dom_js.create_element('button.button', null, ['2. Start bots'], {click: on_start_bots_click});
    button_withdraw = dom_js.create_element('button.button', null, ['3. Withdraw from exchange'], {click: on_withdraw_click});
    button_distribute = dom_js.create_element('button.button', null, ['4. Distribute funds'], {click: on_distribute_click});
    update_buttons_state();
    const control_panel = dom_js.create_element('div.control_panel', null, [
        button_transfer,
        button_start_bots,
        button_withdraw,
        button_distribute,
    ]);

    // render
    dom_js.append_children(details, [
        header,
        control_panel,
        transfer_form,
        distribute_form,
        transactions_list,
    ]);
};

const account_item = account => {
    let view;
    const name = dom_js.create_element('div.name', null, [account.name]);
    const address = dom_js.create_element('div.address', null, [account.address]);
    view = dom_js.create_element('div.account_item', null, [name, address], {click: () => {
        const selected = document.querySelector('.accounts_list .selected');
        if (selected) selected.classList.remove('selected');
        view.classList.add('selected');
        update_details(account);
    }});
    return view;
};

const render = () => {
    let view;
    let list;
    list = dom_js.create_element('div.accounts_list', null, setup.get_setup().accounts.map(account_item));
    details = dom_js.create_element('div.account_details');
    view = dom_js.create_element('div.accounts', null, [
        list,
        details,
        create_account_form()
    ]);
    return view;
};

module.exports = {render};
