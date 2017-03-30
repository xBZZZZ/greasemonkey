var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/util.js");

var GM_MenuCommander = {
  "cookieShowing": null,
  "menuCommands": {},
  "messageCookie": 1,
  "popup": null,
};

GM_MenuCommander.initialize = function () {
  Services.ppmm.addMessageListener("greasemonkey:menu-command-response",
      GM_MenuCommander.messageMenuCommandResponse);
};

GM_MenuCommander.uninitialize = function () {
  Services.ppmm.removeMessageListener("greasemonkey:menu-command-response",
      GM_MenuCommander.messageMenuCommandResponse);
};

GM_MenuCommander.commandClicked = function (aCommand) {
  gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
      "greasemonkey:menu-command-run", {
        "cookie": aCommand.cookie,
        "scriptUuid": aCommand.scriptUuid,
      });
};

GM_MenuCommander.createMenuItem = function (command) {
  let menuItem = document.createElement("menuitem");
  menuItem.setAttribute("label", command.name);
  menuItem.setAttribute("tooltiptext", command.scriptName);
  menuItem.addEventListener("command", function () {
    GM_MenuCommander.commandClicked(command);
  }, false);

  if (command.accesskey) {
    menuItem.setAttribute("accesskey", command.accesskey);
  }

  return menuItem;
};

GM_MenuCommander.messageMenuCommandResponse = function (aMessage) {
  if (aMessage.data.cookie != GM_MenuCommander.cookieShowing) {
    return undefined;
  }

  for (let i in aMessage.data.commands) {
    let command = aMessage.data.commands[i];
    let menuItem = GM_MenuCommander.createMenuItem(command);
    GM_MenuCommander.popup.appendChild(menuItem);
  }
  if (GM_MenuCommander.popup.firstChild) {
    GM_MenuCommander.popup.parentNode.disabled = false;
  }
};

GM_MenuCommander.onPopupHiding = function () {
  // See #1632.
  // Asynchronously.
  GM_util.timeout(function () {
    GM_util.emptyEl(GM_MenuCommander.popup);
  }, 0);
};

GM_MenuCommander.onPopupShowing = function (aEventTarget) {
  GM_MenuCommander.popup = aEventTarget.querySelector(
      "menupopup.greasemonkey-user-script-commands-popup");

  GM_MenuCommander.messageCookie++;
  GM_MenuCommander.cookieShowing = GM_MenuCommander.messageCookie;

  // Start disabled and empty...
  GM_MenuCommander.popup.parentNode.disabled = true;
  GM_util.emptyEl(GM_MenuCommander.popup);
  // ...ask the selected browser to fill up our menu.
  gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
      "greasemonkey:menu-command-list", {
        "cookie": GM_MenuCommander.cookieShowing,
      });
};
