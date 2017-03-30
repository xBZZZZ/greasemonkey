const EXPORTED_SYMBOLS = ["windowIdForEvent"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/util.js");


function windowIdForEvent(aEvent) {
  let doc = aEvent.originalTarget;
  try {
    doc.QueryInterface(Ci.nsIDOMHTMLDocument);
  } catch (e) {
    return null;
  }

  return GM_util.windowId(doc.defaultView);
}
