"use strict";

const EXPORTED_SYMBOLS = ["AbstractScript"];

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

Cu.import("chrome://greasemonkey-modules/content/third-party/convert2RegExp.js");
Cu.import("chrome://greasemonkey-modules/content/third-party/MatchPattern.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const ABOUT_BLANK_REGEXP = new RegExp(GM_CONSTANTS.urlAboutPart1Regexp, "");

function AbstractScript() { }

Object.defineProperty(AbstractScript.prototype, "globalExcludes", {
  "get": function AbstractScript_getGlobalExcludes() {
    return [];
  },
  "configurable": true,
});

AbstractScript.prototype.matchesURL = function (url) {
  var uri = GM_util.getUriFromUrl(url);

  function testClude(glob) {
    // See #1298.
    // Do not run in about:blank unless _specifically_ requested.
    if (ABOUT_BLANK_REGEXP.test(url) && !ABOUT_BLANK_REGEXP.test(glob)) {
      return false;
    }

    return GM_convert2RegExp(glob, uri).test(url);
  }
  function testMatch(matchPattern) {
    if (typeof matchPattern == "string") {
      matchPattern = new MatchPattern(matchPattern);
    }

    return matchPattern.doMatch(url);
  }

  // Flat deny if URL is not greaseable, or matches global excludes.
  if (!GM_util.isGreasemonkeyable(url)) {
    return false;
  }

  if (this.globalExcludes.some(testClude)) {
    return false;
  }

  // Allow based on user cludes.
  if (this.userExcludes.some(testClude)) {
    return false;
  }
  if (this.userIncludes.some(testClude) || this.userMatches.some(testMatch)) {
    return true;
  }

  // Finally allow based on script cludes and matches.
  if (this.excludes.some(testClude)) {
    return false;
  }
  return (this.includes.some(testClude) || this.matches.some(testMatch));
};
