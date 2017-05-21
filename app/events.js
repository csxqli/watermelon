const create = (type, details) => new CustomEvent(type, {details});

const trigger = event => document.dispatchEvent(event);

module.exports = {create, trigger};
