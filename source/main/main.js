/* Imports */
const { app, ipcMain, Notification } = require('electron');
const agent = require('./fs-agent');
const windows = require('./windows');
const lifetime = 7 * 24 * 60 * 60 * 1000; // after a week completed reminders are deleted
let colors = undefined;

/* Function creates IPC channels on the main process end */
function initIPC() {
  /* Fetch reminders request */
  ipcMain.on('reminders-request', event => {
    console.log('> reminders list requested');
    agent.fetch(list => {
      list = list.filter(reminder => {
        let date = new Date(reminder.date);
        let now = new Date(Date.now());
        if (now - date >= lifetime && reminder.completed) {
          console.log('> throwing out a reminder');
          return false;
        } else {
          return true;
        }
      });
      event.sender.send('reminders-response', {
        list: list,
        colors: colors
      });
    });
  });

  /* Save request */
  ipcMain.on('save', (event, args) => {
    agent.save(args, () => {
      console.log('> saved!');
      if (windows.closing) {
        windows.main.close();
      } else {
        event.sender.send('notify', {
          message: 'Saved successfully',
          type: 'success'
        });
      }
    });
  });

  /* Notify user */
  ipcMain.on('remind', (event, arg) => {
    if (Notification.isSupported()) {
      let notification = new Notification({
        title: 'Remind Me',
        body: arg.content,
        silent: false
      });
      let sender = event.sender;
      notification.id = arg.id;
      notification.on('click', () => {
        console.log('> notification clicked');
        sender.send('scroll', arg.id);
      });
      notification.show();
    }
  });

  /* Minimize */
  ipcMain.on('minimize-window', () => {
    windows.main.minimize();
  });

  /* Expand */
  ipcMain.on('expand-window', () => {
    windows.main.setFullScreen(!windows.main.isFullScreen());
  });

  /* Close */
  ipcMain.on('close-window', () => {
    windows.main.close();
  });
}

/* Save before exit */
function save(event) {
  event.preventDefault();
  windows.main.removeListener('close', save);
  windows.closing = true;
  windows.main.webContents.send('closing');
}

/* Events */
app.on('ready', () => {
  agent
    .colors()
    .then(result => {
      colors = result;
      initIPC();
      windows.createMainWindow();
      windows.main.on('close', save);
      windows.createMenuBar();
    })
    .catch(err => console.error(err));
});
app.on('activate', () => {
  if (windows.main == undefined) {
    windows.createMainWindow();
  }
});
app.on('window-all-closed', () => {
  app.quit();
});
