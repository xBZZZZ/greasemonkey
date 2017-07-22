const EXPORTED_SYMBOLS = ["GM_notificationer"];

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

Cu.import("chrome://greasemonkey-modules/content/util.js");


function GM_notificationer(
    aChromeWin, aWrappedContentWin, aSandbox, aFileURL, aScriptName) {
  this.chromeWin = aChromeWin;  
  this.fileURL = aFileURL;
  this.sandbox = aSandbox;
  this.sandboxPrincipal = Cu.getObjectPrincipal(aSandbox);
  this.scriptName = aScriptName;
  this.setupEvent = GM_util.hitch(
      this, "setupEvent", aWrappedContentWin, aSandbox,
      aFileURL);
  this.wrappedContentWin = aWrappedContentWin;
}

// This function gets called by user scripts in content security scope.
GM_notificationer.prototype.contentStart = function (
    aDetailsOrText, aOnDoneOrTitle, aImage, aOnClick) {
  let _functionEmpty = function () {};

  var details = {
    "highlight": true,
    "highlightOnly": false,
    "image": "chrome://greasemonkey/skin/icon32.png",
    "message": "",
    "onclick": _functionEmpty,
    "ondone": _functionEmpty,
    "timeout": 0,
    "timeoutWasReached": false,
    "title": this.scriptName,
  };

  var _details = {};

  if (aDetailsOrText) {
    if (typeof aDetailsOrText == "object") {
      // Part 1a:
      // Waive Xrays so that we can read callback function properties...
      // aDetailsOrText = Cu.waiveXrays(aDetailsOrText);
      _details.highlight = aDetailsOrText.highlight;
      _details.image = aDetailsOrText.image;
      _details.message = aDetailsOrText.text;
      _details.onclick = Cu.waiveXrays(aDetailsOrText).onclick;
      _details.ondone = Cu.waiveXrays(aDetailsOrText).ondone;
      _details.timeout = aDetailsOrText.timeout;
      _details.title = aDetailsOrText.title;
    } else if (typeof aDetailsOrText == "string") {
      details.message = aDetailsOrText;
    }
  }

  if (typeof _details.highlight !== "undefined") {
    details.highlight = _details.highlight;
  }
  // i.e. a data scheme
  if (_details.image && (typeof _details.image == "string")) {
    details.image = _details.image;
  }
  if (_details.message && (typeof _details.message == "string")) {
    details.message = _details.message;
  }
  if (_details.onclick) {
    details.onclick = _details.onclick;
  }
  if (_details.ondone) {
    details.ondone = _details.ondone;
  }
  if (_details.timeout && Number.isInteger(_details.timeout)) {
    details.timeout = _details.timeout;
  }
  if (_details.title && (typeof _details.title == "string")) {
    details.title = _details.title;
  }

  if (aOnDoneOrTitle) {
    if (typeof aDetailsOrText == "object") {
      // Part 1b:
      // Waive Xrays so that we can read callback function properties...
      details.ondone = Cu.waiveXrays(aOnDoneOrTitle);
    } else if (typeof aOnDoneOrTitle == "string") {
      details.title = aOnDoneOrTitle;
    }
  }

  if (aImage) {
    // i.e. a data scheme
    if (typeof aImage == "string") {
      details.image = aImage;
    }
  }

  if (aOnClick) {
    details.onclick = aOnClick;
  }

  if ((details.message == "") && !details.highlight) {
    throw new this.wrappedContentWin.Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.notification.messageOrHighlight")
            .replace("%1", details.title),
        this.fileURL, null);
  }

  var notification = {
    "details": details,
    "onClick": details.onclick,
    "onDone": details.ondone,
  };

  if (typeof notification.onClick !== "function") {
    throw new this.wrappedContentWin.Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.notification.callbackIsNotFunction")
            .replace("%1", notification.details.title)
            .replace("%2", "onclick"),
        this.fileURL, null);
  }
  if (typeof notification.onDone !== "function") {
    throw new this.wrappedContentWin.Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.notification.callbackIsNotFunction")
            .replace("%1", notification.details.title)
            .replace("%2", "ondone"),
        this.fileURL, null);
  }

  var options = {
    "body": details.message,
    "icon": details.image,
    "requireInteraction": true,
  }

  // Hightlight tab does not work.
  /*
  if (details.highlight) {
    this.wrappedContentWin.focus();
    if (details.message == "") {
      details.highlightOnly = true;
      this.setupEvent(notification, "done", details);
    }
  }
  */
  // if (details.message != "") {
    if (this.chromeWin) {
      var notification = new this.chromeWin
          .Notification(details.title, options);

      if (details.timeout && (details.timeout > 0)) {
        GM_util.timeout(function () {
          if (notification) {
            details.timeoutWasReached = true;
            notification.close();
          }
        }, details.timeout);
      }
    } else {
      throw new this.wrappedContentWin.Error(
          'GM_notification() - "' + notification.details.title + '": '
          + GM_CONSTANTS.localeStringBundle.createBundle(
              GM_CONSTANTS.localeGreasemonkeyProperties)
              .GetStringFromName("error.environment.unsupported.e10s"),
          this.fileURL, null);
    }
  // }

  GM_util.hitch(this, "chromeStart", notification, details)();
};

// This function is intended to be called in chrome's security context.
GM_notificationer.prototype.chromeStart =
function (notification, details) {
  this.setupEvent(notification, "click", details);
  // Deprecated.
  this.setupEvent(notification, "close", details);
  this.setupEvent(notification, "done", details);
  this.setupEvent(notification, "error", details);
};

// Arranges for the specified "event" on notification to call
// the method by the same name which is a property of "details"
// in the content window's security context.
GM_notificationer.prototype.setupEvent = function (
    wrappedContentWin, sandbox, fileURL, notification, event, details) {
   var eventCallback = details["on" + event];

  // Part 2: ...but ensure that the callback came from a script, not content,
  // by checking that its principal equals that of the sandbox.
  if (eventCallback) {
    let callbackPrincipal = Cu.getObjectPrincipal(eventCallback);
    if (!this.sandboxPrincipal.equals(callbackPrincipal)) {
      return undefined;
    }
  }

  var startEventCallback = GM_util.hitch(
      this, "startEventCallback", wrappedContentWin, details);

  notification.addEventListener(event, function (evt) {
    if (!details.highlightOnly) {
      evt.preventDefault();
    }
    startEventCallback(details["on" + evt.type]);
    switch (evt.type) {
      case "click":
        startEventCallback(
            details["on" + "done"],
            (notification.onclose !== "undefined"));
        break;
      case "close":
        if (!details.timeoutWasReached) {
          startEventCallback(details["on" + "done"]);
        }
        break;
      case "error":
        throw new wrappedContentWin.Error(
            GM_CONSTANTS.localeStringBundle.createBundle(
                GM_CONSTANTS.localeGreasemonkeyProperties)
                .GetStringFromName("error.notification.error")
                .replace("%1", details.title),
            fileURL, null);
        break;
    }
  }, false);
};

GM_notificationer.prototype.startEventCallback = function (
    wrappedContentWin, details, eventCallback,
    isNothingOrOnCloseExists) {
  if (!eventCallback || isNothingOrOnCloseExists) {
    return undefined;
  }
  if (GM_util.windowIsClosed(wrappedContentWin)) {
    return undefined;
  }

  // Pop back onto browser thread and call event handler.
  // Have to use nested function here instead of GM_util.hitch
  // because otherwise details[event].apply can point to window.setTimeout,
  // which can be abused to get increased privileges.
  new XPCNativeWrapper(wrappedContentWin, "setTimeout()")
      .setTimeout(function () {
        eventCallback.call();
      }, 0);
};
