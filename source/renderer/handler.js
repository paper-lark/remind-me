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
