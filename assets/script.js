/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Module is responsibe for rendering custom controls on Windows.
 */

function createCustomControls() {
  if (process.platform !== 'darwin') {
    let buttons = document.createElement('div');
    buttons.className = 'controls-container';
    buttons.innerHTML = `
      <div class="controls" onclick="ipc.minimize()"><i class="minimize-icon"></i></div>
      <div class="controls" onclick="ipc.expand()"><i class="expand-icon"></i></div>
      <div class="controls" onclick="ipc.close()"><i class="close-icon"></i></div>
    `;
    document.body.appendChild(buttons);
  }
}

/* eslint no-unused-vars: off */

/*
 * Converter module.
 * Converts DOM reminders into text and text to entries.
 */

/* Function converts node reminder into text */
function toText(node) {
  let main = node.querySelector('.entry');
  let subs = node.querySelectorAll('.sub-entry');
  let result = '';

  function entryToText(entry) {
    let text = '';
    text += entry.querySelector('.check').classList.contains('selected-icon')
      ? '+'
      : '-';
    text += ' ' + entry.querySelector('.content').textContent;
    return text;
  }

  function format(number) {
    if (number < 10) {
      return `0${number}`;
    } else {
      return `${number}`;
    }
  }
  result += entryToText(main) + '\n';

  subs.forEach(sub => {
    result += '  ' + entryToText(sub) + '\n';
  });

  result += node.getAttribute('data-tag');
  if (node.getAttribute('data-time') != undefined) {
    let date = new Date(node.getAttribute('data-time'));
    let hour = date.getHours();
    let minute = date.getMinutes();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    result += ` - ${format(month)}/${format(day)}/${year} ${format(
      hour
    )}:${format(minute)}`;
  }

  return result;
}

/* Function trims spaces in the string */
function trim(str) {
  let exp = /^\s*(\S.*\S)\s*$/g;
  let result = exp.exec(str);
  if (result == undefined || result.length === 1) {
    return '';
  } else {
    return result[1];
  }
}

/* Function converts text into an entry */
function toEntry(text) {
  let lines = text
    .split('\n')
    .map(line => trim(line))
    .filter(line => line !== '');
  if (lines.length === 0) {
    throw new Error('Reminder deleted');
  } else if (lines.length < 2) {
    throw new Error('Invalid reminder format');
  }
  let main = trim(lines[0]);
  let subs = lines.slice(1, lines.length - 1);
  let footer = lines[lines.length - 1];

  if (main[0] !== '+' && main[0] !== '-') {
    throw new Error('Tasks should start with +/-');
  }

  let entry = {
    task: trim(main.slice(1)),
    completed: main[0] === '+',
    subtasks: []
  };
  if (entry.task.length === 0) {
    throw new Error('No description for a task was specified');
  }

  let split = footer.split('-');
  entry.tag = trim(split[0]).toLowerCase();
  if (entry.tag.length === 0) {
    throw new Error('No tag specified');
  }
  if (split.length === 2) {
    /* Scheduled */
    entry.scheduled = true;
    if (isNaN(Date.parse(split[1]))) {
      throw new Error('Invalid date. Format: mm/dd/yy hh:mm');
    }
    entry.date = new Date(split[1]);
  } else {
    /* No time */
    entry.scheduled = false;
  }

  subs.forEach(line => {
    line = trim(line);
    if (line[0] !== '+' && line[0] !== '-') {
      throw new Error('Tasks should start with +/-');
    }
    let item = {
      content: trim(line.slice(1)),
      completed: line[0] === '+'
    };
    if (item.content.length === 0) {
      throw new Error('No description for a subtask was specified');
    }
    entry.subtasks.push(item);
  });

  return entry;
}

/* Module object */
const convert = {
  toText: toText,
  toEntry: toEntry
};

/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Event handler module.
 * Contains a factory for an event handler object.
 */

function EventHanderFactory() {
  /* Tab click. Change active tab. */
  function tabClick(event) {
    openTab(this.getAttribute('data-type'));
  }

  /* Entry click */
  function entryClick(event) {
    if (edited != undefined) {
      try {
        let entry = convert.toEntry(edited.innerHTML);
        entry.color = resolveColor(entry.tag);
        this.contentEditable = 'false';
        edited.parentNode.replaceChild(createReminder(entry), edited);
        openTab(openedTab);
        notify({
          type: 'success',
          message: 'Reminder added'
        });
      } catch (err) {
        console.error(`> failed to create an entry: ${err.message}`);
        notify({
          type: 'error',
          message: err.message
        });
        if (err.message === 'Reminder deleted') {
          edited.parentNode.removeChild(edited);
          openTab(openedTab);
        }
      }
    }
    if (edited === this) {
      edited = undefined;
    } else {
      edited = this;
      let text = convert.toText(this);
      this.innerHTML = text;
      this.contentEditable = 'true';
    }
  }

  /* Entry input */
  function entryInput(event) {
    if (event.keyCode === 13 && event.shiftKey) {
      /* Shift + Enter */
      event.preventDefault();
      document.execCommand('insertHTML', false, '\n');
    } else if (event.keyCode === 13) {
      /* Enter */
      event.preventDefault();
      entryClick.call(this, event);
    }
  }

  /* Box click. Change icon and move to completed if the main tick is set */
  function tick(event) {
    let entry = this.parentNode;
    let container = entry.parentNode;
    this.classList.toggle('unselected-icon');
    this.classList.toggle('selected-icon');
    if (entry.classList.contains('entry')) {
      /* Main entry */
      if (this.classList.contains('selected-icon')) {
        /* Move to completed */
        container.setAttribute('data-type', 'completed');
      } else if (container.getAttribute('data-time') == undefined) {
        /* Move to unscheduled */
        container.setAttribute('data-type', 'unscheduled');
      } else if (Date.now() > new Date(container.getAttribute('data-time'))) {
        /* Move to expired */
        container.setAttribute('data-type', 'expired');
      } else {
        /* Move to ongoing */
        container.setAttribute('data-type', 'ongoing');
      }
      openTab(openedTab);
    }
  }

  /* Filter input. Filter reminders by tag. */
  function filterInput(event) {
    let keywords = filter.value
      .split(' ')
      .filter(word => word !== '')
      .map(word => word.toLowerCase());
    current.forEach(entry => {
      let tag = entry.getAttribute('data-tag');
      if (
        keywords.length === 0 ||
        keywords.reduce((acc, val) => acc || tag.startsWith(val), false)
      ) {
        entry.style.display = 'flex';
      } else {
        entry.style.display = 'none';
      }
    });
  }

  /* Floating button. Add new reminder */
  function newReminder(event) {
    let options = {
      task: 'New note',
      scheduled: false,
      subtasks: [],
      tag: 'personal'
    };
    let reminder = createReminder(options);
    container.appendChild(reminder);
    entryClick.call(reminder, undefined);
    openTab('unscheduled');
  }

  return {
    tabClick: tabClick,
    entryClick: entryClick,
    entryInput: entryInput,
    filterInput: filterInput,
    newReminder: newReminder,
    tick: tick
  };
}

/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * IPC module.
 * Contains a factory for an IPC handler object.
 */

function IPCHandlerFactory() {
  /* Function fetches reminders */
  function fetch() {
    ipcRenderer.on('reminders-response', (event, args) => {
      let list = args.list;
      colors = args.colors;
      list.forEach(reminder => {
        reminder.color = resolveColor(reminder.tag);
        if (reminder.scheduled) {
          reminder.date = new Date(reminder.date);
        }
      });
      createList(list);
      notify({
        type: 'success',
        message: 'Reminders successfully loaded'
      });
    });
    ipcRenderer.send('reminders-request');
  }

  /* Function saves changes */
  function save() {
    /* Function serializes a note given its DOM element */
    function serialize(el) {
      let obj = {};
      let main = el.querySelector('.entry');
      let subs = el.querySelectorAll('.sub-entry');
      let footer = el.querySelector('.footer');

      /* Set task */
      obj.task = main.querySelector('.content').textContent;

      /* Set subtasks */
      obj.subtasks = [];
      subs.forEach(sub => {
        let res = {};
        res.completed = sub
          .querySelector('.check')
          .classList.contains('selected-icon');
        res.content = sub.querySelector('.content').textContent;
        obj.subtasks.push(res);
      });

      /* Set scheduled */
      obj.scheduled = el.getAttribute('data-time') != undefined;

      /* Set date */
      if (obj.scheduled) {
        obj.date = el.getAttribute('data-time');
      }

      /* Set completed */
      obj.completed = el.getAttribute('data-type') === 'completed';

      /* Set tag */
      obj.tag = footer.querySelector('.badge').innerHTML.toLowerCase();

      return obj;
    }

    let list = [];
    Array.prototype.forEach.call(entries, entry => {
      list.push(serialize(entry));
    });
    ipcRenderer.send('save', list);
  }

  /* Function sends a notification about the given DOM reminder */
  function remind(el) {
    let inner = el.querySelector('.entry .content');
    if (inner == undefined) {
      throw new Error('Scheduled reminder is being edited');
    }
    let content = inner.textContent;
    let id = el.getAttribute('data-id');
    ipcRenderer.send('remind', {
      content: content,
      id: id
    });
  }

  /* Scroll reminder into view */
  ipcRenderer.on('scroll', (event, id) => {
    let reminder = undefined;
    Array.prototype.forEach.call(entries, entry => {
      if (entry.getAttribute('data-id') === id) {
        reminder = entry;
      }
    });
    if (reminder == undefined) {
      throw new Error('Attempt to scroll non-existant reminder into view');
    }
    console.dir(reminder);
    openTab(reminder.getAttribute('data-type'));
  });

  function minimize() {
    ipcRenderer.send('minimize-window');
  }
  function expand() {
    ipcRenderer.send('expand-window');
  }
  function close() {
    ipcRenderer.send('close-window');
  }

  /* Receive notifications */
  ipcRenderer.on('notify', (event, args) => {
    notify(args);
  });

  /* Window will be closed */
  ipcRenderer.on('closing', (event, args) => {
    save();
  });

  return {
    fetch: fetch,
    save: save,
    remind: remind,
    minimize: minimize,
    close: close,
    expand: expand
  };
}

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

/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Module handles notifications.
 */

/* Notification tray */
let element = document.querySelector('.notification');

/* Function creates an in-app notification */
function notify(notification) {
  element.className = `notification ${notification.type}`;
  element.innerHTML = notification.message;
  element.style.transform = 'translateY(0%)';
  window.setTimeout(() => {
    element.style.transform = '';
  }, 2000);
}

/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Render module.
 * Render DOM reminders from entries.
 */

/* Function capitalizes the first letter of the string */
function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

/* Function creates a text representation of the time object */
function generateTime(date) {
  let hour = date.getHours();
  let minute = date.getMinutes();
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  function format(number) {
    if (number < 10) {
      return `0${number}`;
    } else {
      return `${number}`;
    }
  }

  let now = new Date(Date.now());
  if (
    now.getDate() === day &&
    now.getMonth() === month &&
    now.getFullYear() === year
  ) {
    return `due to ${format(hour)}:${format(minute)}`;
  } else {
    return `due to ${format(day)}/${format(month + 1)}/${year}`;
  }
}

/* Function renders a reminder element based on the entry info */
function render(entry) {
  console.dir(entry);
  let el = document.createElement('div');
  el.className = 'entry-container';
  /* Set data-type */
  if (entry.completed) {
    el.setAttribute('data-type', 'completed');
  } else if (!entry.scheduled) {
    el.setAttribute('data-type', 'unscheduled');
  } else if (entry.date <= Date.now()) {
    el.setAttribute('data-type', 'expired');
  } else {
    el.setAttribute('data-type', 'ongoing');
  }

  /* Set data-tag */
  el.setAttribute('data-tag', entry.tag);

  /* Set data-time */
  if (entry.scheduled) {
    el.setAttribute('data-time', entry.date.toString());
  }

  /* Set inner content */
  let inner = `<div class="entry">
               <i class="check ${
                 entry.completed ? 'selected-icon' : 'unselected-icon'
               }"></i>
               <span class="content">${entry.task}</span>
             </div>`;

  entry.subtasks.forEach(sub => {
    inner += `<div class="sub-entry">
               <i class="check ${
                 sub.completed ? 'selected-icon' : 'unselected-icon'
               }"></i>
               <span class="content">${sub.content}</span>
             </div>`;
  });
  if (entry.scheduled) {
    inner += `<div class="footer">
               <div class="badge" style="background: ${
                 entry.color
               }">${capitalize(entry.tag)}</div>
               <div class="time">${generateTime(entry.date)}</div>
             </div>`;
  } else {
    inner += `<div class="footer">
               <div class="badge" style="background: ${
                 entry.color
               }">${capitalize(entry.tag)}</div>
             </div>`;
  }
  el.innerHTML = inner;

  return el;
}
