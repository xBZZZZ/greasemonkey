const EXPORTED_SYMBOLS = ["newUserScript"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/util.js");


function newUserScript(aWin) {
  Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher)
      .openWindow(
          aWin,
          "chrome://greasemonkey/content/newscript.xul", null,
          "chrome,dependent,centerscreen,resizable,dialog", null);
}
