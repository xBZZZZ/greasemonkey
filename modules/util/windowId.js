const EXPORTED_SYMBOLS = ["windowId"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/util.js");


function windowId(win, which) {
  try {
    // Do not operate on chrome windows.
    win.QueryInterface(Ci.nsIDOMChromeWindow);
    return null;
  } catch (e) {
    // We want this to fail.
    // Catch is no-op.
  }

  let href = null;
  try {
    // Dunno why this is necessary, but sometimes we get non-chrome windows
    // whose locations we cannot access.
    href = win.location.href;
    if (!GM_util.isGreasemonkeyable(href)) {
      return null;
    }
  } catch (e) {
    return null;
  }

  let domWindowUtils = win
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindowUtils);
  let windowId;
  try {
    if (which == "outer") {
      windowId = domWindowUtils.outerWindowID;
    } else if (!which || (which == "inner")) {
      windowId = domWindowUtils.currentInnerWindowID;
    }
  } catch (e) {
    // Ignore.
  }

  if (typeof windowId == "undefined") {
    // Firefox <4.0 does not provide this, use the document instead.
    // https://developer.mozilla.org/en/Inner_and_outer_windows
    // (Document is a property of the window, and should let us dig
    // into the "inner window" rather than always getting
    // the same "outer window", due to bfcache.)
    GM_util.logError("Greasemonkey - windowId (" + which + ") = undefined");
    return win.document;
  }

  return windowId;
}
