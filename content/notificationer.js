Components.utils.import("chrome://greasemonkey-modules/content/util.js");

var ppmm = Components
    .classes["@mozilla.org/parentprocessmessagemanager;1"]
    .getService(Components.interfaces.nsIMessageListenerManager);


var GM_Notificationer = {};

GM_Notificationer.initialize = function () {
  ppmm.addMessageListener("greasemonkey:notification-response",
      GM_Notificationer.messageNotificationResponse);
};

GM_Notificationer.uninitialize = function () {
  ppmm.removeMessageListener("greasemonkey:notification-response",
      GM_Notificationer.messageNotificationResponse);
};

GM_Notificationer.run = function (aNotification) {
  var cookie = aNotification.cookie;
  var details = JSON.parse(aNotification.details);
  var scriptFileURL = aNotification.scriptFileURL;
  var scriptUuid = aNotification.scriptUuid;

  var stringBundle = Components
      .classes["@mozilla.org/intl/stringbundle;1"]
      .getService(Components.interfaces.nsIStringBundleService)
      .createBundle("chrome://greasemonkey/locale/greasemonkey.properties");

  var options = {
    "body": details.message,
    "icon": details.image,
  }

  // Hightlight tab does not work.
  /*
  if (details.highlight) {
    if (details.message == "") {
      gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
          "greasemonkey:notification-run", {
            "detail": JSON.stringify({
              "cookie": cookie,
              "funcType": "onDone",
              "scriptUuid": scriptUuid,
            })
          });
    }
  }
  */
  // if (details.message != "") {
    var notification = new Notification(details.title, options);

    notification.onclick = function (e) {
      if (!details.highlight) {
        e.preventDefault();
      }
      gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
          "greasemonkey:notification-run", {
            "cookie": cookie,
            "funcType": "onClick",
            "scriptUuid": scriptUuid,
          });
      if ("undefined" === notification.onclose) {
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
            "greasemonkey:notification-run", {
              "cookie": cookie,
              "funcType": "onDone",
              "scriptUuid": scriptUuid,
            });
      }
    }

    if ("undefined" !== notification.onclose) {
      // Deprecated.
      notification.onclose = function (e) {
        if (!details.highlight) {
          e.preventDefault();
        }
        gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
            "greasemonkey:notification-run", {
              "cookie": cookie,
              "funcType": "onDone",
              "scriptUuid": scriptUuid,
            });
      }
    }

    notification.onerror = function (e) {
      if (!details.highlight) {
        e.preventDefault();
      }
      throw new Error(
          stringBundle.GetStringFromName("notification.error")
              .replace("%1", details.title),
          scriptFileURL, null);
    }

    if (details.timeout && (details.timeout > 0)) {
      GM_util.timeout(function () {
        if (notification) {
          notification.close();
          if ("undefined" === notification.onclose) {
            gBrowser.selectedBrowser.messageManager.sendAsyncMessage(
                "greasemonkey:notification-run", {
                  "cookie": cookie,
                  "funcType": "onDone",
                  "scriptUuid": scriptUuid,
                });
          }
        }
      }, details.timeout);
    }
  // }
};

GM_Notificationer.messageNotificationResponse = function (aMessage) {
  GM_Notificationer.run(aMessage.data.notification);
};
