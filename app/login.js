const dom_js = require('dom_js');
const setup = require('../app/setup');
const events = require('../app/events');

const labels = {
    title: 'Login',
    input: 'Password',
    button: 'Submit'
};

const render = () => {
    const title = dom_js.create_element('h2.title', null, [labels.title]);
    let input;
    let button;
    input = dom_js.create_element(
        'input.input',
        {type: 'password', placeholder: labels.input},
        null,
        {keyup: event => {
            button.disabled = input.value.length === 0;
            if (!button.disabled && event.keyCode === dom_js.key_codes.enter) button.click();
        }}
    );
    const verify_password = () => {
        if (input.value === setup.get_setup().password) events.trigger('render_overview');
        else {
            window.alert('Incorrect password');
            input.focus();
        }
    };
    button = dom_js.create_element(
        'button.button',
        {type: 'button', disabled: true},
        [labels.button],
        {click: verify_password}
    );
    const view = dom_js.create_element('div.login', null, [title, input, button]);
    const root = document.querySelector('#root');
    dom_js.empty_element(root);
    dom_js.append_child(root, view);
    input.focus();
};

module.exports = {render};
