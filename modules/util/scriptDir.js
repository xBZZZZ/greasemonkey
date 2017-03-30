const EXPORTED_SYMBOLS = ["scriptDir"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


const DIRECTORY_SCRIPT = GM_CONSTANTS.directoryService
    .get(GM_CONSTANTS.directoryServiceScriptName, Ci.nsIFile);
const DIRECTORY_TYPE = Ci.nsIFile.DIRECTORY_TYPE;

DIRECTORY_SCRIPT.append(GM_CONSTANTS.directoryScriptsName);
if (!DIRECTORY_SCRIPT.exists()) {
  DIRECTORY_SCRIPT.create(
      DIRECTORY_TYPE,
      GM_CONSTANTS.directoryMask);
}
// In case of symlinks.
DIRECTORY_SCRIPT.normalize();

function scriptDir() {
  return DIRECTORY_SCRIPT.clone();
}
