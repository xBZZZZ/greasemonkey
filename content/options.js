Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('chrome://greasemonkey-modules/content/prefmanager.js');
Components.utils.import('chrome://greasemonkey-modules/content/util.js');

// var gPalemoonId = "{8de7fcbb-c55c-4fbe-bfc5-fc555c87dbc4}";
var gFirefoxId = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";


function GM_loadOptions() {
  document.getElementById("check-sync")
      .setAttribute("label", document.getElementById("check-sync")
      .getAttribute("label")
      .replace(/Pale\s*Moon/i, (
      (Services.appinfo.ID == gFirefoxId)
          ? "Firefox"
          : "$&")
      ));
  document.getElementById('secure-update')
      .checked = GM_prefRoot.getValue('requireSecureUpdates');
  document.getElementById('submit-stats')
      .checked = GM_prefRoot.getValue('stats.optedin');
  document.getElementById('globalExcludes')
      .pages = GM_util.getService().config.globalExcludes;
  document.getElementById('newScript-removeUnused')
      .checked = GM_prefRoot.getValue('newScript.removeUnused');
  document.getElementById('newScript-template')
      .value = GM_prefRoot.getValue('newScript.template');
}

function GM_saveOptions(checkbox) {
  GM_prefRoot.setValue('sync.enabled',
      !!document.getElementById('check-sync').checked);
  GM_prefRoot.setValue('requireSecureUpdates',
      !!document.getElementById('secure-update').checked);
  GM_prefRoot.setValue('stats.optedin',
      !!document.getElementById('submit-stats').checked);
  GM_util.getService().config.globalExcludes =
      document.getElementById('globalExcludes').pages;
  GM_prefRoot.setValue('newScript.removeUnused',
      !!document.getElementById('newScript-removeUnused').checked);
  GM_prefRoot.setValue('newScript.template',
      document.getElementById('newScript-template').value);
  // Changes to global excludes should be active after tab reload.
  Services.cpmm.sendAsyncMessage("greasemonkey:broadcast-script-updates");
}
