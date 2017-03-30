const EXPORTED_SYMBOLS = ["compareVersion"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


function compareVersion(aTarget) {
  let versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Ci.nsIVersionComparator);

  return versionChecker.compare(GM_CONSTANTS.xulAppInfo.version, aTarget);
}
