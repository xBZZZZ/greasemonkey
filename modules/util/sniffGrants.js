const EXPORTED_SYMBOLS = ["sniffGrants"];

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


const APIS = [
  "GM_addStyle",
  "GM_deleteValue",
  "GM_getResourceText",
  "GM_getResourceURL",
  "GM_getValue",
  "GM_listValues",
  "GM_log",
  "GM_notification",
  "GM_openInTab",
  "GM_registerMenuCommand",
  "GM_setClipboard",
  "GM_setValue",
  "GM_xmlhttpRequest",
  "unsafeWindow",
];

function sniffGrants(aScript) {
  let src = GM_util.getScriptSource(aScript);
  let grants = [];

  for (let i = 0, iLen = APIS.length; i < iLen; i++) {
    let apiName = APIS[i];
    if (src.indexOf(apiName) !== -1) {
      grants.push(apiName);
    }
  }
  if (grants.length == 0) {
    return ["none"];
  }

  return grants;
}
