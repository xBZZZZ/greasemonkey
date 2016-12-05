'use strict';

var EXPORTED_SYMBOLS = ['fileXhr'];

// Firefox < 27 (i.e. PaleMoon)
// https://bugzilla.mozilla.org/show_bug.cgi?id=920553
try {
  Components.utils.importGlobalProperties(["XMLHttpRequest"]);
} catch (e) {
  // Ignore.
}

// Sync XHR.  It's just meant to fetch file:// URLs that aren't otherwise
// accessible in content.  Don't use it in the parent process or for web URLs.
function fileXhr(aUrl, aMimetype, aResponseType) {
  if (!aUrl.match(/^file:\/\//)) {
    throw new Error('fileXhr() used for non-file URL: ' + aUrl + '\n');
  }
  // PaleMoon
  try {
    var xhr = new XMLHttpRequest();
  } catch (e) {
    var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Components.interfaces.nsIXMLHttpRequest);
  }
  xhr.open("open", aUrl, false);
  if (aResponseType) {
    xhr.responseType = aResponseType;
  } else {
    xhr.overrideMimeType(aMimetype);
  }
  xhr.send(null);
  return aResponseType ? xhr.response : xhr.responseText;
}
