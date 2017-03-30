const EXPORTED_SYMBOLS = ["windowIsClosed"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/util.js");


/*
Accessing windows that are closed can be dangerous
after http://bugzil.la/695480.
This routine takes care of being careful to not trigger any of those broken
edge cases.
*/
function windowIsClosed(aWin) {
  try {
    // If isDeadWrapper (Firefox 15+ only) tells us the window is dead.
    if (Cu.isDeadWrapper && Cu.isDeadWrapper(aWin)) {
      return true;
    }

    // If we can access the .closed property and it is true, or there is any
    // problem accessing that property.
    try {
      if (aWin.closed) {
        return true;
      }
    } catch (e) {
      return true;
    }
  } catch (e) {
    GM_util.logError(
        "Greasemonkey - windowIsClosed:" + "\n" + e, false,
        e.fileName, e.lineNumber);
    // Failsafe.
    // In case of any failure, destroy the command to avoid leaks.
    return true;
  }
  return false;
}
