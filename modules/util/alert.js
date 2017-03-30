const EXPORTED_SYMBOLS = ["alert"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/util.js");


// Because alert is not defined in component/module scope.
function alert(msg) {
  Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Ci.nsIPromptService)
      .alert(null, "Greasemonkey alert", msg);
}
