const EXPORTED_SYMBOLS = ["setEnabled"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");


function setEnabled(enabled) {
  GM_prefRoot.setValue("enabled", enabled);
}
