import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import lightwallet from 'eth-lightwallet';

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
                           type='password'
                           placeholder='Password'
                           autoFocus
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
            <div className='Address'>{account.address}</div>
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
        return <div className='WalletCreateAccount Padding3'>
            {content}
        </div>
    }

    on_key_up(event) {
        this.setState({name: event.target.value});
    }

    on_submit(event) {
        event.preventDefault();
        const keystore = lightwallet.keystore.deserialize(this.props.keystore);
        keystore.keyFromPassword(this.props.password, (err, derived_key) => {
            if (err) throw err;
            const index = this.props.index;
            keystore.generateNewAddress(derived_key, index + 1);
            const addresses = keystore.getAddresses();
            this.props.on_create_account({
                name: this.state.name,
                index: index,
                created_on: new Date(),
                address: '0x' + addresses[index],
            });
            this.collapse();
        });
    }

    expand() {
        this.setState({expanded: true});
    }

    collapse() {
        this.setState({expanded: false});
    }
}

class WalletSelectedAccount extends React.Component {
    render() {
        const account = this.props.account;
        return <div className='WalletSelectedAccount Padding3'>
            <h1>{account.name}</h1>
            <h4>{account.address}</h4>
        </div>;
    }
}

const path_setup = path.join(__dirname, '../data/setup.json');

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
            content = <WalletSelectedAccount account={this.state.selected_account}/>;
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
}

// ------ MarketResearch ------

class MarketResearch extends React.Component {
    render() {
        return <div className='MarketResearch Padding3'>
            <h1>MarketResearch</h1>
        </div>;
    }
}

// ------ App ------

class App extends React.Component {
    render() {
        return <div className='App'>
            <Tabs children={[
                { label: 'Wallet', content: <Wallet/> },
                { label: 'MarketResearch', content: <MarketResearch/> },
            ]}/>
        </div>;
    }
}

ReactDOM.render(<App/>, document.querySelector('#root'));
