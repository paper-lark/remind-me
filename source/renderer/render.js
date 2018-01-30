/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Render module.
 * Render DOM reminders from entries.
 */

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

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
