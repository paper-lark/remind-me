# API Documentation

## Main window renderer process

`EventHanderFactory()` - Creates an object containing event handlers.

- `tabClick` (**TODO**) - Tab click handler. Changes the opened tab.
- `filterInput` - Filter input handler. Should be placed on the input field. Filters notes using `data-tag` property. The criteria is presence of the keyword as a prefix of the tag. Several tags can be presented and should be divided by space.
- `createReminder` (**TODO**) - Floating action button click handler. Creates a new reminder.


## Main process

`initIPC()` - Initializes IPC channels on the main process' end.

### File system agent (fs-agent.js)

Module creates an object containing methods for file system interactions.

- `fetch` - Function reads the list from the drive. If the file was not found, a sample list is created and saved on the drive. The callback is called with the resulting list.
- `save` - Function saves the list passed as an argument and calls the callback on successful completion.

### Window Manager (windows.js)

Module manages windows.

- `main` - Handle for the main window. Equal to `undefined` when main window is closed.
- `createMainWindow` - Function creates a main window. The window has inset control buttons and shows up only when the contents is loaded.
- `createMenuBar` (**TODO**) - Creates the menu bar of the application.
