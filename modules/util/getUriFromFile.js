const EXPORTED_SYMBOLS = ["getUriFromFile"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


function getUriFromFile(file) {
  return GM_CONSTANTS.ioService.newFileURI(file);
}
