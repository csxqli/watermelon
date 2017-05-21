const dom_js = require('dom_js');
const events = require('../app/events');
const setup = require('../app/setup');
const overview = require('./overview');

const start = () => {
    if (setup.invalid()) events.trigger(events.create('render_setup'));
    else events.trigger(events.create('render_overview'));
};

const render_setup = () => setup.render();

const render_overview = () => overview.render();

dom_js.add_event_listeners(document, {start, render_setup, render_overview});
