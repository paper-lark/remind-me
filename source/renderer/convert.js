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
