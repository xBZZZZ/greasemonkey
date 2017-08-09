/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Page Modifications code.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   David Dahl <ddahl@mozilla.com>
 *   Drew Willcoxon <adw@mozilla.com>
 *   Erik Vold <erikvvold@gmail.com>
 *   Nils Maier <maierman@web.de>
 *   Anthony Lieuallen <arantius@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORTED_SYMBOLS = ["MatchPattern"];

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

Cu.import("chrome://greasemonkey-modules/content/third-party/convertToRegexp.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const SCHEMES_VALID = ["file", "ftp", "http", "https"];
// const SCHEMES_VALID_REGEXP = SCHEMES_VALID.join("|");

const HOST_REGEXP = /^(?:\*\.)?[^*\/]+$|^\*$|^$/;

// Firefox - copied this from resource://gre/modules/MatchPattern.jsm
// const PARTS_REGEXP = new RegExp(`^([a-z]+|\\*)://(\\*|\\*\\.[^*/]+|[^*/]+|)(/.*)$`, "");
const PARTS_REGEXP = new RegExp("^([a-z*]+)://([^/]+)(?:(/.*))$", "");

// For the format of "pattern".
// http://code.google.com/chrome/extensions/match_patterns.html
function MatchPattern(aPattern) {
  this._pattern = aPattern;

  // Special case "<all_urls>".
  if (aPattern == "<all_urls>") {
    this._all = true;
    this._scheme = "all_urls";
    return undefined;
  } else {
    this._all = false;
  }

  let match = aPattern.match(PARTS_REGEXP);
  // We allow the host to be empty for file URLs.
  // if (!match || ((match[1] != "file") && (match[2] == ""))) {
  if (!match) {
    aPattern = "[" + (typeof aPattern) + "] " + aPattern;
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.matchPattern.parse")
            .replace("%1", aPattern));
  }
  let scheme = match[1];
  this._scheme = scheme;
  let host = match[2];
  let path = match[3];

  if ((scheme != "*") && (SCHEMES_VALID.indexOf(scheme) == -1)) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.matchPattern.scheme")
            .replace("%1", scheme));
  }

  if (!HOST_REGEXP.test(host)) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.matchPattern.host")
            .replace("%1", host));
  }

  if (path[0] !== "/") {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.matchPattern.path")
            .replace("%1", path));
  }

  if (host) {
    // We have to manually create the hostname regexp (instead of using
    // GM_convertToRegexp) to properly handle *.example.tld, which should match
    // example.tld and any of its subdomains, but not anotherexample.tld.
    this._hostExpr = new RegExp("^" +
        // Two characters in the host portion need special treatment:
        //   - ". should not be treated as a wildcard, so we escape it to \.
        //   - if the hostname only consists of "*" (i.e. full wildcard),
        //     replace it with .*
        host.replace(/\./g, "\\.").replace(/^\*$/, ".*")
        // Then, handle the special case of "*." (any or no subdomain)
        // for match patterns. "*." has been escaped to "*\."
        // by the replace above.
            .replace("*\\.", "(.*\\.)?") + "$", "i");
  } else {
    // If omitted, then it means "", an alias for localhost.
    this._hostExpr = /^$/;
  }
  this._pathExpr = GM_convertToRegexp(path, false, true);
}

Object.defineProperty(MatchPattern.prototype, "pattern", {
  "get": function MatchPattern_getPattern() {
    return "" + this._pattern;
  },
  "enumerable": true,
});

MatchPattern.prototype.doMatch = function (aUriSpec) {
  let matchURI = GM_util.getUriFromUrl(aUriSpec);

  if (SCHEMES_VALID.indexOf(matchURI.scheme) == -1) {
    return false;
  }

  if (this._all) {
    return true;
  }
  if ((this._scheme != "*") && (this._scheme != matchURI.scheme)) {
    return false;
  }
  return this._hostExpr.test(matchURI.host)
      && this._pathExpr.test(matchURI.path);
};
