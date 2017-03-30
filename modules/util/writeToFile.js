const EXPORTED_SYMBOLS = ["writeToFile"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("resource://gre/modules/NetUtil.jsm");


const FILE_TYPE = Ci.nsIFile.NORMAL_FILE_TYPE;
//                   PR_WRONLY   PR_CREATE_FILE PR_TRUNCATE
const STREAM_FLAGS = 0x02      | 0x08         | 0x20;

var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Ci.nsIScriptableUnicodeConverter);
converter.charset = GM_CONSTANTS.fileScriptCharset;

// Given string data and an nsIFile, write it safely to that file.
function writeToFile(aData, aFile, aCallback) {
  // Assume aData is a string; convert it to a UTF-8 stream.
  let istream = converter.convertToInputStream(aData);

  // Create a temporary file (stream) to hold the data.
  let tmpFile = aFile.clone();
  tmpFile.createUnique(FILE_TYPE, GM_CONSTANTS.fileMask);
  let ostream = Cc["@mozilla.org/network/safe-file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
  ostream.init(tmpFile, STREAM_FLAGS, GM_CONSTANTS.fileMask, 0);

  NetUtil.asyncCopy(istream, ostream, function (status) {
    if (Components.isSuccessCode(status)) {
      // On successful write, move it to the real location.
      tmpFile.moveTo(aFile.parent, aFile.leafName);

      if (aCallback) {
        aCallback();
      }
    }
  });
}
