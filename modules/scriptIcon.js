const EXPORTED_SYMBOLS = ["ScriptIcon"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/scriptDependency.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const MIME_TYPE_DATA_IMAGE = new RegExp("^data:image\/", "i");
const MIME_TYPE_DATA = new RegExp("^data:", "i");
const URL_IMAGE_DEFAULT = "chrome://greasemonkey/skin/userscript.png";

ScriptIcon.prototype = new ScriptDependency();
ScriptIcon.prototype.constructor = ScriptIcon;
function ScriptIcon(aScript) {
  ScriptDependency.call(this, aScript);
  this.type = "ScriptIcon";
}

Object.defineProperty(ScriptIcon.prototype, "fileURL", {
  "get": function ScriptIcon_getFileURL() {
    if (this._dataURI) {
      return this._dataURI;
    } else if (this._filename) {
      return GM_util.getUriFromFile(this.file).spec;
    } else {
      return URL_IMAGE_DEFAULT;
    }
  },
  "set": function ScriptIcon_setFileURL(iconURL) {
    if (MIME_TYPE_DATA.test(iconURL)) {
      // Icon is a data scheme.
      this._dataURI = iconURL;
    } else if (iconURL) {
      // Icon is a file.
      this._filename = iconURL;
    }
  },
  "configurable": true,
  "enumerable": true,
});


ScriptIcon.prototype.setMetaVal = function (value) {
  // Accept data uri schemes for image mime types.
  if (MIME_TYPE_DATA_IMAGE.test(value)) {
    this._dataURI = value;
  } else if (MIME_TYPE_DATA.test(value)) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.icon.uriImageType"));
  } else {
    let resUri = GM_util.getUriFromUrl(this._script._downloadURL);
    this._downloadURL = GM_util.getUriFromUrl(value, resUri).spec;
  }
};
