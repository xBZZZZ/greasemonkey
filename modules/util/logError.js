const EXPORTED_SYMBOLS = ["logError"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;


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
