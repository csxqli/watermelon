const trigger = (type, details) => document.dispatchEvent(new CustomEvent(type, {details}));

module.exports = {trigger};
