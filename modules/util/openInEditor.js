const EXPORTED_SYMBOLS = ["openInEditor"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

try {
  Cu.import("resource://gre/modules/devtools/scratchpad-manager.jsm");
} catch (e) {
  try {
    Cu.import("resource://devtools/client/scratchpad/scratchpad-manager.jsm");
  } catch (e) {
    try {
      // Moved in Firefox 44
      // http://hg.mozilla.org/mozilla-central/rev/397c69fa1677
      Cu.import("resource:///modules/devtools/client/scratchpad/scratchpad-manager.jsm");
    } catch (e) {
      try {
        // Moved in Firefox 44
        // http://hg.mozilla.org/mozilla-central/rev/3b90d45a2bbc
        Cu.import("resource:///modules/devtools/scratchpad-manager.jsm");
      } catch (e) {
        // Ignore.
      }
    }
  }
}

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function openInEditor(script) {
  let editor = GM_util.getEditor();
  if (!editor) {
    // Without DevTools.
    try {
      ScratchpadManager.openScratchpad({
        "filename": script.file.path,
        "text": script.textContent,
        "saved": true,
      });
    } catch (e) {
      if (GM_util.setEditor(0)) {
        openInEditor(script);
      }
    }
    return undefined;
  }

  try {
    let args = [script.file.path];

    // For the Mac, wrap with a call to "open".
    if (GM_CONSTANTS.xulRuntime.OS == "Darwin") {
      args = ["-a", editor.path, script.file.path];
      editor = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      editor.followLinks = true;
      editor.initWithPath("/usr/bin/open");
    }

    let process = Cc["@mozilla.org/process/util;1"]
        .createInstance(Ci.nsIProcess);
    process.init(editor);
    process.runw(false, args, args.length);
  } catch (e) {
    // Something may be wrong with the editor the user selected.
    // Remove so that next time they can pick a different one.
    GM_util.alert(GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGmBrowserProperties)
        .GetStringFromName("editor.couldNotLaunch")
        + "\n" + e);
    GM_prefRoot.remove("editor");
    throw e;
  }
}
