Components.utils.import('chrome://greasemonkey-modules/content/util.js');

var EXPORTED_SYMBOLS = ['getUriFromUrl'];

var ioService = Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);

function getUriFromUrl(url, base) {
  var baseUri = null;
  if (typeof base === "string") {
    baseUri = GM_util.getUriFromUrl(base);
  } else if (base) {
    baseUri = base;
  }

  try {
    return ioService.newURI(url, null, baseUri);
  } catch (e) {
    return null;
  }
}
getUriFromUrl = GM_util.memoize(getUriFromUrl);
