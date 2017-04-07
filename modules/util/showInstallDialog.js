const EXPORTED_SYMBOLS = ["showInstallDialog"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;
var Cr = Components.results;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/remoteScript.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function showInstallDialog(aUrlOrRemoteScript, aBrowser, aRequest) {
  var rs = null;
  if (typeof aUrlOrRemoteScript == "string") {
    rs = new RemoteScript(aUrlOrRemoteScript);
  } else {
    rs = aUrlOrRemoteScript;
  }

  var browser = aBrowser || GM_util.getBrowserWindow().gBrowser;
  var params = null;
  function openDialog(aScript) {
    params = [rs, browser, aScript];
    params.wrappedJSObject = params;
    // Don't set "modal" param, or this blocks.
    // Even though we'd prefer the sort of behavior that gives us.
    Cc["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Ci.nsIWindowWatcher)
        .openWindow(
            /* aParent */ null,
            "chrome://greasemonkey/content/install.xul",
            /* aName */ null,
            "chrome,centerscreen,dialog,titlebar,resizable",
            params);
  }

  if (rs.script) {
    openDialog(rs.script);
  } else {
    rs.onScriptMeta(function (aRemoteScript, aType, aScript) {
      openDialog(aScript);
    });
  }

  rs.download(function (aSuccess, aType, aStatus) {
    if (aRequest && (aType == "script")) {
      let _cancel = false;
      if (aSuccess && !GM_CONSTANTS.installScriptBadStatus.includes(aStatus)) {
        aRequest.cancel(Cr.NS_BINDING_ABORTED);
        _cancel = true;
      } else if (GM_CONSTANTS.installScriptBadStatus.includes(aStatus)) {
        aRequest.cancel(Cr.NS_BINDING_FAILED);
        _cancel = true;
      } else {
        aRequest.resume();
      }
      if (_cancel) {
        // See #1717.
        try {
          browser = aRequest
              .QueryInterface(Ci.nsIHttpChannel)
              .notificationCallbacks.getInterface(Ci.nsILoadContext)
              .topFrameElement;
          browser.webNavigation.stop(Ci.nsIWebNavigation.STOP_ALL);
        } catch (e) {
          // Ignore.
          /*
          dump("URL: " + aRequest.URI.spec + "\n"
              + "aRequest.isPending(): " + aRequest.isPending().toString()
              + "\n" + "e:" + "\n" + e);
          */
        }
      }
    }
  });
}
