const EXPORTED_SYMBOLS = ["getEnabled"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");


function getEnabled() {
  return GM_prefRoot.getValue("enabled", true);
}
