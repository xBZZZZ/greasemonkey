// Based on Scriptish:
// https://github.com/scriptish/scriptish/blob/master/extension/modules/api/GM_setClipboard.js

const EXPORTED_SYMBOLS = ["GM_setClipboard"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/constants.js");


const FLAVOR = {
  "html": "text/html",
  "text": "text/unicode",
};

function GM_setClipboard(aData, aType) {
  let clipboardHelperService = Cc["@mozilla.org/widget/clipboardhelper;1"]
      .getService(Ci.nsIClipboardHelper);
  let clipboardService = Cc["@mozilla.org/widget/clipboard;1"]
      .getService(Ci.nsIClipboard);
  let supportString = Cc["@mozilla.org/supports-string;1"]
      .createInstance(Ci.nsISupportsString);
  let trans = Cc["@mozilla.org/widget/transferable;1"]
      .createInstance(Ci.nsITransferable);

  aType = (aType || "text").toLowerCase();

  switch (aType) {
    case "html":
      // Add text/html flavor.
      let strVal = supportString;
      strVal.data = aData;
      trans.addDataFlavor(FLAVOR.html);
      trans.setTransferData(FLAVOR.html, strVal, (aData.length * 2));

      // Add a text/unicode flavor (html converted to plain text).
      strVal = supportString;
      let converter = Cc["@mozilla.org/feed-textconstruct;1"]
          .createInstance(Ci.nsIFeedTextConstruct);
      converter.type = aType;
      converter.text = aData;
      strVal.data = converter.plainText();
      trans.addDataFlavor(FLAVOR.text);
      trans.setTransferData(FLAVOR.text, strVal, (strVal.data.length * 2));

      clipboardService.setData(trans, null, clipboardService.kGlobalClipboard);
      break;
    case "text":
      clipboardHelperService.copyString(aData);
      break;
    default:
      throw new Error(
          GM_CONSTANTS.localeStringBundle.createBundle(
              GM_CONSTANTS.localeGreasemonkeyProperties)
              .GetStringFromName("setClipboard.unsupportedType")
              .replace("%1", aType));
  }
}
