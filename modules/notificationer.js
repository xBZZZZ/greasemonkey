var EXPORTED_SYMBOLS = ["GM_notificationer"];

Components.utils.import("chrome://greasemonkey-modules/content/util.js");

var gStringBundle = Components
    .classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .createBundle("chrome://greasemonkey/locale/greasemonkey.properties");


function GM_notificationer(
    aChromeWin, aWrappedContentWin, aSandbox, aFileURL, aScriptName) {
  this.chromeWin = aChromeWin;  
  this.fileURL = aFileURL;
  this.sandbox = aSandbox;
  this.sandboxPrincipal = Components.utils.getObjectPrincipal(aSandbox);
  this.scriptName = aScriptName;
  this.setupEvent = GM_util.hitch(
      this, "setupEvent", aWrappedContentWin, aSandbox,
      aFileURL);
  this.wrappedContentWin = aWrappedContentWin;
}

// This function gets called by user scripts in content security scope.
GM_notificationer.prototype.contentStart = function(
    aDetailsOrText, aOnDoneOrTitle, aImage, aOnClick) {
  var _functionEmpty = function () {};

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
    if ("object" == typeof aDetailsOrText) {
      // Part 1: Waive Xrays so that we can read callback function properties...
      aDetailsOrText = Components.utils.waiveXrays(aDetailsOrText);
      _details.highlight = aDetailsOrText.highlight;
      _details.image = aDetailsOrText.image;
      _details.message = aDetailsOrText.text;
      _details.onclick = aDetailsOrText.onclick;
      _details.ondone = aDetailsOrText.ondone;
      _details.timeout = aDetailsOrText.timeout;
      _details.title = aDetailsOrText.title;
    } else if ("string" == typeof aDetailsOrText) {
      details.message = aDetailsOrText;
    }
  }

  if ("undefined" !== typeof _details.highlight) {
    details.highlight = _details.highlight;
  }
  // i.e. a data scheme
  if (_details.image && ("string" == typeof _details.image)) {
    details.image = _details.image;
  }
  if (_details.message && ("string" == typeof _details.message)) {
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
  if (_details.title && ("string" == typeof _details.title)) {
    details.title = _details.title;
  }

  if (aOnDoneOrTitle) {
    if ("object" == typeof aDetailsOrText) {
      details.ondone = aOnDoneOrTitle;
    } else if ("string" == typeof aOnDoneOrTitle) {
      details.title = aOnDoneOrTitle;
    }
  }

  if (aImage) {
    // i.e. a data scheme
    if ("string" == typeof aImage) {
      details.image = aImage;
    }
  }

  if (aOnClick) {
    details.onclick = aOnClick;
  }

  if ((details.message == "") && !details.highlight) {
    throw new this.wrappedContentWin.Error(
        gStringBundle
            .GetStringFromName("error.notification.messageOrHighlight")
            .replace("%1", details.title),
        this.fileURL, null);
  }

  var notification = {
    "details": details,
    "onClick": details.onclick,
    "onDone": details.ondone,
  };

  if ("function" !== typeof notification.onClick) {
    throw new this.wrappedContentWin.Error(
        gStringBundle
            .GetStringFromName("error.notification.callbackIsNotFunction")
            .replace("%1", notification.details.title)
            .replace("%2", "onclick"),
        this.fileURL, null);
  }
  if ("function" !== typeof notification.onDone) {
    throw new this.wrappedContentWin.Error(
        gStringBundle
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
          'GM_notification() - "' + notification.details.title
          + '": On e10s enabled does not work.',
          this.fileURL, null);
    }
  // }

  GM_util.hitch(this, "chromeStart", notification, details)();
};

// This function is intended to be called in chrome's security context.
GM_notificationer.prototype.chromeStart =
function(notification, details) {
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
    var callbackPrincipal = Components.utils.getObjectPrincipal(eventCallback);
    if (!this.sandboxPrincipal.equals(callbackPrincipal)) {
      return;
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
            ("undefined" !== notification.onclose));
        break;
      case "close":
        if (!details.timeoutWasReached) {
          startEventCallback(details["on" + "done"]);
        }
        break;
      case "error":
        throw new wrappedContentWin.Error(
            gStringBundle.GetStringFromName("error.notification.error")
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
    return;
  }
  if (GM_util.windowIsClosed(wrappedContentWin)) {
    return;
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
