import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

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
                      onClick={on_click}>{child.label}</span>
            );
        });
        return <div className='Tabs'>
            <div className='Buttons'>{buttons}</div>
            <div className='Content'>{this.props.children[this.state.selected].content}</div>
        </div>;
    }
}

// ------ Wallet ------

class Wallet extends React.Component {
    render() {
        return <h1>Wallet</h1>;
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
