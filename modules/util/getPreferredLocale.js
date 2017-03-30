const EXPORTED_SYMBOLS = ["getPreferredLocale"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/util.js");


var preferredLocale = (function () {
  let matchOS = Services.prefs.getBoolPref("intl.locale.matchOS");

  if (matchOS) {
    try {
      return Services.locale.getLocaleComponentForUserAgent();
    } catch (e) {
      // Firefox 54+
      // http://bugzil.la/1337551
      // http://bugzil.la/1344901
      return Cc["@mozilla.org/intl/ospreferences;1"]
          .getService(Ci.mozIOSPreferences)
          .systemLocale;
    }
  }

  return Services.prefs.getCharPref("general.useragent.locale") || "en-US";
})();

function getPreferredLocale() {
  return preferredLocale;
}
