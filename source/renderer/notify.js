/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Module handles notifications.
 */

let element = document.querySelector('.notification');

function notify(notification) {
  element.className = `notification ${notification.type}`;
  element.innerHTML = notification.message;
  element.style.transform = 'translateY(0%)';
  window.setTimeout(() => {
    element.style.transform = '';
  }, 2000);
}
