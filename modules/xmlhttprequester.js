const EXPORTED_SYMBOLS = ["GM_xmlhttpRequester"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.importGlobalProperties(["Blob"]);
Cu.importGlobalProperties(["XMLHttpRequest"]);

Cu.import("chrome://greasemonkey-modules/content/util.js");


function GM_xmlhttpRequester(aWrappedContentWin, aSandbox, aFileURL, aOriginUrl) {
  this.fileURL = aFileURL;
  this.originUrl = aOriginUrl;
  this.sandbox = aSandbox;
  this.sandboxPrincipal = Cu.getObjectPrincipal(aSandbox);
  this.wrappedContentWin = aWrappedContentWin;
}

// This function gets called by user scripts in content security scope
// to start a cross-domain xmlhttp request.
GM_xmlhttpRequester.prototype.contentStartRequest = function (details) {
  if (!details) {
    throw new this.wrappedContentWin.Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.xhrNoDetails"),
        this.fileURL, null);
  }

  var uri = null;
  var url = null;

  try {
    // Validate and parse the (possibly relative) given URL.
    uri = GM_util.getUriFromUrl(details.url, this.originUrl);
    url = uri.spec;
  } catch (e) {
    // A malformed URL won't be parsed properly.
    throw new this.wrappedContentWin.Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.invalidUrl")
            .replace("%1", details.url),
        this.fileURL, null);
  }

  // This is important - without it, GM_xmlhttpRequest can be used to get
  // access to things like files and chrome. Careful.
  switch (uri.scheme) {
    case "ftp":
    case "http":
    case "https":
      var req = new XMLHttpRequest(
          // Firefox 41+
          // http://bugzil.la/1163898
          (details.mozAnon || details.anonymous)
          ? {
            "mozAnon": true,
          }
          : {});
      GM_util.hitch(this, "chromeStartRequest", url, details, req)();
      break;
    default:
      throw new this.wrappedContentWin.Error(
          GM_CONSTANTS.localeStringBundle.createBundle(
              GM_CONSTANTS.localeGreasemonkeyProperties)
              .GetStringFromName("error.disallowedScheme")
              .replace("%1", details.url),
          this.fileURL, null);
  }

  var rv = {
    "abort": function () {
      return req.abort();
    },
    "finalUrl": null,
    "readyState": null,
    "responseHeaders": null,
    "responseText": null,
    "status": null,
    "statusText": null,
  };

  if (!!details.synchronous) {
    rv.finalUrl = req.finalUrl;
    rv.readyState = req.readyState;
    rv.responseHeaders = req.getAllResponseHeaders();
    try {
      rv.responseText = req.responseText;
    } catch (e) {
      // Some response types don't have .responseText
      // (but do have e.g. blob .response).
      // Ignore.
    }
    rv.status = req.status;
    rv.statusText = req.statusText;
  }

  rv = Cu.cloneInto({
    "abort": rv.abort.bind(rv),
    "finalUrl": rv.finalUrl,
    "readyState": rv.readyState,
    "responseHeaders": rv.responseHeaders,
    "responseText": rv.responseText,
    "status": rv.status,
    "statusText": rv.statusText,
  }, this.sandbox, {
    "cloneFunctions": true,
  });

  return rv;
};

// This function is intended to be called in chrome's security context,
// so that it can access other domains without security warning.
GM_xmlhttpRequester.prototype.chromeStartRequest =
function (safeUrl, details, req) {
  let setupRequestEvent = GM_util.hitch(
      this, "setupRequestEvent", this.wrappedContentWin, this.sandbox,
      this.fileURL);

  setupRequestEvent(req, "abort", details);
  setupRequestEvent(req, "error", details);
  setupRequestEvent(req, "load", details);
  setupRequestEvent(req, "loadend", details);
  setupRequestEvent(req, "loadstart", details);
  setupRequestEvent(req, "progress", details);
  setupRequestEvent(req, "readystatechange", details);
  setupRequestEvent(req, "timeout", details);
  if (details.upload) {
    setupRequestEvent(req.upload, "abort", details.upload);
    setupRequestEvent(req.upload, "error", details.upload);
    setupRequestEvent(req.upload, "load", details.upload);
    setupRequestEvent(req.upload, "loadend", details.upload);
    setupRequestEvent(req.upload, "progress", details.upload);
    setupRequestEvent(req.upload, "timeout", details.upload);
  }

  req.mozBackgroundRequest = !!details.mozBackgroundRequest;

  // See #1945, #2008 - part 1/2.
  /*
  let safeUrlTmp = new this.wrappedContentWin.URL(safeUrl);
  var headersArr = new Array();
  var authorization = {
    "contrains": false,
    "method": "Basic",
    "password": "",
    "string": "Authorization",
    "user": "",
  };
  let authenticationComponent = Cc["@mozilla.org/network/http-auth-manager;1"]
      .getService(Ci.nsIHttpAuthManager);
  var authorizationRegexp =
      new RegExp("^\\s*" + authorization.method + "\\s*([^\\s]+)\\s*$", "i");
  var authorizationUserPasswordRegexp = new RegExp("^([^:]+):([^:]+)$", "");

  if (details.headers) {
    var headers = details.headers;

    for (var prop in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, prop)) {
        headersArr.push({
          "prop": prop,
          "value": headers[prop],
        });
        if (prop.toString().toLowerCase()
            == authorization.string.toLowerCase()) {
          let authorizationValue = headers[prop].match(authorizationRegexp);
          if (authorizationValue) {
            authorizationValue = atob(authorizationValue[1]);
            let authorizationUserPassword =
                authorizationValue.match(authorizationUserPasswordRegexp);
            if (authorizationUserPassword) {
              authorization.contrains = true;
              authorization.user = authorizationUserPassword[1];
              authorization.password = authorizationUserPassword[2];
            }
          }
        }
      }
    }
  }

  if ((authorization.user || authorization.password)
      || (details.user || details.password)) {
    authenticationComponent.setAuthIdentity(
        safeUrlTmp.protocol,
        safeUrlTmp.hostname,
        (safeUrlTmp.port || ""),
        ((authorization.contrains)
          ? authorization.method : ""),
        "",
        "",
        "",
        (authorization.user
          || details.user || ""),
        (authorization.password
          || details.password || ""));
  } else {
    let authorizationDomain = {};
    let authorizationUser = {};
    let authorizationPassword = {};
    try {
      authenticationComponent.getAuthIdentity(
          safeUrlTmp.protocol,
          safeUrlTmp.hostname,
          (safeUrlTmp.port || ""),
          "",
          "",
          "",
          authorizationDomain,
          authorizationUser,
          authorizationPassword);
      details.user = authorizationUser.value || "";
      details.password = authorizationPassword.value || "";
    } catch (e) {
      // Ignore.
    }
  }
  */

  // See #2423.
  // http://bugzil.la/1275746
  try {
    req.open(details.method, safeUrl,
        !details.synchronous, details.user || "", details.password || "");
  } catch (e) {
    throw new this.wrappedContentWin.Error(
        "GM_xmlhttpRequest(): " + details.url + "\n" + e, this.fileURL, null);
  }

  // Pale Moon 27.2.x-
  // https://github.com/MoonchildProductions/Pale-Moon/pull/968
  if ((details.mozAnon || details.anonymous) && !req.mozAnon) {
    req.channel.loadFlags |= Ci.nsIRequest.LOAD_ANONYMOUS;
  }

  let channel;

  // Private browsing.
  if (req.channel instanceof Ci.nsIPrivateBrowsingChannel) {
    if (GM_util.windowIsPrivate(this.wrappedContentWin)) {
      channel = req.channel.QueryInterface(Ci.nsIPrivateBrowsingChannel);
      channel.setPrivate(true);
    }
  }
  /*
  dump("GM_xmlhttpRequest - url:" + "\n" + safeUrl + "\n"
      + "Private browsing mode: " + req.channel.isChannelPrivate + "\n");
  */

  try {
    channel = req.channel.QueryInterface(Ci.nsIHttpChannelInternal);
    channel.forceAllowThirdPartyCookie = true;
  } catch (e) {
    // Ignore.  e.g. ftp://
  }

  if (details.overrideMimeType) {
    req.overrideMimeType(details.overrideMimeType);
  }
  if (details.responseType) {
    req.responseType = details.responseType;
  }

  if (details.timeout) {
    req.timeout = details.timeout;
  }

  let httpChannel;
  // Not use: details.redirectionLimit
  // (may have the value: 0 or 1 - a "boolean")
  if ("redirectionLimit" in details) {
    try {
      httpChannel = req.channel.QueryInterface(Ci.nsIHttpChannel);
      httpChannel.redirectionLimit = details.redirectionLimit;
    } catch (e) {
      // Ignore.
    }
  }

  // See #1945, #2008 - part 2/2.
  /*
  for (let i = 0, iLen = headersArr.length; i < iLen; i++) {
    req.setRequestHeader(headersArr[i].prop, headersArr[i].value);
  }
  */
  if (details.headers) {
    let headers = details.headers;

    for (let prop in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, prop)) {
        req.setRequestHeader(prop, headers[prop]);
      }
    }
  }

  let body = details.data ? details.data : null;
  // See #2423.
  // http://bugzil.la/918751
  try {
    if (details.binary && (body !== null)) {
      let bodyLength = body.length;
      let bodyData = new Uint8Array(bodyLength);
      for (let i = 0; i < bodyLength; i++) {
        bodyData[i] = body.charCodeAt(i) & 0xff;
      }
      req.send(new Blob([bodyData]));
    } else {
      req.send(body);
    }
  } catch (e) {
    throw new this.wrappedContentWin.Error(
        "GM_xmlhttpRequest(): " + details.url + "\n" + e, this.fileURL, null);
  }
};

// Arranges for the specified "event" on xmlhttprequest "req" to call
// the method by the same name which is a property of "details"
// in the content window's security context.
GM_xmlhttpRequester.prototype.setupRequestEvent = function (
    wrappedContentWin, sandbox, fileURL, req, event, details) {
  // Waive Xrays so that we can read callback function properties...
  details = Cu.waiveXrays(details);
  var eventCallback = details["on" + event];
  if (!eventCallback) {
    return undefined;
  }

  // ...but ensure that the callback came from a script, not content,
  // by checking that its principal equals that of the sandbox.
  let callbackPrincipal = Cu.getObjectPrincipal(eventCallback);
  if (!this.sandboxPrincipal.equals(callbackPrincipal)) {
    return undefined;
  }

  req.addEventListener(event, function (evt) {
    var responseState = {
      "context": details.context || null,
      "finalUrl": null,
      "lengthComputable": null,
      "loaded": null,
      "readyState": req.readyState,
      "response": req.response,
      "responseHeaders": null,
      "responseText": null,
      "responseXML": null,
      "status": null,
      "statusText": null,
      "total": null,
    };

    try {
      responseState.responseText = req.responseText;
    } catch (e) {
      // Some response types don't have .responseText
      // (but do have e.g. blob .response).
      // Ignore.
    }

    var responseXML = null;
    try {
      responseXML = req.responseXML;
    } catch (e) {
      // At least in responseType blob case, this access fails.
      // Ignore.
    }
    if (responseXML) {
      // Clone the XML object into a content-window-scoped document.
      let xmlDoc;
      try {
        xmlDoc = new wrappedContentWin.Document();
      } catch (e) {
        try {
          req.abort();
        } catch (e) {
          GM_util.logError(
              "GM_xmlhttpRequester.setupRequestEvent - url:"
              + "\n" + '"' + details.url + '":' + "\n" + e, true,
              fileURL, null);
        }
        return undefined;
      }
      let clone = xmlDoc.importNode(responseXML.documentElement, true);
      xmlDoc.appendChild(clone);
      responseState.responseXML = xmlDoc;
    }

    switch (event) {
      case "progress":
        responseState.lengthComputable = evt.lengthComputable;
        responseState.loaded = evt.loaded;
        responseState.total = evt.total;
        break;
      case "error":
        break;
      default:
        if (2 > req.readyState) {
          break;
        }
        responseState.finalUrl = req.channel.URI.spec;
        responseState.responseHeaders = req.getAllResponseHeaders();
        responseState.status = req.status;
        responseState.statusText = req.statusText;
        break;
    }

    responseState = Cu.cloneInto({
      "context": responseState.context,
      "finalUrl": responseState.finalUrl,
      "lengthComputable": responseState.lengthComputable,
      "loaded": responseState.loaded,
      "readyState": responseState.readyState,
      "response": responseState.response,
      "responseHeaders": responseState.responseHeaders,
      "responseText": responseState.responseText,
      "responseXML": responseState.responseXML,
      "status": responseState.status,
      "statusText": responseState.statusText,
      "total": responseState.total,
    }, sandbox, {
      "cloneFunctions": true,
      "wrapReflectors": true,
    });

    if (GM_util.windowIsClosed(wrappedContentWin)) {
      try {
        req.abort();
      } catch (e) {
        GM_util.logError(
            "GM_xmlhttpRequester.setupRequestEvent - url:"
            + "\n" + '"' + details.url + '":' + "\n" + e, true,
            fileURL, null);
      }
      return undefined;
    }

    // Pop back onto browser thread and call event handler.
    // Have to use nested function here instead of GM_util.hitch
    // because otherwise details[event].apply can point to window.setTimeout,
    // which can be abused to get increased privileges.
    new XPCNativeWrapper(wrappedContentWin, "setTimeout()")
      .setTimeout(function () {
        eventCallback.call(details, responseState);
      }, 0);
  }, false);
};
