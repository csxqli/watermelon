const dom_js = require('dom_js');
const events = require('../app/events');
const setup = require('../app/setup');

const start = () => {
    if (setup.invalid()) events.trigger(events.create('render_setup'));
    else events.trigger(events.create('render_home'));
};

const render_setup = () => setup.render();

const render_home = () => null;

dom_js.add_event_listeners(document, {start, render_setup, render_home});
