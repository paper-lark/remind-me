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
let nextID = 1; //DEBUG: missing IDs

/* Elements */
let container = document.querySelector('.scrollable-container');
let entries = document.querySelectorAll('.entry-container'); //TODO make live
let tabs = document.querySelectorAll('.tab');
let filter = document.querySelector('#filter');
let floating = document.querySelector('.floating');
let current = document.querySelectorAll(
  `.entry-container[data-type='${openedTab}']`
); //TODO make live

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
  entries = document.querySelectorAll('.entry-container');
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

  current = document.querySelectorAll(`.entry-container[data-type='${title}']`);
  entries.forEach(entry => (entry.style.display = 'none'));
  current.forEach(entry => (entry.style.display = ''));
  handlers.filterInput();
}

/* Event Handler factory */
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
        if (colors[entry.tag]) {
          entry.color = colors[entry.tag];
        }
        this.contentEditable = 'false';
        edited.parentNode.replaceChild(createReminder(entry), edited);
        entries = document.querySelectorAll('.entry-container');
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
      entries = document.querySelectorAll('.entry-container');
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
    entries = document.querySelectorAll('.entry-container');
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

/* IPC Handler Factory */
function IPCHandlerFactory() {
  /* Function fetches reminders */
  function fetch() {
    ipcRenderer.on('reminders-response', (event, args) => {
      console.log('> reminders-response received');
      let list = args.list;
      colors = args.colors;
      list.forEach(reminder => {
        reminder.color = colors[reminder.tag];
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
    entries.forEach(entry => {
      list.push(serialize(entry));
    });
    ipcRenderer.send('save', list);
  }

  /* Function sends a notification about the given DOM reminder */
  function remind(el) {
    let content = el.querySelector('.entry .content').textContent;
    let id = el.getAttribute('data-id');
    ipcRenderer.send('remind', {
      content: content,
      id: id
    });
  }

  /* Scroll reminder into view */
  ipcRenderer.on('scroll', (event, id) => {
    console.log(`> scrolling #${id} into view`);
    //TODO scroll into view
    let reminder = undefined;
    entries.forEach(entry => {
      if (entry.getAttribute('data-id') === id) {
        console.log('found!');
        reminder = entry;
      }
    });
    if (reminder == undefined) {
      throw new Error('Attempt to scroll non-existant reminder into view');
    }
    console.dir(reminder);
    openTab(reminder.getAttribute('data-type'));
  });

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
    remind: remind
  };
}

/* Tether handlers */
tabs.forEach(tab => tab.addEventListener('click', handlers.tabClick));
filter.addEventListener('input', handlers.filterInput);
floating.addEventListener('click', handlers.newReminder);

/* Function starts a routine on checking reminders */
function checkRoutine() {
  const interval = 30000;
  window.setInterval(() => {
    console.log('> check...');
    let current = new Date(Date.now());
    let previous = new Date(Date.now() - interval);
    entries.forEach(reminder => {
      if (reminder.getAttribute('data-type') === 'ongoing') {
        let date = new Date(reminder.getAttribute('data-time'));
        if (date > previous && date <= current) {
          console.log('> caught!');
          reminder.setAttribute('data-type', 'expired');
          ipc.remind(reminder);
        }
      }
    });
    openTab(openedTab);
  }, interval);
}

/* Initialize view */
function init() {
  ipc.fetch();
  checkRoutine();
}
init();
