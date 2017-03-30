const EXPORTED_SYMBOLS = ["windowIsPrivate"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");


function windowIsPrivate(aContentWin) {
  // i.e. the Private Browsing autoStart pref:
  // "browser.privatebrowsing.autostart"
  return PrivateBrowsingUtils.isContentWindowPrivate(aContentWin);
}
