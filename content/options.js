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

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function GM_loadOptions() {
  document.getElementById("check-sync")
      .setAttribute("label", document.getElementById("check-sync")
      .getAttribute("label")
      .replace(/Pale\s*Moon/i, (
      (Services.appinfo.ID == GM_CONSTANTS.browserIDFirefox)
          ? "Firefox"
          : "$&")
      ));
  document.getElementById("disable-update")
      .checked = GM_prefRoot.getValue("requireDisabledScriptsUpdates");
  document.getElementById("secure-update")
      .checked = GM_prefRoot.getValue("requireSecureUpdates");
  document.getElementById("timeout-update")
      .checked = GM_prefRoot.getValue("requireTimeoutUpdates");
  let timeoutUpdatesInSeconds = GM_prefRoot.getValue("timeoutUpdatesInSeconds");
  timeoutUpdatesInSeconds = isNaN(parseInt(timeoutUpdatesInSeconds, 10))
      ? 45 : parseInt(timeoutUpdatesInSeconds, 10);
  timeoutUpdatesInSeconds = timeoutUpdatesInSeconds >= 1
      && timeoutUpdatesInSeconds <= 60
      ? timeoutUpdatesInSeconds : 45;
  document.getElementById("timeout-update-value")
      .value = timeoutUpdatesInSeconds;
  document.getElementById("submit-stats")
      .checked = GM_prefRoot.getValue("stats.optedIn");
  document.getElementById("global-excludes")
      .pages = GM_util.getService().config.globalExcludes;
  document.getElementById("newScript-removeUnused")
      .checked = GM_prefRoot.getValue("newScript.removeUnused");
  document.getElementById("newScript-template")
      .value = GM_prefRoot.getValue("newScript.template");
}

function GM_saveOptions(checkbox) {
  GM_prefRoot.setValue("sync.enabled",
      !!document.getElementById("check-sync").checked);
  GM_prefRoot.setValue("requireDisabledScriptsUpdates",
      !!document.getElementById("disable-update").checked);
  GM_prefRoot.setValue("requireSecureUpdates",
      !!document.getElementById("secure-update").checked);
  GM_prefRoot.setValue("requireTimeoutUpdates",
      !!document.getElementById("timeout-update").checked);
  GM_prefRoot.setValue("timeoutUpdatesInSeconds",
      parseInt(document.getElementById("timeout-update-value").value, 10));
  GM_prefRoot.setValue("stats.optedIn",
      !!document.getElementById("submit-stats").checked);
  GM_util.getService().config.globalExcludes =
      document.getElementById("global-excludes").pages;
  GM_prefRoot.setValue("newScript.removeUnused",
      !!document.getElementById("newScript-removeUnused").checked);
  GM_prefRoot.setValue("newScript.template",
      document.getElementById("newScript-template").value);
  // Changes to global excludes should be active after tab reload.
  Services.cpmm.sendAsyncMessage("greasemonkey:broadcast-script-updates");
}
