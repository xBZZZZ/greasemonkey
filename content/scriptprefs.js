if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

// Ref'd in XUL.
Cu.import("chrome://greasemonkey-modules/content/util.js");


var gScriptId = decodeURIComponent(location.hash.substring(1));
var gScript = GM_util.getService().config.getMatchingScripts(function (script) {
  return script && (script.id == gScriptId);
})[0];

var gElmTabbox = null;
var gElmUserTab = null;

var gElm = {
  "scriptIncludes": "script-includes",
  "scriptMatches": "script-matches",
  "scriptExcludes": "script-excludes",
  "userIncludes": "user-includes",
  "userMatches": "user-matches",
  "userExcludes": "user-excludes",
};

window.addEventListener("load", function () {
  // I wanted "%s" but % is reserved in a DTD and I don't know the literal.
  document.title = document.title.replace("!!", gScript.localized.name);

  gElmTabbox = document.getElementsByTagName("tabbox")[0];
  gElmUserTab = gElmTabbox.tabs.getItemAtIndex(0);

  Object.getOwnPropertyNames(gElm).forEach(function (prop) {
    gElm[prop] = document.getElementById(gElm[prop]);
  });

  gElm.scriptIncludes.pages = gScript.includes;
  gElm.scriptIncludes.onAddUserExclude = function (page) {
    gElm.userExcludes.addPage(page);
    gElmTabbox.selectedTab = gElmUserTab;
  };
  gElm.userIncludes.pages = gScript.userIncludes;

  let matchesPattern = [];
  for (let i = 0, iLen = gScript.matches.length; i < iLen; i++) {
    matchesPattern.push(gScript.matches[i].pattern);
  }
  gElm.scriptMatches.pages = matchesPattern;
  let userMatchesPattern = [];
  for (var i = 0, iLen = gScript.userMatches.length; i < iLen; i++) {
    userMatchesPattern.push(gScript.userMatches[i].pattern);
  }
  gElm.userMatches.pages = userMatchesPattern;

  gElm.scriptExcludes.pages = gScript.excludes;
  gElm.scriptExcludes.onAddUserInclude = function (page) {
    gElm.userIncludes.addPage(page);
    gElmTabbox.selectedTab = gElmUserTab;
  };
  gElm.userExcludes.pages = gScript.userExcludes;

  if (GM_util.getEnvironment().osWindows) {
    document.getElementById("resizer").style.display = "block";
  }
}, false);

function onDialogAccept() {
  gScript.userIncludes = gElm.userIncludes.pages;
  gScript.userMatches = gElm.userMatches.pages;
  gScript.userExcludes = gElm.userExcludes.pages;
  GM_util.getService().config._changed(gScript, "cludes");
}
