const EXPORTED_SYMBOLS = ["uuid"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;


function uuid() {
  let uuid = Cc["@mozilla.org/uuid-generator;1"]
      .getService(Ci.nsIUUIDGenerator)
      .generateUUID().toString();

  return uuid.substring(1, uuid.length - 1);
}
