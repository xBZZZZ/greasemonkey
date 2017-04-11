const EXPORTED_SYMBOLS = ["IPCScript"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/constants.js");

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/abstractScript.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


function IPCScript(aScript, addonVersion) {
  this.addonVersion = addonVersion;
  this.author = aScript.author || "";
  this.description = aScript.description;
  this.enabled = aScript.enabled;
  this.excludes = aScript.excludes;
  this.fileURL = aScript.fileURL;
  this.grants = aScript.grants;
  this.homepage = ((aScript.homepageURL && (aScript.homepageURL != ""))
      ? aScript.homepageURL
      : null);
  this.id = aScript.id;
  this.includes = aScript.includes;
  this.lastUpdated = aScript.modifiedDate.getTime();
  this.localized = aScript.localized;
  this.name = aScript.name;
  this.namespace = aScript.namespace;
  this.needsUninstall = aScript.needsUninstall;
  this.noframes = aScript.noframes;
  this.pendingExec = {};
  this.pendingExec.length = aScript.pendingExec.length || 0;
  this.runAt = aScript.runAt;
  this.userExcludes = aScript.userExcludes;
  this.userIncludes = aScript.userIncludes;
  this.uuid = aScript.uuid;
  this.version = aScript.version;
  this.willUpdate = aScript.isRemoteUpdateAllowed();

  this.matches = aScript.matches.map(function (match) {
    return match.pattern;
  });
  this.userMatches = aScript.userMatches.map(function (match) {
    return match.pattern;
  });

  this.requires = aScript.requires.map(function (req) {
    return {
      "fileURL": req.fileURL,
    };
  });

  this.resources = aScript.resources.map(function (res) {
    return {
      "name": res.name,
      "mimetype": res.mimetype,
      "file_url": GM_util.getUriFromFile(res.file).spec,
      "gm_url": [
        GM_CONSTANTS.addonScriptProtocolScheme + ":",
        aScript.uuid,
        GM_CONSTANTS.addonScriptProtocolSeparator, res.name
      ].join(""),
    };
  });
};

IPCScript.prototype = Object.create(AbstractScript.prototype, {
  "constructor": {
    "value": IPCScript,
  },
});

IPCScript.scriptsForUrl = function (url, when, windowId) {
  let result = scripts.filter(function (script) {
    try {
      return GM_util.scriptMatchesUrlAndRuns(script, url, when);
    } catch (e) {
      // See #1692.
      // Prevent failures like that from being so severe.
      GM_util.logError(e, false, e.fileName, e.lineNumber);
      return false;
    }
  });

  return result;
};

IPCScript.prototype.info = function () {
  let resources = this.resources.map(function (res) {
    return {
      "name": res.name,
      "mimetype": res.mimetype,
      "url": res.gm_url,
    };
  });

  return {
    "script": {
      "author": this.author,
      "description": this.description,
      "excludes": this.excludes,
      "homepage": this.homepage,
      // "icon": ? source URL,
      "includes": this.includes,
      "lastUpdated": this.lastUpdated,
      "localizedDescription": this.localized.description,
      "localizedName": this.localized.name,
      "matches": this.matches,
      "name": this.name,
      "namespace": this.namespace,
      "noframes": this.noframes,
      // "requires": ? source URL,
      "resources": resources,
      "run-at": this.runAt,
      "version": this.version,
    },
    "scriptWillUpdate": this.willUpdate,
    "uuid": this.uuid,
    "version": this.addonVersion,
  };
};

var scripts = [];

function objectToScript(obj) {
  var script = Object.create(IPCScript.prototype);

  Object.keys(obj).forEach(function (k) {
    script[k] = obj[k];
  });

  Object.freeze(script);

  return script;
}

IPCScript.getByUuid = function (id) {
  return scripts.find(function (e) {
    return e.uuid == id;
  });
}

function updateData(data) {
  if (!data) {
    return undefined;
  }
  var newScripts = data.scripts.map(objectToScript);
  Object.freeze(newScripts);
  scripts = newScripts;
  Object.defineProperty(IPCScript.prototype, "globalExcludes", {
    "get": function IPCScript_getGlobalExcludes() {
      return data.globalExcludes;
    },
    "configurable": true,
    "enumerable": true,
  });
}

// Firefox 41+
// Check if initialProcessData is supported, else child will use sync message.
if (Services.cpmm.initialProcessData) {
  updateData(Services.cpmm.initialProcessData["greasemonkey:scripts-update"]);
} else {
  let results = Services.cpmm.sendSyncMessage("greasemonkey:scripts-update");
  updateData(results[0]);
}

Services.cpmm.addMessageListener(
    "greasemonkey:scripts-update", function (aMessage) {
      updateData(aMessage.data);
    });
