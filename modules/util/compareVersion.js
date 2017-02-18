var EXPORTED_SYMBOLS = ['compareVersion'];

function compareVersion(aTarget) {
  var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
      .getService(Components.interfaces.nsIXULAppInfo);
  var versionChecker = Components
      .classes["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Components.interfaces.nsIVersionComparator);

  return versionChecker.compare(appInfo.version, aTarget);
}
