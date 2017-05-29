const path = require('path');
const url = require('url');
const exec = require('child_process').exec;
const electron = require('electron');

const main = () => {
    const path_html = path.join(__dirname, '../../dist/watermelon.html');
    const main_window = new electron.BrowserWindow({width: 1024, height: 768});
    main_window.loadURL(url.format({
        pathname: path_html,
        protocol: 'file:',
        slashes: true
    }));
};

electron.app.on('ready', main);

electron.app.on('window-all-closed', () => electron.app.quit());
