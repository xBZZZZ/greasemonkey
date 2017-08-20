"use strict";

const EXPORTED_SYMBOLS = ["GM_CONSTANTS"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/util.js");


const GM_CONSTANTS = {
  "addonGUID": "{e4a8a97b-f2ed-450b-b12d-ee082ba24781}",
  "addonInstallPolicyClassDescription": "Greasemonkey Script Install Policy",
  "addonInstallPolicyClassID": Components.ID(
      "c03c575c-e87e-4a0f-b88d-8be090116a0c"),
  "addonInstallPolicyContractID":
      "@greasemonkey.mozdev.org/greasemonkey-install-policy;1",
  "addonScriptProtocolClassDescription":
      'Protocol handler for "greasemonkey-script:"',
  "addonScriptProtocolClassID": Components.ID(
      "20d898f3-2fb8-4b3a-b8c7-7ad6c2c48598"),
  "addonScriptProtocolContractID":
      "@mozilla.org/network/protocol;1?name=greasemonkey-script",
  "addonScriptProtocolScheme": "greasemonkey-script",
  "addonScriptProtocolSeparator": "/",
  "addonServiceClassDescription": "GM_GreasemonkeyService",
  "addonServiceClassID": Components.ID(
      "{77bf3650-1cd6-11da-8cd6-0800200c9a66}"),
  "addonServiceContractID": "@greasemonkey.mozdev.org/greasemonkey-service;1",
  "addonVersionFirst": "0.0",
  "browserIDFirefox": "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}",
  "browserIDPalemoon": "{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}",
  // "dataUserScriptHosting": "data:text/html;base64,PCFET0NUWVBFIGh0bWw+DQo8aHRtbD4NCjxoZWFkPg0KPG1ldGEgaHR0cC1lcXVpdj0iY29udGVudC10eXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7Y2hhcnNldD11dGYtOCI+DQo8dGl0bGU+VXNlciBTY3JpcHQgSG9zdGluZzwvdGl0bGU+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KYm9keSB7DQogIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7DQogIGNvbG9yOiAjMDAwMDAwOw0KfQ0KaDEsIGgyLCBoMywgaDQsIGg1LCBoNiB7DQogIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYWFhYWFhOw0KICBmb250LXdlaWdodDogbm9ybWFsOw0KICBwYWRkaW5nOiAwOw0KfQ0KaDEgew0KICBtYXJnaW46IDA7DQp9DQpoMiwgaDMsIGg0LCBoNSwgaDYgew0KICBtYXJnaW4tYm90dG9tOiAwOw0KICBtYXJnaW4tdG9wOiAxZW07DQp9DQpwIHsNCiAgbWFyZ2luLWJvdHRvbTogMDsNCiAgbWFyZ2luLXRvcDogMC41ZW07DQogIHBhZGRpbmc6IDA7DQp9DQo8L3N0eWxlPg0KPC9oZWFkPg0KPGJvZHk+DQo8aDE+VXNlciBTY3JpcHQgSG9zdGluZzwvaDE+DQo8aDI+R2lzdDwvaDI+DQo8cD48YSBocmVmPSJodHRwczovL2dpc3QuZ2l0aHViLmNvbS8iPmh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzwvYT48L3A+DQo8aDI+R3JlYXN5IEZvcms8L2gyPg0KPHA+PGEgaHJlZj0iaHR0cHM6Ly9ncmVhc3lmb3JrLm9yZy8iPmh0dHBzOi8vZ3JlYXN5Zm9yay5vcmcvPC9hPjwvcD4NCjxoMj5PcGVuVXNlckpTLm9yZzwvaDI+DQo8cD48YSBocmVmPSJodHRwczovL29wZW51c2VyanMub3JnLyI+aHR0cHM6Ly9vcGVudXNlcmpzLm9yZy88L2E+PC9wPg0KPC9ib2R5Pg0KPC9odG1sPg0K",
  "directoryMask": parseInt("750", 8),
  "directoryScriptsName": "gm_scripts",
  "directoryService": Cc["@mozilla.org/file/directory_service;1"]
      .getService(Ci.nsIProperties),
  "directoryServiceScriptName": "ProfD",
  "directoryServiceTempName": "TmpD",
  "directoryTempName": "gm-temp",
  "fileMask": parseInt("640", 8),
  "fileProtocolHandler": Cc["@mozilla.org/network/protocol;1?name=file"]
      .getService(Ci.nsIFileProtocolHandler),
  "fileMetaExtension": ".meta.js",
  "fileProtocolSchemeRegexp": "^file:\/\/",
  "fileScriptCharset": "UTF-8",
  "fileScriptContentTypeNoRegexp": "^text/(x|ht)ml",
  "fileScriptDBExtension": ".db",
  "fileScriptExtension": ".user.js",
  "fileScriptExtensionRegexp": "\\.user\\.js",
  "fileScriptName": "gm-script",
  // GM_info
  "info": {
    "scriptHandler": "Greasemonkey",
  },
  // The HTTP status code:
  // client errors (429 "Too Many Requests"), server errors.
  "installScriptBadStatus": function (aStatus, aBool) {
    let statusEqual = [429, 500];     
    let statusGreaterThanAndEqual = 999;
    if (aBool) {
      return GM_util.inArray(statusEqual, aStatus)
          || (statusGreaterThanAndEqual <= aStatus);
    } else {
      return !GM_util.inArray(statusEqual, aStatus)
          && !(statusGreaterThanAndEqual <= aStatus);
    }
  },
  // The HTTP status code: 
  // client errors
  // (401 "Authorization Required", 407 "Proxy Authentication Required")
  "installScriptReloadStatus": [401, 407],
  "ioService": Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService),
  "jsSubScriptLoader": Cc["@mozilla.org/moz/jssubscript-loader;1"]
      .getService(Ci.mozIJSSubScriptLoader),
  "localeGmAddonsProperties":
      "chrome://greasemonkey/locale/gmAddons.properties",
  "localeGmBrowserProperties":
      "chrome://greasemonkey/locale/gmBrowser.properties",
  "localeGreasemonkeyProperties":
      "chrome://greasemonkey/locale/greasemonkey.properties",
  "localeStringBundle": Cc["@mozilla.org/intl/stringbundle;1"]
      .getService(Ci.nsIStringBundleService),
  "script": {
   "includeAll": "*",
  },
  "scriptAddonType": "greasemonkey-user-script",
  "scriptIDSuffix": "@greasespot.net",
  "scriptParseBOM": "\u00EF\u00BB\u00BF",
  "scriptParseBOMArray": [0xEF, 0xBB, 0xBF],
  "scriptParseMetaRegexp": "// ==UserScript==([\\s\\S]*?)^// ==/UserScript==",
  "scriptPrefsUrl": "chrome://greasemonkey/content/scriptPrefs.xul",
  // Seconds.
  "scriptUpdateTimeoutDefault": 45,  
  "scriptUpdateTimeoutMax": 60,
  "scriptUpdateTimeoutMin": 1,
  "scriptType": "user-script",
  "scriptViewID": "addons://list/greasemonkey-user-script",
  "scriptViewIDDetailPrefix": "addons://detail/",
  "urlAboutAllRegexp": "^about:(blank|reader)",
  "urlAboutPart1": "about:blank",
  "urlAboutPart1Regexp": "^about:blank",
  "urlAboutPart2Regexp": "^about:reader",
  "urlUserPassStripRegexp": "(://)([^:/]+)(:[^@/]+)?@",
  "versionChecker": Cc["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Ci.nsIVersionComparator),
  "xulAppInfo": Cc["@mozilla.org/xre/app-info;1"]
      .getService(Ci.nsIXULAppInfo),
  "xulRuntime": Cc["@mozilla.org/xre/app-info;1"]
      .getService(Ci.nsIXULRuntime),
};
