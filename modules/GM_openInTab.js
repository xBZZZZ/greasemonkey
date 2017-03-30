const EXPORTED_SYMBOLS = ["GM_openInTab"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


function GM_openInTab(aFrame, aBaseUrl, aUrl, aOptions) {
  let loadInBackground = null;
  if (typeof aOptions != "undefined") {
    if (typeof aOptions.active == "undefined") {
      if (typeof aOptions != "object") {
        loadInBackground = !!aOptions;
      }
    } else {
      loadInBackground = !aOptions.active;
    }
  }

  let insertRelatedAfterCurrent = null;
  if (typeof aOptions != "undefined") {
    if (typeof aOptions.insert != "undefined") {
      insertRelatedAfterCurrent = !!aOptions.insert;
    }
  }

  // Resolve URL relative to the location of the content window.
  let baseUri = GM_CONSTANTS.ioService.newURI(aBaseUrl, null, null);
  let uri = GM_CONSTANTS.ioService.newURI(aUrl, null, baseUri);

  aFrame.sendAsyncMessage("greasemonkey:open-in-tab", {
    "afterCurrent": insertRelatedAfterCurrent,
    "inBackground": loadInBackground,
    "url": uri.spec,
  });
};
