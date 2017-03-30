const EXPORTED_SYMBOLS = ["installScriptFromSource"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("chrome://greasemonkey-modules/content/GM_notification.js");
Cu.import("chrome://greasemonkey-modules/content/parseScript.js");
Cu.import("chrome://greasemonkey-modules/content/remoteScript.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function installScriptFromSource(aSource, aCallback) {
  var remoteScript = new RemoteScript();
  var script = parse(aSource);
  var tempFileName = cleanFilename(script.name, GM_CONSTANTS.fileScriptName)
      + GM_CONSTANTS.fileScriptExtension;
  var tempFile = GM_util.getTempFile(remoteScript._tempDir, tempFileName);

  GM_util.writeToFile(aSource, tempFile, function () {
    remoteScript.setScript(script, tempFile);
    remoteScript.download(function (aSuccess) {
      if (!aSuccess) {
        GM_notification(GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.couldNotDownloadDependencies")
            .replace("%1", remoteScript.errorMessage),
            "dependency-download-failed");
        return undefined;
      }
      remoteScript.install();
      GM_util.openInEditor(script);
      if (aCallback) {
        aCallback();
      }
    });
  });
}
