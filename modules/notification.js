var EXPORTED_SYMBOLS = [
    "NotificationEventNameSuffix",
    "NotificationRespond",
    "NotificationRun", "NotificationSandbox",
    ];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


var NotificationEventNameSuffix = (function () {
  var suffix = GM_prefRoot.getValue("notificationerEventNameSuffix");
  if (!suffix) {
    Cu.import("resource://services-crypto/utils.js");
    suffix = CryptoUtils.sha1Base32(CryptoUtils.generateRandomBytes(128));
    GM_prefRoot.setValue("notificationerEventNameSuffix", suffix);
  }
  return suffix;
})();

// Callback from script scope, pass "show notification" response up to
// parent process as a message.
function NotificationRespond(aNotification) {
  if (!aNotification) {
    return;
  }
  var cpmm = Cc["@mozilla.org/childprocessmessagemanager;1"]
      .getService(Ci.nsIMessageSender);
  cpmm.sendAsyncMessage(
      "greasemonkey:notification-response",
      {"notification": aNotification});
}

// Frame scope: Respond to the "launch events (onclick, ondone)" message coming
// from the parent, pass it into the sandbox.
function NotificationRun(aContent, aMessage) {
  var e = new aContent.CustomEvent(
      "greasemonkey-notification-run-" + NotificationEventNameSuffix,
      {"detail": JSON.stringify(aMessage.data)});
  aContent.dispatchEvent(e);
}

// This function is injected into the sandbox, in a private scope wrapper, BY
// SOURCE.  Data and sensitive references are wrapped up inside its closure.
function NotificationSandbox(
    aContent, aScriptUuid, aScriptName, aScriptFileURL,
    aNotificationResponder,
    aNotificationCallbackIsNotFunctionStr,
    aNotificationMessageOrHighlightStr,
    aNotificationEventNameSuffix) {
  // 1) Internally to this function's private scope, maintain a set of
  // notifications.
  var notifications = {};
  var notificationFuncs = {};
  var notificationCookie = 0;
  // 2) Respond to requests to show those notifications.
  addEventListener(
      "greasemonkey-notification-show-" + aNotificationEventNameSuffix,
      function (e) {
        e.stopPropagation();
        aNotificationResponder(notifications[notificationCookie]);
      }, true);
  // 3) Respond to requests to launch events (onclick, ondone)
  // those notifications.
  addEventListener(
      "greasemonkey-notification-run-" + aNotificationEventNameSuffix,
      function (e) {
        e.stopPropagation();
        var detail = JSON.parse(e.detail);
        if (aScriptUuid != detail.scriptUuid) {
          return;
        }
        // This event is for this script; stop propagating to other scripts.
        e.stopImmediatePropagation();
        var notificationFunc = notificationFuncs[detail.cookie];
        switch (detail.funcType) {
          case "onClick":
            if (notificationFunc && !notificationFunc.onClickNo) {
              notificationFunc.onClickNo = true;
              if ("function" !== typeof notificationFunc.onClick) {
                throw new Error(
                  aNotificationCallbackIsNotFunctionStr.replace("%1",
                      JSON.parse(notifications[detail.cookie].details).title),
                  aScriptFileURL, null);
              } else {
                notificationFunc.onClick.call();
              }
            }
            break;
          case "onDone":
            if (notificationFunc && !notificationFunc.onDoneNo) {
              notificationFunc.onDoneNo = true;
              if ("function" !== typeof notificationFunc.onDone) {
                throw new Error(
                  aNotificationCallbackIsNotFunctionStr.replace("%1",
                      JSON.parse(notifications[detail.cookie].details).title),
                  aScriptFileURL, null);
              } else {
                notificationFunc.onDone.call();
              }
            }
            // Delete objects.
            delete notifications[detail.cookie];
            delete notificationFuncs[detail.cookie];
            break;
        }
      }, true);
  // 4) Export the "show a notification" API function to the sandbox scope.
  this.GM_notification = function (
      aDetailsOrText, aOnDoneOrTitle, aImage, aOnClick) {
    var _functionEmpty = function () {};

    var details = {
      "highlight": true,
      "image": "chrome://greasemonkey/skin/icon32.png",
      "message": "",
      "onclick": _functionEmpty,
      "ondone": _functionEmpty,
      "timeout": 0,
      "title": aScriptName,
    };

    var _details = {};

    if (aDetailsOrText) {
      if ("object" == typeof aDetailsOrText) {
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
      throw new Error(
          aNotificationMessageOrHighlightStr.replace("%1", details.title),
          aScriptFileURL, null);
    }

    var notification = {
      "cookie": ++notificationCookie,
      "details": JSON.stringify(details),
      "scriptFileURL": aScriptFileURL,
      "scriptUuid": aScriptUuid,
    };
    notifications[notification.cookie] = notification;
    notificationFuncs[notification.cookie] = {
      "onClick": details.onclick,
      "onClickNo": false,
      "onDone": details.ondone,
      "onDoneNo": false,
    };
    var e = new aContent.CustomEvent(
        "greasemonkey-notification-show-" + aNotificationEventNameSuffix, {});
    aContent.dispatchEvent(e);
  };
}
