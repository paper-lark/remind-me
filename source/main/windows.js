/*
 * Module is responsible for window management
 */

/* Imports */
const { BrowserWindow, Menu } = require('electron');
const url = require('url');
const path = require('path');

/* Handles */
module.exports = {
  main: undefined,
  closing: false
};

/* Create main window */
function createMainWindow() {
  const winOptions = {
    width: 400,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    backgroundColor: '#FFFFFF',
    title: 'Remind Me.app',
    show: false,
    frame: process.platform === 'darwin',
    transparent: process.platform === 'darwin',
    titleBarStyle: 'hiddenInset'
  };
  let window = new BrowserWindow(winOptions);
  window.loadURL(
    url.format({
      pathname: path.join(__dirname, '..', '..', 'views', 'main.html'),
      protocol: 'file:',
      slashes: true
    })
  );
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => (module.exports.main = undefined));
  module.exports.main = window;
}

/* Create menu bar */
function createMenuBar() {
  let template = [
    {
      label: 'Remind Me',
      submenu: [
        { label: 'Preferences' },
        { label: 'About' },
        { type: 'separator' },
        { latel: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [{ label: 'Open in Fullscreen Mode', role: 'togglefullscreen' }]
    },
    {
      label: 'Developer',
      submenu: [{ label: 'Toggle Developers Tools', role: 'toggledevtools' }]
    }
  ];
  let bar = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(bar);
}

module.exports.createMainWindow = createMainWindow;
module.exports.createMenuBar = createMenuBar;
