const EXPORTED_SYMBOLS = ["getChannelFromUri"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("resource://gre/modules/Services.jsm");


function getChannelFromUri(aUri) {
  if (GM_CONSTANTS.ioService.newChannelFromURI2) {
    return GM_CONSTANTS.ioService.newChannelFromURI2(
        aUri, null, Services.scriptSecurityManager.getSystemPrincipal(),
        null, Ci.nsILoadInfo.SEC_NORMAL, Ci.nsIContentPolicy.TYPE_OTHER);
  } else {
    return GM_CONSTANTS.ioService.newChannelFromURI(aUri);
  }
}
