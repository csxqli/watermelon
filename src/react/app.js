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
                <div className={classnames({Button: true, Selected: this.state.selected === index})}
                      onClick={on_click}
                      key={`tab_button_${index}`}>{child.label}</div>
            );
        });
        return <div className='Tabs'>
            <div className='Buttons'>{buttons}</div>
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
        let row_save = null;
        if (this.state.seed) {
            row_seed = <label className='Row'>
                <div className='Label'>Seed (write this down and keep it safe)</div>
                <code>{this.state.seed}</code>
            </label>;
            row_save = <label className='Row'>
                <button className='Input'>Save</button>
            </label>;
        }
        return <div className='WalletSetup Padding3'>
            <form className='Form'
                         onSubmit={event => this.on_submit(event)}>
                <label className='Row'>
                    <div className='Label'>Password</div>
                    <input className='Input'
                           type='password'
                           onKeyUp={event => this.on_password_change(event)}/>
                </label>
                <label className='Row'>
                    <div className='Label'>Confirm password</div>
                    <input className='Input'
                           type='password'
                           onKeyUp={event => this.on_confirm_change(event)}/>
                </label>
                {row_seed}
                {row_save}
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
            {JSON.stringify(accounts)}
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
            let row_create = null;
            if (this.state.name) {
                row_create = <label className='Row'>
                    <button className='Input'
                            onClick={() => this.on_submit()}>Create</button>
                </label>;
            }
            content = <div className='Form'>
                <label className='Row'>
                    <div className='Label'>Account name</div>
                    <input className='Input'
                           type='text'
                           onKeyUp={event => this.on_key_up(event)}/>
                </label>
                {row_create}
            </div>;
        }
        else {
            content = <button className='Input'
                              onClick={() => this.expand()}>Create account</button>;
        }
        return <div className='WalletCreateAccount Padding3'>
            {content}
        </div>
    }

    on_key_up(event) {
        this.setState({name: event.target.value});
    }

    on_submit() {
        const keystore = lightwallet.keystore.deserialize(this.props.keystore);
        keystore.keyFromPassword(this.props.password, (err, derived_key) => {
            if (err) throw err;
            const account_number = this.props.account_number;
            keystore.generateNewAddress(derived_key, account_number + 1);
            const addresses = keystore.getAddresses();
            this.props.on_create_account({
                name: this.state.name,
                created_on: new Date(),
                address: '0x' + addresses[account_number],
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

const path_setup = path.join(__dirname, '../data/setup.json');

class Wallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            setup: fs.existsSync(path_setup) && JSON.parse(fs.readFileSync(path_setup))
        }
    }

    render() {
        let content = null;
        if (this.is_setup_required()) {
            content = <WalletSetup on_setup={setup => this.write_setup_to_fs(setup)}/>;
        }
        else {
            const setup = this.state.setup;
            content = <div>
                <WalletAccountsList accounts={setup.accounts}/>
                <WalletCreateAccount keystore={setup.keystore}
                                     password={setup.password}
                                     account_number={setup.accounts.length}
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
