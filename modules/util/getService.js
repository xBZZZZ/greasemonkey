const EXPORTED_SYMBOLS = ["getService"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


function getService() {
  return Cc[GM_CONSTANTS.addonServiceContractID].getService().wrappedJSObject;
}
