const EXPORTED_SYMBOLS = ["compareVersion"];

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


function compareVersion(aTarget) {
  let versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Ci.nsIVersionComparator);

  return versionChecker.compare(GM_CONSTANTS.xulAppInfo.version, aTarget);
}
