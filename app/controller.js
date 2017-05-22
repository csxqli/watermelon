const dom_js = require('dom_js');
const events = require('../app/events');
const setup = require('../app/setup');
const overview = require('./overview');
const login = require('./login');

const start = () => {
    if (setup.invalid()) events.trigger('render_setup');
    else events.trigger('render_login');
};

const render_login = () => login.render();

const render_setup = () => setup.render();

const render_overview = () => overview.render();

dom_js.add_event_listeners(document, {
    start,
    render_setup,
    render_login,
    render_overview
});
