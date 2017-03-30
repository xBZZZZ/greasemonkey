const EXPORTED_SYMBOLS = ["isGreasemonkeyable"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");


function isGreasemonkeyable(url) {
  let scheme = GM_CONSTANTS.ioService.extractScheme(url);

  switch (scheme) {
    case "about":
      // Always allow "about:blank" and "about:reader".
      if (new RegExp(GM_CONSTANTS.urlAboutAllRegexp, "").test(url)) {
        return true;
      }
      // See #1375.
      // Never allow the rest of "about:".
      return false;
    case "data":
      return GM_prefRoot.getValue("dataIsGreaseable");
    case "file":
      return GM_prefRoot.getValue("fileIsGreaseable");
    case "ftp":
    case "http":
    case "https":
      return true;
    case "jar":
      return GM_prefRoot.getValue("jarIsGreaseable");
    case "unmht":
      return GM_prefRoot.getValue("unmhtIsGreaseable");
  }

  return false;
}
