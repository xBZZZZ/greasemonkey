const EXPORTED_SYMBOLS = ["logError"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}


function logError(e, warning, fileName, lineNumber) {
  if (typeof e == "string") {
    e = new Error(e);
  }

  let consoleError = Cc["@mozilla.org/scripterror;1"]
      .createInstance(Ci.nsIScriptError);
  // Third parameter "sourceLine" is supposed to be the line, of the source,
  // on which the error happened.
  // We don't know it. (Directly...)
  consoleError.init(
      e.message, fileName, null, lineNumber, e.columnNumber,
      (warning ? 1 : 0), null);

  Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService)
      .logMessage(consoleError);
}
