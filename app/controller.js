const dom_js = require('dom_js');

// start
document.addEventListener('start', (event) => {
    dom_js.append_child(document.getElementById('root'), 'hello world');
});
