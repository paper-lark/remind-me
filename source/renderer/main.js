/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/* Imports and modules */
const path = require('path');
const { ipcRenderer } = require('electron');
const handlers = EventHanderFactory();
const ipc = IPCHandlerFactory();

/* Properties */
let openedTab = 'ongoing';
let edited = undefined;
let colors = undefined;
let nextID = 1;

/* Elements */
let container = document.querySelector('.scrollable-container');
let entries = document.getElementsByClassName('entry-container');
let tabs = document.querySelectorAll('.tab');
let filter = document.querySelector('#filter');
let floating = document.querySelector('.floating');
let current = document.querySelectorAll(
  `.entry-container[data-type='${openedTab}']`
);

/* Function resolves color using default in case the tag is not specified in the color scheme */
function resolveColor(tag) {
  const def = '#00C853';
  return colors[tag] ? colors[tag] : def;
}

/* Function creates a DOM element for a reminder with handlers attached */
function createReminder(entry) {
  let el = render(entry);
  el.setAttribute('data-id', nextID++);
  el.addEventListener('dblclick', handlers.entryClick);
  el.addEventListener('keypress', handlers.entryInput);
  let ticks = el.querySelectorAll('.check');
  ticks.forEach(tick => tick.addEventListener('click', handlers.tick));
  return el;
}

/* Function renders a list of DOM reminders based on entries */
function createList(reminders) {
  container.innerHTML = '';
  reminders.forEach(entry => container.appendChild(createReminder(entry)));
  openTab(openedTab);
}

/* Function opens a tab */
function openTab(title) {
  if (openedTab !== title) {
    openedTab = title;
    tabs.forEach(tab => {
      if (tab.getAttribute('data-type') !== title) {
        tab.classList.remove('active');
      } else {
        tab.classList.add('active');
      }
    });
  }

  current = Array.prototype.filter.call(
    entries,
    entry => entry.getAttribute('data-type') === title
  );
  Array.prototype.forEach.call(
    entries,
    entry => (entry.style.display = 'none')
  );
  current.forEach(entry => (entry.style.display = ''));
  handlers.filterInput();
}

/* Tether handlers */
tabs.forEach(tab => tab.addEventListener('click', handlers.tabClick));
filter.addEventListener('input', handlers.filterInput);
floating.addEventListener('click', handlers.newReminder);

/* Function starts a routine on checking reminders */
function checkRoutine() {
  const interval = 30000;

  // Notify about expired
  window.setTimeout(() => {
    Array.prototype.forEach.call(entries, reminder => {
      if (reminder.getAttribute('data-type') === 'expired') {
        ipc.remind(reminder);
      }
    });
  }, 500);

  // Check routine
  window.setInterval(() => {
    let current = new Date(Date.now());
    Array.prototype.forEach.call(entries, reminder => {
      if (reminder.getAttribute('data-type') === 'ongoing') {
        let date = new Date(reminder.getAttribute('data-time'));
        if (date <= current) {
          try {
            ipc.remind(reminder);
            reminder.setAttribute('data-type', 'expired');
          } catch (err) {
            notify({
              type: 'warning',
              message: err.message
            });
          }
        }
      }
    });
    openTab(openedTab);
  }, interval);
}

/* Initialize view */
function init() {
  createCustomControls();
  ipc.fetch();
  checkRoutine();
}
init();
