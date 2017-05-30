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
                <span className={classnames({Button: true, Selected: this.state.selected === index})}
                      onClick={on_click}
                      key={`tab_button_${index}`}>{child.label}</span>
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
                <span className='Label'>Seed (write this down and keep it safe)</span>
                <code>{this.state.seed}</code>
            </label>;
            row_save = <label className='Row'>
                <button className='Input'>Save</button>
            </label>;
        }
        return <form className='Form' onSubmit={event => this.on_submit(event)}>
            <label className='Row'>
                <span className='Label'>Password</span>
                <input className='Input'
                       type='password'
                       onKeyUp={event => this.on_password_change(event)}/>
            </label>
            <label className='Row'>
                <span className='Label'>Confirm password</span>
                <input className='Input'
                       type='password'
                       onKeyUp={event => this.on_confirm_change(event)}/>
            </label>
            {row_seed}
            {row_save}
        </form>;
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

class WalletAccounts extends React.Component {
    render() {
        return <div>accounts</div>
    }
}

const path_setup = path.join(__dirname, '../data/setup.json');

class Wallet extends React.Component {
    constructor(props) {
        super(props);
        this.update_setup();
    }

    render() {
        let content = null;
        if (this.is_setup_required()) {
            content = <WalletSetup on_setup={setup => this.write_setup_to_fs(setup)}/>;
        }
        else if (this.state.setup) {
            content = <WalletAccounts/>;
        }
        return <div className='Wallet'>{content}</div>;
    }

    is_setup_required() {
        if (!fs.existsSync(path_setup)) return true;
        if (!this.state.setup) return true;
        if (!this.state.setup.password) return true;
        if (!this.state.setup.seed) return true;
        if (!this.state.setup.keystore) return true;
        if (!this.state.setup.accounts) return true;
        return false;
    }

    update_setup() {
        this.state = {
            setup: fs.existsSync(path_setup) && JSON.parse(fs.readFileSync(path_setup))
        };
    }

    write_setup_to_fs(setup) {
        fs.writeFileSync(path_setup, JSON.stringify(setup, null, 2));
        this.update_setup();
        this.forceUpdate();
    }
}

// ------ CoinAnalysis ------

class CoinAnalysis extends React.Component {
    render() {
        return <h1>CoinAnalysis</h1>;
    }
}

// ------ App ------

class App extends React.Component {
    render() {
        return <div className='App'>
            <Tabs children={[
                { label: 'Wallet', content: <Wallet/> },
                { label: 'Coin Analysis', content: <CoinAnalysis/> },
            ]}/>
        </div>;
    }
}

ReactDOM.render(<App/>, document.querySelector('#root'));
