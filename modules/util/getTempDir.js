const EXPORTED_SYMBOLS = ["getTempDir"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


const DIRECTORY_TEMP = GM_CONSTANTS.directoryService
    .get(GM_CONSTANTS.directoryServiceTempName, Ci.nsIFile);
const DIRECTORY_TYPE = Ci.nsIFile.DIRECTORY_TYPE;

function getTempDir(aRoot) {
  let file = (aRoot || DIRECTORY_TEMP).clone();
  file.append(GM_CONSTANTS.directoryTempName);
  file.createUnique(DIRECTORY_TYPE, GM_CONSTANTS.directoryMask);

  return file;
}
