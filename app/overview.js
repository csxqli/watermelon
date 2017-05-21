const dom_js = require('dom_js');

const labels = {
    title: 'Overview'
};

const render = () => {
    const title = dom_js.create_element('h2.title', null, [labels.title]);
    const view = dom_js.create_element('div.home', {}, [title]);
    const root = document.querySelector('#root');
    dom_js.append_child(root, view)
};

module.exports = {render};
