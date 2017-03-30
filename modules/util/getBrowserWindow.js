const EXPORTED_SYMBOLS = ["getBrowserWindow"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;


function getBrowserWindow() {
  return Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("navigator:browser");
}
