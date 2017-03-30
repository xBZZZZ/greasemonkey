const EXPORTED_SYMBOLS = ["GM_notification"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("resource://gre/modules/PopupNotifications.jsm");

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function mute(aTopic) {
  GM_prefRoot.setValue("notification.muted." + aTopic, true);
}

function GM_notification(aMsg, aTopic) {
  let muted = GM_prefRoot.getValue("notification.muted." + aTopic, false);
  if (muted) {
    return undefined;
  }

  let action = {
    "label": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("notification.ok.label"),
    "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("notification.ok.accesskey"),
    "callback": function () {},
  };
  let muteAction = {
    "label": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("notification.neveragain.label"),
    "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("notification.neveragain.accesskey"),
    "callback": function () {
       mute(aTopic);
    },
  };
  let win = GM_util.getBrowserWindow();
  win.PopupNotifications.show(
      win.gBrowser.selectedBrowser, "greasemonkey-notification",
      aMsg, null, action, [muteAction]);
};
