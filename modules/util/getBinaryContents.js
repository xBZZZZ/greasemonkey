const EXPORTED_SYMBOLS = ["getBinaryContents"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/util.js");


function getBinaryContents(aFile) {
  let channel = GM_util.getChannelFromUri(GM_util.getUriFromFile(aFile));
  let input = channel.open();

  let bstream = Cc["@mozilla.org/binaryinputstream;1"]
      .createInstance(Ci.nsIBinaryInputStream);
  bstream.setInputStream(input);

  return bstream.readBytes(bstream.available());
}
