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
