const EXPORTED_SYMBOLS = ["ScriptRequire"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/scriptDependency.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


ScriptRequire.prototype = new ScriptDependency();
ScriptRequire.prototype.constructor = ScriptRequire;
function ScriptRequire(aScript) {
  ScriptDependency.call(this, aScript);
  this.type = "ScriptRequire";
}

Object.defineProperty(ScriptRequire.prototype, "fileURL", {
  "get": function ScriptRequire_getFileURL() {
    return GM_util.getUriFromFile(this.file).spec;
  },
  "enumerable": true,
});
