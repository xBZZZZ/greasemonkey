const EXPORTED_SYMBOLS = ["getEditor"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function getEditor() {
  let editorPath = GM_prefRoot.getValue("editor");
  if (!editorPath) {
    return null;
  }

  let editor = null;
  try {
    editor = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    editor.followLinks = true;
    editor.initWithPath(editorPath);
  } catch (e) {
    GM_util.logError(e, false, e.fileName, e.lineNumber);
  }

  // Make sure the editor preference is still valid.
  if (!editor || !editor.exists() || !editor.isExecutable()) {
    GM_prefRoot.remove("editor");
    editor = null;
  }

  return editor;
}
