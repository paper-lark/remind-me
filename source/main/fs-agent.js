/**
 * This module contains functions for file system interactions.
 */

/* Imports */
const fs = require('fs');
const path = require('path');
const os = require('os');

/* App info */
const colorname = 'colors.json';
const filename = 'reminders.json';
const folder = 'remind-me';

/*
 * Function resolves the path to app data depending on the system.
 * Required application directories are created if they are not present.
 */
function resolve() {
  if (os.platform() === 'darwin') {
    /* macOS */
    let pathname = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      folder
    );
    if (!fs.existsSync(pathname)) {
      fs.mkdirSync(pathname);
    }
    console.log(`> path chosen: ${pathname}`);
    return pathname;
  } else if (os.platform() === 'win32') {
    /* Windows */
    let pathname = path.join(os.homedir(), '\\AppData\\Roaming\\', folder);
    if (!fs.existsSync(pathname)) {
      fs.mkdirSync(pathname);
    }
    console.log(`> path chosen: ${pathname}`);
    return pathname;
  } else {
    /* Unsupported platform */
    throw new Error('Unsupported OS detected');
  }
}

/*
 * Function creates a sample list of reminders.
 * Function asynchronously saves the list and calls the callback fucnction with it.
 */
function create(callback) {
  let list = [
    {
      task: 'Clean the house',
      subtasks: [
        {
          content: 'Wash the floor',
          completed: false
        },
        {
          content: 'Water plants',
          completed: false
        },
        {
          content: 'Clean shelves from dust',
          completed: true
        }
      ],
      scheduled: true,
      date: new Date('November 31, 2018 03:24:10'),
      completed: false,
      tag: 'general'
    }
  ];
  save(list, () => {
    console.log('> new sample list created');
    callback(list);
  });
}

/*
 * Function reads a list of notes from the file.
 * If the file does not exist a default list is created.
 */
function fetch(callback) {
  const pathname = resolve();
  fs.readFile(path.join(pathname, filename), (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        /* Create sample list */
        create(callback);
      }
      return;
    }
    let list = JSON.parse(data);
    callback(list);
  });
}

/*
 * Function saves changes in the list on the drive.
 * If the list was saved successfully a callback is called, if present.
 */
function save(list, callback) {
  const pathname = resolve();
  fs.writeFile(
    path.join(pathname, filename),
    JSON.stringify(list),
    {
      encoding: 'utf-8',
      mode: 0o640
    },
    err => {
      if (err) {
        console.error('error on saveChanges()');
        console.error(err);
      } else if (callback) {
        callback();
      }
    }
  );
}

/*
 * Function fetches the color profile from the user's directory.
 * Returns a promise.
 */
function fetchColors() {
  const pathname = resolve();
  return new Promise(function(resolve) {
    let file = path.join(pathname, colorname);
    if (!fs.existsSync(file)) {
      let data = {
        home: '#AA00FF',
        work: '#FF6D00',
        personal: '#388E3C',
        project: '#0091EA'
      };
      fs.writeFileSync(file, JSON.stringify(data), {
        encoding: 'utf-8',
        mode: 0o640
      });
      console.log('> new color profile created');
      resolve(data);
    } else {
      let raw = fs.readFileSync(file, { encoding: 'utf8' });
      let data = JSON.parse(raw);
      resolve(data);
    }
  });
}

module.exports = {
  colors: fetchColors,
  fetch: fetch,
  save: save
};
