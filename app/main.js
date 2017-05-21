require('../app/controller');
const events = require('../app/events');

window.onload = () => events.trigger(events.create('start'));
