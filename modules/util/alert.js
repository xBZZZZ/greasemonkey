const EXPORTED_SYMBOLS = ["alert"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/util.js");


// Because alert is not defined in component/module scope.
function alert(aMsg) {
  Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Ci.nsIPromptService)
      .alert(null, "Greasemonkey alert", aMsg);
}
