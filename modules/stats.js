/*
This module implements the reporting side of the pseudo-anonymous
usage statistic gathering first described at:
https://github.com/greasemonkey/greasemonkey/issues/1651

It does not export anything.
It only sets an interval and periodically does the work
to send data to the server.
*/

const EXPORTED_SYMBOLS = [];

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

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

Cu.import("resource://services-common/utils.js");

Cu.import("chrome://greasemonkey-modules/content/miscapis.js");
Cu.import("chrome://greasemonkey-modules/content/parseScript.js");
Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/storageBack.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const STAT_URL_EXAMPLE =
    "http://www.greasespot.net/2012/11/anonymous-statistic-gathering.html";
// Milliseconds.
const STAT_TIMEOUT_1 = 10000;
const STAT_TIMEOUT_2 = 3600000;

var gPrefMan = new GM_PrefManager();

// Check once, soon.
GM_util.timeout(check, STAT_TIMEOUT_1);
// And forever, as long as the browser stays open.
GM_util.timeout(
    check, STAT_TIMEOUT_2, Ci.nsITimer.TYPE_REPEATING_PRECISE_CAN_SKIP);

var gGreasemonkeyVersion = "unknown";
Cu.import("resource://gre/modules/AddonManager.jsm");
AddonManager.getAddonByID(GM_CONSTANTS.addonGUID, function (aAddon) {
  gGreasemonkeyVersion = "" + aAddon.version;
});

function check() {
  if (!gPrefMan.getValue("stats.optedIn")) {
    promptUser();
    return undefined;
  }

  let lastSubmit = new Date(gPrefMan.getValue("stats.lastSubmitTime"));
  let nextSubmit = new Date(
      (lastSubmit.valueOf()) + gPrefMan.getValue("stats.interval"));
  let now = new Date();

  if (nextSubmit > now) {
    return undefined;
  }

  if (!gPrefMan.getValue("stats.id")) {
    let rng = Cc["@mozilla.org/security/random-generator;1"]
        .createInstance(Ci.nsIRandomGenerator);
    let bytes = rng.generateRandomBytes(18);
    let id = CommonUtils.encodeBase64URL(CommonUtils.byteArrayToString(bytes));
    gPrefMan.setValue("stats.id", id);
  }

  try {
    submit();
  } catch (e) {
    // Just log.
    // Ignore.
    GM_util.logError(e, false, e.fileName, e.lineNumber);
  }

  gPrefMan.setValue("stats.lastSubmitTime", now.toString());
}

function submit() {
  let url = gPrefMan.getValue("stats.url") + gPrefMan.getValue("stats.id");
  let stats = JSON.stringify(getStatsObj());

  let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
  req.open("POST", url, true);

  let channel;

  // Private browsing.
  if (req.channel instanceof Ci.nsIPrivateBrowsingChannel) {
    let isPrivate = true;
    let chromeWin = GM_util.getBrowserWindow();
    if (chromeWin && chromeWin.gBrowser) {
      // i.e. the Private Browsing autoStart pref:
      // "browser.privatebrowsing.autostart"
      isPrivate = PrivateBrowsingUtils.isBrowserPrivate(chromeWin.gBrowser);
    }
    if (isPrivate) {
      channel = req.channel.QueryInterface(Ci.nsIPrivateBrowsingChannel);
      channel.setPrivate(true);
    }
  }
  /*
  dump("Stats - url:" + "\n" + url + "\n"
      + "Private browsing mode: " + req.channel.isChannelPrivate + "\n");
  */

  req.onload = GM_util.hitch(null, submitOnload, req);

  req.send(stats);
}

function submitOnload(aReq) {
  if (!aReq.responseText) {
    return undefined;
  }
  let response;
  try {
    response = JSON.parse(aReq.responseText);
    if (response.interval) {
      gPrefMan.setValue("stats.interval", response.interval);
    }
  } catch (e) {
    GM_util.logError(
        "Stats - submitOnload: Couldn't handle response:" + "\n" + e, false,
        e.fileName, e.lineNumber);
  }
}

function getStatsObj() {
  let stats = {
    "firefoxVersion": GM_CONSTANTS.xulAppInfo.name
        + " " + GM_CONSTANTS.xulAppInfo.version
        + " ("  + GM_CONSTANTS.xulAppInfo.appBuildID + ")",
    "globalExcludeCount": GM_util.getService().config.globalExcludes.length,
    "greasemonkeyEnabled": gPrefMan.getValue("enabled"),
    // "greasemonkeyVersion": gPrefMan.getValue("version"),
    "greasemonkeyVersion": gGreasemonkeyVersion,
    "platform": GM_CONSTANTS.xulRuntime.OS,
    "scripts": [],
  };

  let scripts = GM_util.getService().config.scripts;
  for (let i = 0, iLen = scripts.length; i < iLen; i++) {
    let script = scripts[i];
    let valueStats = new GM_ScriptStorageBack(script).getStats();

    let downloadUri = GM_util.getUriFromUrl(script.downloadURL);
    let domain = null;
    try {
      domain = Cc["@mozilla.org/network/effective-tld-service;1"]
          .getService(Ci.nsIEffectiveTLDService)
          .getBaseDomain(downloadUri);
    } catch (e) {
      // Ignore errors here, i.e. invalid/empty URLs.
    }

    let sizes = [script.textContent.length];
    for (let j = 0, jLen = script.requires.length; j < jLen; j++) {
      let require = script.requires[j];
      sizes[sizes.length] = require.textContent.length;
    }

    let scriptStat = {
      "enabled": script.enabled,
      "id": script.id,
      "installDomain": domain,
      "installScheme": downloadUri.scheme,
      "installTime": script.installDate.toISOString(),
      "modifiedTime": script.modifiedDate.toISOString(),
      "sizes": sizes,
      "userExcludeCount": script.userExcludes.length,
      "userIncludeCount": script.userIncludes.length,
      "userMatchCount": script.userMatches.length,
      // "userOverride": script.userOverride,
      "valueCount": valueStats.count,
      "valueSize": valueStats.size,
    };

    stats.scripts[stats.scripts.length] = scriptStat;
  }

  // TODO:
  // Specify "ui" metrics, i.e. clicks on various things.

  return stats;
}

function promptUser() {
  if (gPrefMan.getValue("stats.prompted")) {
    return undefined;
  }
  gPrefMan.setValue("stats.prompted", true);

  let win = GM_util.getBrowserWindow();
  var browser = win.gBrowser;

  let notificationBox = browser.getNotificationBox();
  let notification = notificationBox.appendNotification(
      GM_CONSTANTS.localeStringBundle.createBundle(
          GM_CONSTANTS.localeGreasemonkeyProperties)
          .GetStringFromName("stats.prompt.msg"),
      "greasemonkey-stats-opt-in",
      "chrome://greasemonkey/skin/icon16.png",
      notificationBox.PRIORITY_INFO_MEDIUM,
      [{
        "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("stats.prompt.readmore.accesskey"),
        "callback": function () {
          browser.loadOneTab(
              STAT_URL_EXAMPLE,
              {
                "inBackground": false,
              });
        },
        "label": GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("stats.prompt.readmore"),
        "popup": null,
      }, {
        "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("stats.prompt.optin.accesskey"),
        "callback": function () {
          gPrefMan.setValue("stats.optedIn", true);
          check();
        },
        "label": GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("stats.prompt.optin"),
        "popup": null,
    }]
  );
  notification.persistence = -1;
}
