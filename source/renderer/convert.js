/* eslint no-unused-vars: off */

/*
 * Converter module.
 * Converts DOM reminders into text and text to entries.
 */

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
    result += ` - ${month}/${day}/${year} ${hour}:${minute}`;
  }

  return result;
}

function trim(str) {
  let exp = /^\s*(\S.*\S)\s*$/g;
  let result = exp.exec(str);
  if (result == undefined || result.length === 1) {
    return '';
  } else {
    return result[1];
  }
}

function toEntry(text) {
  let lines = text
    .split('\n')
    .map(line => trim(line))
    .filter(line => line !== '');
  let main = lines[0];
  let subs = lines.slice(1, lines.length - 1);
  let footer = lines[lines.length - 1];

  let entry = {
    task: trim(main.slice(2)),
    completed: main[0] === '+',
    subtasks: [],
    color: '#0091EA'
  };
  if (entry.task.length === 0) {
    throw new Error('No description for a task was specified');
  }

  let split = footer.split('-');
  entry.tag = trim(split[0]);
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
    let item = {
      content: trim(line.slice(2)),
      completed: line[0] === '+'
    };
    if (item.content.length === 0) {
      throw new Error('No description for a subtask was specified');
    }
    entry.subtasks.push(item);
  });

  return entry;
}

const convert = {
  toText: toText,
  toEntry: toEntry
};
