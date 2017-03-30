const EXPORTED_SYMBOLS = ["getUriFromUrl"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/util.js");


function getUriFromUrl(url, base) {
  let baseUri = null;
  if (typeof base === "string") {
    baseUri = GM_util.getUriFromUrl(base);
  } else if (base) {
    baseUri = base;
  }

  try {
    return GM_CONSTANTS.ioService.newURI(url, null, baseUri);
  } catch (e) {
    return null;
  }
}
getUriFromUrl = GM_util.memoize(getUriFromUrl);
