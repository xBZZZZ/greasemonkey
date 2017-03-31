"use strict";

const EXPORTED_SYMBOLS = [];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


var SCHEMES_DISALLOWED = {
  "chrome": 1,
  "view-source": 1,
};
SCHEMES_DISALLOWED[GM_CONSTANTS.addonScriptProtocolScheme] = 1;
Object.freeze(SCHEMES_DISALLOWED);

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function checkScriptRefresh(channel) {
  // .loadInfo is part of nsiChannel -> implicit QI needed.
  if (!(channel instanceof Ci.nsIChannel)) {
    return undefined;
  }
  if (!channel.loadInfo) {
    return undefined;
  }

  // http://bugzil.la/1182571
  let type = channel.loadInfo.externalContentPolicyType
      ? channel.loadInfo.externalContentPolicyType
      : channel.loadInfo.contentPolicyType;

  // Only check for updated scripts when tabs/frames/iframes are loaded.
  // Firefox 44+
  // http://bugzil.la/1148044
  if ((type != Ci.nsIContentPolicy.TYPE_DOCUMENT)
      && (type != Ci.nsIContentPolicy.TYPE_SUBDOCUMENT)
      && (!Ci.nsIContentPolicy.TYPE_INTERNAL_FRAME
        || (Ci.nsIContentPolicy.TYPE_INTERNAL_FRAME
            && (type != Ci.nsIContentPolicy.TYPE_INTERNAL_FRAME)))
      && (!Ci.nsIContentPolicy.TYPE_INTERNAL_IFRAME
        || (Ci.nsIContentPolicy.TYPE_INTERNAL_IFRAME
            && (type != Ci.nsIContentPolicy.TYPE_INTERNAL_IFRAME)))) {
    return undefined;
  }

  // Forward compatibility: http://bugzil.la/1124477
  let browser = channel.loadInfo.topFrameElement;

  if (!browser && channel.notificationCallbacks) {
    // Current API: http://bugzil.la/1123008#c7
    let loadCtx = channel.notificationCallbacks.QueryInterface(
        Ci.nsIInterfaceRequestor).getInterface(Ci.nsILoadContext);
    browser = loadCtx.topFrameElement;
  }

  let windowId = channel.loadInfo.innerWindowID;

  GM_util.getService().scriptRefresh(channel.URI.spec, windowId, browser);
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function installObserver(aSubject, aTopic, aData) {
  // When observing a new request, inspect it to determine
  // if it should be a user script install.
  // If so, abort and restart as an install rather than a navigation.
  if (!GM_util.getEnabled()) {
    return undefined;
  }

  let channel = aSubject.QueryInterface(Ci.nsIChannel);
  if (!channel || !channel.loadInfo) {
    return undefined;
  }

  // http://bugzil.la/1182571
  let type = channel.loadInfo.externalContentPolicyType
      || channel.loadInfo.contentPolicyType;
  if (type != Ci.nsIContentPolicy.TYPE_DOCUMENT) {
    return undefined;
  }

  if (channel.URI.scheme in SCHEMES_DISALLOWED) {
    return undefined;
  }

  let httpChannel;
  try {
    httpChannel = channel.QueryInterface(Ci.nsIHttpChannel);
    if (httpChannel.requestMethod == "POST") {
      return undefined;
    }
  } catch (e) {
    // Ignore completely, e.g. file:// URIs.
  }

  if (!channel.URI.spec.match(
      new RegExp(GM_CONSTANTS.fileScriptExtensionRegexp + "$", ""))) {
    return undefined;
  }

  // We've done an early return above for all non-user-script navigations.
  // If execution has proceeded to this point, we want to cancel
  // the existing request (i.e. navigation) and instead start
  // a script installation for this same URI.
  let request;
  try {
    request = channel.QueryInterface(Ci.nsIRequest);
    // See #1717.
    if (request.isPending()) {
      request.suspend();
    }

    let browser = channel
        .QueryInterface(Ci.nsIHttpChannel)
        .notificationCallbacks
        .getInterface(Ci.nsILoadContext)
        .topFrameElement;

    GM_util.showInstallDialog(channel.URI.spec, browser, request);
  } catch (e) {
    dump("Greasemonkey could not do script install:" + "\n" + e + "\n");
    // Ignore.
    return undefined;
  }
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

Services.obs.addObserver({
  "observe": function (aSubject, aTopic, aData) {
    try {
      installObserver(aSubject, aTopic, aData);
    } catch (e) {
      dump("Greasemonkey install observer failed:" + "\n" + e + "\n");
    }
    try {
      checkScriptRefresh(aSubject);
    } catch (e) {
      dump("Greasemonkey refresh observer failed:" + "\n" + e + "\n");
    }
  },
}, "http-on-modify-request", false);
