/* eslint no-unused-vars: off */
/* eslint no-undef: off */

/*
 * Module is responsibe for rendering custom controls on Windows.
 */

function createCustomControls() {
  console.log(`> platform: ${process.platform}`);
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
