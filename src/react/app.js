import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOM from 'react-dom';
import Poloniex from 'poloniex.js';
import classnames from 'classnames'
import lightwallet from 'eth-lightwallet';
import ethereum_units from 'ethereum-units';

// ------ Globals ------

const etherscan_api_token = '14CDYEPHA94J5RWFJMJ1UMRMC94BNRG5GB';
const path_setup = path.join(__dirname, '../data/setup.json');
const stages = [ 'accepting_investors',
                 'funds_deposited',
                 'pump_started',
                 'pump_complete',
                 'funds_withdrawn',
                 'funds_distributed' ];
let poloniex = null;

// ------ Tabs ------

class Tabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = { selected: 0 };
    }

    render() {
        const buttons = [];
        let content = null;
        this.props.children.forEach((child, index) => {
            const on_click = () => this.setState({selected: index});
            buttons.push(
                <div className={classnames({TabButton: true, Selected: this.state.selected === index})}
                      onClick={on_click}
                      key={`tab_button_${index}`}>{child.label}</div>
            );
        });
        return <div className='Tabs'>
            <div className='TabButtons'>{buttons}</div>
            <div className='Content'>{this.props.children[this.state.selected].content}</div>
        </div>;
    }
}

// ------ Wallet ------

class WalletSetup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        let row_seed = null;
        let row_button = null;
        if (this.state.seed) {
            row_seed = <label className='Row'>
                <div className='Label'>Seed (keep this safe)</div>
                <code>{this.state.seed}</code>
            </label>;
            row_button = <label className='Row'>
                <button className='Button'>Setup</button>
            </label>;
        }
        return <div className='WalletSetup Padding3'>
            <form className='Form'
                         onSubmit={event => this.on_submit(event)}>
                <label className='Row'>
                    <input className='Input'
                           type='text'
                           placeholder='Poloniex API Key'
                           onChange={event => this.on_api_key_change(event)}/>
                </label>
                <label className='Row'>
                    <input className='Input'
                           type='text'
                           placeholder='Poloniex API Secret'
                           onChange={event => this.on_api_secret_change(event)}/>
                </label>
                <label className='Row'>
                    <input className='Input'
                           type='password'
                           placeholder='Password'
                           onChange={event => this.on_password_change(event)}/>
                </label>
                <label className='Row'>
                    <input className='Input'
                           type='password'
                           placeholder='Confirm password'
                           onChange={event => this.on_confirm_change(event)}/>
                </label>
                {row_seed}
                {row_button}
            </form>
        </div>;
    }

    on_api_key_change(event) {
        this.setState({poloniex_api_key: event.target.value});
    }

    on_api_secret_change(event) {
        this.setState({poloniex_api_secret: event.target.value});
    }

    generate_seed() {
        if (this.state.password.length > 0 && this.state.password === this.state.confirm) {
            this.setState({seed: lightwallet.keystore.generateRandomSeed(this.state.password)});
        }
    };

    on_password_change(event) {
        this.setState({password: event.target.value, seed: null}, () => this.generate_seed());
    };

    on_confirm_change(event) {
        this.setState({confirm: event.target.value, seed: null}, () => this.generate_seed());
    };

    on_submit(event) {
        event.preventDefault();
        lightwallet.keystore.deriveKeyFromPassword(this.state.password, (err, derived_key) => {
            if (err) throw err;
            const keystore = new lightwallet.keystore(this.state.seed, derived_key);
            this.props.on_setup({
                poloniex_api_key: this.state.poloniex_api_key,
                poloniex_api_secret: this.state.poloniex_api_secret,
                password: this.state.password,
                seed: this.state.seed,
                keystore:keystore.serialize(),
                accounts: [],
            });
        });
    }
}

class WalletAccountsList extends React.Component {
    render() {
        const accounts = this.props.accounts;
        if (!accounts || accounts.length === 0) return null;
        return <div className='WalletAccountsList Padding3'>
            {accounts.map(account => this.get_item(account))}
        </div>;
    }

    get_item(account) {
        return <div className='Item' key={`account_item_${account.index}`}
                    onClick={() => this.props.on_account_select(account)}>
            <div className='Name'>{account.name}</div>
            <div className='Address'>{account.address_local_eth}</div>
        </div>;
    }
}

class WalletCreateAccount extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: false};
    }

    render() {
        let content = null;
        if (this.state.expanded) {
            let button = null;
            if (this.state.name) {
                button = <button className='Button'
                                     onClick={event => this.on_submit(event)}>Create</button>;
            }
            content = <form className='Form'>
                <input className='Input'
                       type='text'
                       placeholder='Account name'
                       autoFocus
                       onChange={event => this.on_key_up(event)}/>
                {button}
            </form>;
        }
        else {
            content = <button className='Button'
                              onClick={() => this.expand()}>Create account</button>;
        }
        return <div className='WalletCreateAccount Padding3'>{content}</div>
    }

    on_key_up(event) {
        this.setState({ name: event.target.value });
    }

    on_submit(event) {
        event.preventDefault();
        const keystore = lightwallet.keystore.deserialize(this.props.keystore);
        keystore.keyFromPassword(this.props.password, (err, derived_key) => {
            if (err) throw err;
            const index = this.props.index;
            keystore.generateNewAddress(derived_key, index + 1);
            const addresses = keystore.getAddresses();
            this.props.on_create_account({ name: this.state.name,
                                           index: index,
                                           created_on: new Date(),
                                           address_local_eth: '0x' + addresses[index],
                                           stage: stages[0],
                                           currency: 'ETH' });
            this.collapse();
        });
    }

    expand() {
        this.setState({ expanded: true });
    }

    collapse() {
        this.setState({ expanded: false });
    }
}

class WalletAccountStages extends React.Component {
    render() {
        let reached_current_stage = false;
        const labels = [ 'Accepting investors',
                         'Funds deposited',
                         'Pump started',
                         'Pump complete',
                         'Funds withdrawn',
                         'Funds distributed' ];
        const items = stages.map((stage, index) => {
            if (stage === this.props.stage) {
                reached_current_stage = true;
                return <div className='Item Current' key={`stage_${stage}`}>✓ {labels[index]}</div>;
            }
            else if (reached_current_stage) {
                return <div className='Item Future' key={`stage_${stage}`}>☐ {labels[index]}</div>;
            }
            else {
                return <div className='Item Past' key={`stage_${stage}`}>✓ {labels[index]}</div>;
            }
        });
        return <div className='WalletAccountStages'>{items}</div>;
    }
}

class WalletAccountActions extends React.Component {
    render() {
        return <ul className='WalletAccountActions'>{this.get_actions(this.props.stage)}</ul>;
    }

    get_actions(stage) {
        const link_deposit_funds = <a className='Link'
                                      onClick={() => this.props.on_deposit_funds_click()}>deposit funds</a>;
        const link_convert_currency = <a className='Link'
                                         onClick={() => this.props.on_convert_currency_click()}>Convert currency</a>;
        const link_start_pump = <a className='Link'
                                   onClick={() => this.props.on_start_pump_click()}>Start pump</a>;
        const link_start_dump = <a className='Link'
                                   onClick={() => this.props.on_start_dump_click()}>Start dump</a>;
        const link_withdraw_funds = <a className='Link'
                                       onClick={() => this.props.on_withdraw_funds_click()}>Withdraw the funds</a>;
        const link_distribute_funds = <a className='Link'
                                         onClick={() => this.props.on_distribute_funds_click()}>Distribute the funds</a>;
        if (stage === 'accepting_investors') {
            return [<li className='Item' key='item_1'>Account is now accepting investors</li>,
                    <li className='Item' key='item_2'>Investors can send Ether to the address above</li>,
                    <li className='Item' key='item_3'>After receiving funds you can {link_deposit_funds} to exchange</li>];
        }
        else if (stage === 'funds_deposited') {
            return [<li className='Item' key='item_1'>Funds have been deposited at the exchange</li>,
                    <li className='Item' key='item_2'>{link_convert_currency}</li>,
                    <li className='Item' key='item_3'>{link_start_pump}</li>];
        }
        else if (stage === 'pump_started') {
            return [<li className='Item' key='item_1'>Pump has been started</li>,
                    <li className='Item' key='item_2'>Situation can be monitored on the exchange</li>,
                    <li className='Item' key='item_3'>{link_start_dump}</li>];
        }
        else if (stage === 'pump_complete') {
            let row_withdraw_funds = null;
            if (this.props.currency === 'ETH') {
                row_withdraw_funds = <li className='Item' key='item_4'>{link_withdraw_funds}</li>;
            }
            return [<li className='Item' key='item_1'>Pump has finished</li>,
                    <li className='Item' key='item_2'>{link_convert_currency}</li>,
                    <li className='Item' key='item_3'>{link_start_pump}</li>,
                    row_withdraw_funds,];
        }
        else if (stage === 'funds_withdrawn') {
            return [<li className='Item' key='item_1'>Funds have been withdrawn</li>,
                    <li className='Item' key='item_2'>To start another pump you must {link_deposit_funds}</li>,
                    <li className='Item' key='item_3'>{link_distribute_funds}</li>];
        }
        else if (stage === 'funds_distributed') {
            return [<li className='Item' key='item_1'>Funds have been distributed</li>];
        }
    }
}

class DepositFundsForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        let button;
        if (this.state.address) {
            button = <button className='Button'>Deposit</button>
        }
        return <form className='DepositFundsForm Form Padding2Top'
                     onSubmit={ event => this.on_submit(event) }>
            <input className='Input'
                   type='text'
                   placeholder='Exchange ETH wallet address'
                   autoFocus
                   style={{width: 640}}
                   onChange={event => this.on_change(event)}/>
            {button}
        </form>;
    }

    on_change(event) {
        this.setState({ address: event.target.value });
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit(this.state.address);
    }
}

class ConvertCurrencyForm extends React.Component {
    render() {
        const label = this.props.currency === 'ETH' ? 'Convert Ether to Bitcoin' : 'Convert Bitcoin to Ether'
        return <form className='ConvertCurrencyForm Form Padding2Top'
                     onSubmit={event => this.on_submit(event)}>
            <button className='Button'>{label}</button>
        </form>;
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit();
    }
}

class StartPumpForm extends React.Component {
    render() {
        return <form className='StartPumpForm Form Padding2Top'
                     onSubmit={event => this.on_submit(event)}>
            <button className='Button'>Start pump</button>
        </form>;
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit();
    }
}

class StartDumpForm extends React.Component {
    render() {
        return <form className='StartDumpForm Form Padding2Top'
                     onSubmit={event => this.on_submit(event)}>
            <button className='Button'>Start dump</button>
        </form>;
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit();
    }
}

class WithdrawFundsForm extends React.Component {
    render() {
        return <form className='WithdrawFundsForm Form Padding2Top'
                     onSubmit={event => this.on_submit(event)}>
            <button className='Button'>Withdraw</button>
        </form>;
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit();
    }
}

class DistributeFundsForm extends React.Component {
    render() {
        return <form className='DistributeFundsForm Form Padding2Top'
                     onSubmit={event => this.on_submit(event)}>
            <button className='Button'>Distribute</button>
        </form>;
    }

    on_submit(event) {
        event.preventDefault();
        this.props.on_submit();
    }
}

class WalletBalances extends React.Component {
    render() {
        let balance_exchange_eth = null;
        let balance_exchange_btc = null;
        if (this.props.address_exchange_eth) {
            balance_exchange_eth = <div className='Balance'>
            <div className='Amount'>0.31</div>
            <div className='Unit'>Ether</div>
            <div className='Label'>Exchange</div>
        </div>;
        }
        if (this.props.address_exchange_btc) {
            balance_exchange_btc = <div className='Balance'>
            <div className='Amount'>17.1</div>
            <div className='Unit'>Bitcoin</div>
            <div className='Label'>Exchange</div>
        </div>;
        }
        return <div className='WalletBalances Padding2Top'>
            <div className='Balance Local'>
                <div className='Amount'>150.54</div>
                <div className='Unit'>Ether</div>
                <div className='Label'>Wallet</div>
            </div>
            {balance_exchange_eth}
            {balance_exchange_btc}
        </div>;
    }
}

class WalletAccountTransactions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.load_transactions();
    }

    render() {
        let rows = null;
        if (this.state.transactions) {
            rows = this.state.transactions.map(transaction => this.render_transaction(transaction));
        }
        else {
            rows = <div className='Loading'>Loading..</div>
        }
        return <div className='WalletAccountTransactions Padding2Top'>
            <div className='Title'>Transaction log</div>
            {rows}
        </div>;
    }

    load_transactions() {
        const address = this.props.address;
        fetch(`http://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${etherscan_api_token}`)
            .then(res => res.json())
            .then(res => res.result)
            .then(transactions => transactions.reverse())
            .then(transactions => this.setState({transactions: transactions}));
    }

    render_transaction(transaction) {
        const is_incoming = transaction.to === this.props.address;
        return is_incoming ? this.render_incoming_transaction(transaction) : this.render_outgoing_transaction(transaction);
    }

    render_incoming_transaction(transaction) {
        return <div className='Transaction Incoming' key={`transaction_incoming_${transaction.hash}`}>
            Received <span className='Value'>{this.format_value(transaction.value)}</span> from <span className='Address'>{transaction.from}</span>
            <span className='Timespamp'>{this.format_timestamp(transaction.timeStamp)}</span>
        </div>;
    }

    render_outgoing_transaction(transaction) {
        return <div className='Transaction Outgoing' key={`transaction_outgoing_${transaction.hash}`}>
            <span className='Timespamp'>{this.format_timestamp(transaction.timeStamp)}</span>
            Sent <span className='Value'>{this.format_value(transaction.value)}</span> to <span className='Address'>{transaction.to}</span>
        </div>;
    }

    format_value(value) {
        return ethereum_units.convert(value, 'wei', 'ether').toString() + ' ether';
    }

    format_timestamp(timestamp) {
        const date = new Date(Number(timestamp) * 1000);
        return date.toGMTString()
    }
}

class WalletAccountDetails extends React.Component {
    default_state;
    constructor(props) {
        super(props);
        this.default_state = { show_deposit_funds_form: false,
                               show_convert_currency_form: false,
                               show_start_pump_form: false,
                               show_start_dump_form: false,
                               show_withdraw_funds_form: false,
                               show_distribute_funds_form: false, }
        this.state = {...this.default_state};
    }

    render() {
        const account = this.props.account;
        let deposit_funds_form = null;
        let convert_currency_form = null;
        let start_pump_form = null;
        let start_dump_form = null;
        let withdraw_funds_form = null;
        let distribute_funds_form = null;
        if (this.state.show_deposit_funds_form) {
            deposit_funds_form = <DepositFundsForm on_submit={address => this.submit_deposit_funds_form(address)}/>;
        }
        if (this.state.show_convert_currency_form) {
            convert_currency_form = <ConvertCurrencyForm on_submit={() => this.submit_convert_currency_form()}
                                                         currency={account.currency}/>;
        }
        if (this.state.show_start_pump_form) {
            start_pump_form = <StartPumpForm on_submit={() => this.submit_start_pump_form()}/>;
        }
        if (this.state.show_start_dump_form) {
            start_dump_form = <StartDumpForm on_submit={() => this.submit_start_dump_form()}/>;
        }
        if (this.state.show_withdraw_funds_form) {
            withdraw_funds_form = <WithdrawFundsForm on_submit={() => this.submit_withdraw_funds_form()}/>;
        }
        if (this.state.show_distribute_funds_form) {
            distribute_funds_form = <DistributeFundsForm on_submit={() => this.submit_distribute_funds_form()}/>;
        }
        return <div className='WalletAccountDetails Padding3'>
            <a className='Back'
               onClick={() => this.props.on_account_select()}>Back to accounts</a>
            <div className='Name'>{account.name}</div>
            <div className='Address'>{account.address_local_eth}</div>
            <WalletAccountStages stage={account.stage}/>
            <WalletAccountActions stage={account.stage}
                                  currency={account.currency}
                                  on_deposit_funds_click={() => this.show_deposit_funds_form()}
                                  on_convert_currency_click={() => this.show_convert_currency_form()}
                                  on_start_pump_click={() => this.show_start_pump_form()}
                                  on_start_dump_click={() => this.show_start_dump_form()}
                                  on_withdraw_funds_click={() => this.show_withdraw_funds_form()}
                                  on_distribute_funds_click={() => this.show_distribute_funds_form()}/>
            <WalletBalances address_exchange_eth={account.address_exchange_eth}
                            address_exchange_btc={account.address_exchange_btc}/>
            {deposit_funds_form}
            {convert_currency_form}
            {start_pump_form}
            {start_dump_form}
            {withdraw_funds_form}
            {distribute_funds_form}
            <WalletAccountTransactions address={'0x14c48295274d66dff94fc815006dc9108d8a3b8a'}/>
        </div>;
    }

    show_deposit_funds_form() {
        this.setState({ ...this.default_state, show_deposit_funds_form: true });
    }

    show_convert_currency_form() {
        this.setState({ ...this.default_state, show_convert_currency_form: true });
    }

    show_start_pump_form() {
        this.setState({ ...this.default_state, show_start_pump_form: true });
    }

    show_start_dump_form() {
        this.setState({ ...this.default_state, show_start_dump_form: true });
    }

    show_withdraw_funds_form() {
        this.setState({ ...this.default_state, show_withdraw_funds_form: true });
    }

    show_distribute_funds_form() {
        this.setState({ ...this.default_state, show_distribute_funds_form: true });
    }

    submit_deposit_funds_form(address) {
        this.setState({ ...this.default_state, show_deposit_funds_form: false });
        const account = this.props.account;
        account.stage = 'funds_deposited';
        account.address_exchange_eth = address;
        this.props.save_account(account);
    }

    submit_convert_currency_form() {
        this.setState({ ...this.default_state, show_convert_currency_form: false });
        const account = this.props.account;
        account.currency = account.currency === 'ETH' ? 'BTC' : 'ETH';
        if (account.currency === 'BTC') {
            account.address_exchange_btc = '...';
        }
        else if (account.currency === 'ETH') {
            account.address_exchange_btc = null;
        }
        this.props.save_account(account);
    }

    submit_start_pump_form() {
        this.setState({ ...this.default_state, show_start_pump_form: false });
        const account = this.props.account;
        account.stage = 'pump_started';
        this.props.save_account(account);
    }

    submit_start_dump_form() {
        this.setState({ ...this.default_state, show_start_dump_form: false });
        const account = this.props.account;
        account.stage = 'pump_complete';
        this.props.save_account(account);
    }

    submit_withdraw_funds_form() {
        this.setState({ ...this.default_state, show_withdraw_funds_form: false });
        const account = this.props.account;
        account.stage = 'funds_withdrawn';
        account.address_exchange_eth = null;
        this.props.save_account(account);
    }

    submit_distribute_funds_form() {
        this.setState({ ...this.default_state, show_distribute_funds_form: false });
        const account = this.props.account;
        account.stage = 'funds_distributed';
        this.props.save_account(account);
    }
}

class Wallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            setup: fs.existsSync(path_setup) && JSON.parse(fs.readFileSync(path_setup)),
            selected_account: null,
        }
    }

    render() {
        let content = null;
        if (this.is_setup_required()) {
            content = <WalletSetup on_setup={setup => this.write_setup_to_fs(setup)}/>;
        }
        else if (this.state.selected_account) {
            content = <WalletAccountDetails account={this.state.selected_account}
                                            on_account_select={() => this.on_account_select(null)}
                                            save_account={account => this.save_account(account)}/>;
        }
        else {
            const setup = this.state.setup;
            content = <div>
                <WalletAccountsList accounts={setup.accounts}
                                    on_account_select={account => this.on_account_select(account)}/>
                <WalletCreateAccount keystore={setup.keystore}
                                     password={setup.password}
                                     index={setup.accounts.length}
                                     on_create_account={account => this.on_create_account(account)}/>
            </div>;
        }
        return <div className='Wallet'>{content}</div>;
    }

    is_setup_required() {
        if (!fs.existsSync(path_setup)) return true;
        if (!this.state.setup)          return true;
        if (!this.state.setup.password) return true;
        if (!this.state.setup.seed)     return true;
        if (!this.state.setup.keystore) return true;
        if (!this.state.setup.accounts) return true;
        return false;
    }

    update_setup() {
        this.setState({
            setup: fs.existsSync(path_setup) && JSON.parse(fs.readFileSync(path_setup))
        });
    }

    on_create_account(account) {
        const setup = this.state.setup;
        setup.accounts.push(account);
        this.write_setup_to_fs(setup);
    }

    write_setup_to_fs(setup) {
        fs.writeFileSync(path_setup, JSON.stringify(setup, null, 2));
        this.update_setup();
    }

    on_account_select(account) {
        this.setState({selected_account: account});
    }

    save_account(account) {
        const setup = this.state.setup;
        setup.accounts[account.index] = account;
        this.write_setup_to_fs(setup);
    }
}

// ------ MarketResearch ------

class TradingPairFilter extends React.Component {
    render() {
        return <div className='TradingPairFilter Form'>
            <div className='Row'>
                <select className='Input'
                        defaultValue='BTC'
                        onChange={event => this.props.on_base_change(event.target.value)}>
                    <option value='BTC'>BTC</option>
                    <option value='ETH'>ETH</option>
                    <option value='XMR'>XMR</option>
                    <option value='USDT'>USDT</option>
                </select>
                <input className='Input' type='number' placeholder='Minimum volume' onChange={event => this.props.on_min_change(event.target.value)}/>
                <input className='Input' type='number' placeholder='Maximum volume' onChange={event => this.props.on_max_change(event.target.value)}/>
            </div>
        </div>;
    }
}

class TradingPairList extends React.Component {
    render() {
        const rows = this.props.pairs.map(pair => this.render_row(pair))
        return <table className='TradingPairList'>
            <thead>
                <tr>
                    <th className='CellHeader'>Pair</th>
                    <th className='CellHeader'>Volume</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>;
    }

    render_row(pair) {
        return <tr key={`trading_pair_row_${pair.pair}`}>
            <td className='Cell Pair'><a className='Link' onClick={() => this.props.on_select_pair(pair)}>{pair.pair}</a></td>
            <td className='Cell Volume'>{pair.volume.toFixed(8)} {pair.base}</td>
        </tr>
    }
}

class MarketResearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = { filter_base: 'BTC' };
        initialize_poloniex();
        if (poloniex) {
            poloniex.returnCurrencies((err, result) => this.setState({ currencies: result }));
            poloniex.return24hVolume((err, result) => this.setState({ volumes: result }));
        }
    }
    render() {
        if (!this.state.volumes) return null;
        const pair_keys = Object.keys(this.state.volumes).filter(key => key.indexOf('_') > -1);
        const pairs = pair_keys.map(key => {
            const split = key.split('_');
            const base = split[0];
            return {
                volume: Number(this.state.volumes[key][base]),
                pair: key,
                base: base
            };
        });
        const sorted = pairs.sort((a, b) => b.volume - a.volume);
        let filtered = sorted;
        if (this.state.filter_base) {
            filtered = filtered.filter(pair => pair.base === this.state.filter_base);
        }
        if (this.state.filter_min) {
            filtered = filtered.filter(pair => pair.volume >= this.state.filter_min);
        }
        if (this.state.filter_max) {
            filtered = filtered.filter(pair => pair.volume <= this.state.filter_max);
        }
        return <div className='MarketResearch Padding3'>
            <TradingPairFilter on_base_change={base => this.setState({filter_base: base})}
                               on_min_change={min => this.setState({filter_min: min})}
                               on_max_change={max => this.setState({filter_max: max})}/>
            <TradingPairList pairs={filtered}
                             on_select_pair={pair => this.get_order_book(pair)}/>
        </div>;
    }

    get_order_book(pair) {
        const split = pair.pair.split('_');
        const currency_1 = split[0];
        const currency_2 = split[1];
        poloniex.returnOrderBook(currency_1, currency_2, (err, result) => {
            console.log(err, result);
        });
    }
}

// ------ App ------

const initialize_poloniex = () => {
    if (!poloniex && fs.existsSync(path_setup)) {
        const setup = fs.readFileSync(path_setup);
        poloniex = new Poloniex(setup.poloniex_api_key, setup.poloniex_api_secret);
    }
};

class App extends React.Component {
    constructor(props) {
        super(props);
        initialize_poloniex();
    }

    render() {
        return <div className='App'>
            <Tabs children={[{ label: 'Wallet', content: <Wallet/> },
                             { label: 'MarketResearch', content: <MarketResearch/> }, ]}/>
        </div>;
    }
}

ReactDOM.render(<App/>, document.querySelector('#root'));
