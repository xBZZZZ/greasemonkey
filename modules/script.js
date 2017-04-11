const EXPORTED_SYMBOLS = ["Script"];

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

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

Cu.import("chrome://greasemonkey-modules/content/abstractScript.js");
Cu.import("chrome://greasemonkey-modules/content/extractMeta.js");
Cu.import("chrome://greasemonkey-modules/content/GM_notification.js");
Cu.import("chrome://greasemonkey-modules/content/ipcscript.js");
Cu.import("chrome://greasemonkey-modules/content/miscapis.js");
Cu.import("chrome://greasemonkey-modules/content/parseScript.js");
Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/scriptIcon.js");
Cu.import("chrome://greasemonkey-modules/content/scriptRequire.js");
Cu.import("chrome://greasemonkey-modules/content/scriptResource.js");
Cu.import("chrome://greasemonkey-modules/content/storageBack.js");
Cu.import("chrome://greasemonkey-modules/content/third-party/MatchPattern.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


var gGreasemonkeyVersion = "unknown";
Cu.import("resource://gre/modules/AddonManager.jsm");
AddonManager.getAddonByID(GM_CONSTANTS.addonGUID, function (addon) {
  gGreasemonkeyVersion = "" + addon.version;
});

// The <Script> element - attribute names (uppercase and lowercase letters):
// Backward compatibility
function Script(configNode) {
  this._observers = [];

  this._author = null;
  this._basedir = null;
  this._dependFail = false;
  this._dependhash = null;
  this._description = "";
  this._downloadURL = null;
  this._enabled = true;
  this._excludes = [];
  this._filename = null;
  this._grants = [];
  this._homepageURL = null;
  this._icon = new ScriptIcon(this);
  this._id = null;
  this._includes = [];
  this._installTime = null;
  // All available localized properties.
  this._locales = {};
  // The best localized matches for the current browser locale.
  this._localized = null;
  this._matches = [];
  this._modifiedTime = null;
  this._name = GM_CONSTANTS.scriptType;
  this._namespace = "";
  this._noframes = false;
  this._rawMeta = "";
  this._requires = [];
  this._resources = [];
  this._runAt = null;
  this._tempFile = null;
  this._updateMetaStatus = "unknown";
  this._updateURL = null;
  this._userExcludes = [];
  this._userIncludes = [];
  this._userMatches = [];
  this._uuid = [];
  this._version = null;

  this.availableUpdate = null;
  this.checkRemoteUpdates = AddonManager.AUTOUPDATE_DEFAULT;
  this.needsUninstall = false;
  this.parseErrors = [];
  this.pendingExec = [];

  if (configNode) {
    this._fromConfigNode(configNode);
  }
}

Script.prototype = Object.create(AbstractScript.prototype, {
  "constructor": {
    "value": Script,
  },
});

Script.prototype._changed = function (event, data) {
  let dontSave = ((event == "val-del") || (event == "val-set"));
  GM_util.getService().config._changed(this, event, data, dontSave);
};

// TODO:
// Move this method to be public rather than just aliasing it.
Script.prototype.changed = Script.prototype._changed;

Object.defineProperty(Script.prototype, "author", {
  "get": function Script_getAuthor() {
    return this._author;
  },
  "set": function Script_setAuthor(aVal) {
    this._author = aVal ? "" + aVal : "";
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "baseDirFile", {
  "get": function Script_getBaseDirFile() {
    let file = GM_util.scriptDir();
    file.append(this._basedir);
    try {
      // Can fail if this path does not exist.
      file.normalize();
    } catch (e) {
      // No-op.
      // Ignore.
    }

    return file;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "baseDirName", {
  "get": function Script_getBaseDirName() {
    return "" + this._basedir;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "dependencies", {
  "get": function Script_getDependencies() {
    let deps = this.requires.concat(this.resources);
    if (this.icon.downloadURL) {
      deps.push(this.icon);
    }

    return deps;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "description", {
  "get": function Script_getDescription() {
    return this._description;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "downloadURL", {
  "get": function Script_getDownloadUrl() {
    return this._downloadURL;
  },
  "set": function Script_setDownloadUrl(aVal) {
    this._downloadURL = aVal ? "" + aVal : "";
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "enabled", {
  "get": function Script_getEnabled() {
    return this._enabled;
  },
  "set": function Script_setEnabled(enabled) {
    this._enabled = enabled;
    this._changed("edit-enabled", enabled);
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "excludes", {
  "get": function Script_getExcludes() {
    return this._excludes.concat();
  },
  "set": function Script_setExcludes(excludes) {
    this._excludes = excludes.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "file", {
  "get": function Script_getFile() {
    let file = this.baseDirFile;
    file.append(this._filename);

    return file;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "filename", {
  "get": function Script_getFilename() {
    return this._filename;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "fileURL", {
  "get": function Script_getFileURL() {
    return GM_util.getUriFromFile(this.file).spec;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "globalExcludes", {
  "get": function Script_getGlobalExcludes() {
    return GM_util.getService().config._globalExcludes;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "grants", {
  "get": function Script_getGrants() {
    return this._grants.concat();
  },
  "set": function Script_setGrants(grants) {
    this._grants = grants.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "homepageURL", {
  "get": function Script_getHomepageUrl() {
    return this._homepageURL;
  },
  "set": function Script_setHomepageUrl(aVal) {
    this._homepageURL = aVal ? "" + aVal : "";
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "icon", {
  "get": function Script_getIcon() {
    return this._icon;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "id", {
  "get": function Script_getId() {
    if (!this._id) {
      this._id = this._namespace + "/" + this._name;
    }

    return this._id;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "includes", {
  "get": function Script_getIncludes() {
    return this._includes.concat();
  },
  "set": function Script_setIncludes(includes) {
    this._includes = includes.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "installDate", {
  "get": function Script_getInstallDate() {
    return new Date(this._installTime);
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "localized", {
  "get": function Script_getLocalizedDescription() {
    // We can't simply return this._locales[locale], as the best match for name
    // and description might be for different locales
    // (e.g. if an exact match is only provided for one of them).
    function getBestLocalization(aLocales, aProp) {
      let available = Object.keys(aLocales).filter(function (locale) {
        return !!aLocales[locale][aProp];
      });

      let bestMatch = GM_util.getBestLocaleMatch(
          GM_util.getPreferredLocale(), available);
      if (!bestMatch) {
        return null;
      }

      return aLocales[bestMatch][aProp];
    }

    if (!this._localized) {
      this._localized = {
        "description": getBestLocalization(this._locales, "description")
            || this._description,
        "name": getBestLocalization(this._locales, "name") || this._name,
      };
    }

    return this._localized;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "matches", {
  "get": function Script_getMatches() {
    return this._matches.concat();
  },
  "set": function Script_setMatches(matches) {
    let matches_MatchPattern = [];

    for (let i = 0, iLen = matches.length; i < iLen; i++) {
      let match = matches[i];
      // See property "userMatches".
      /*
      if (typeof match == "object") {
        match = match.pattern;
      }
      */
      try {
        let match_MatchPattern = new MatchPattern(match);
        matches_MatchPattern.push(match_MatchPattern);
      } catch (e) {
        GM_util.logError(GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("parse.ignoringMatch")
            .replace("%1", match).replace("%2", e), false,
            e.fileName, e.lineNumber);
      }
    }
    matches = matches_MatchPattern;

    this._matches = matches.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "modifiedDate", {
  "get": function Script_getModifiedDate() {
    return new Date(this._modifiedTime);
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "name", {
  "get": function Script_getName() {
    return this._name;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "namespace", {
  "get": function Script_getNamespace() {
    return this._namespace;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "noframes", {
  "get": function Script_getNoframes() {
    return this._noframes;
  },
  "enumerable": true,
});

// TODO:
// Remove this with pref -> db migration code.
Object.defineProperty(Script.prototype, "prefroot", {
  "get": function Script_getPrefroot() {
    if (!this._prefroot) {
      this._prefroot = ["scriptvals.", this.id, "."].join("");
    }

    return this._prefroot;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "previewURL", {
  "get": function Script_getPreviewURL() {
    return GM_CONSTANTS.ioService.newFileURI(this._tempFile).spec;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "requires", {
  "get": function Script_getRequires() {
    return this._requires.concat();
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "resources", {
  "get": function Script_getResources() {
    return this._resources.concat();
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "runAt", {
  "get": function Script_getRunAt() {
    return this._runAt;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "textContent", {
  "get": function Script_getTextContent() {
    return GM_util.getContents(this.file);
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "updateIsSecure", {
  "get": function Script_getUpdateIsSecure() {
    if (!this.downloadURL) {
      return null;
    }

    return new RegExp("^https:", "i").test(this.downloadURL);
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "updateURL", {
  "get": function Script_getUpdateURL() {
    return this._updateURL || this.downloadURL;
  },
  "set": function Script_setUpdateURL(url) {
    this._updateURL = "" + url;
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "userExcludes", {
  "get": function Script_getUserExcludes() {
    return this._userExcludes.concat();
  },
  "set": function Script_setUserExcludes(excludes) {
    this._userExcludes = excludes.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "userIncludes", {
  "get": function Script_getUserIncludes() {
    return this._userIncludes.concat();
  },
  "set": function Script_setUserIncludes(includes) {
    this._userIncludes = includes.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "userMatches", {
  "get": function Script_getUserMatches() {
    return this._userMatches.concat();
  },
  "set": function Script_setUserMatches(matches) {
    let matches_MatchPattern = [];

    for (let i = 0, iLen = matches.length; i < iLen; i++) {
      let match = matches[i];
      // A needed fix for script update (if contains userMatches).
      // See #2455.
      if (typeof match == "object") {
        match = match.pattern;
      }
      try {
        let match_MatchPattern = new MatchPattern(match);
        matches_MatchPattern.push(match_MatchPattern);
      } catch (e) {
        GM_util.logError(GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("parse.ignoringMatch")
            .replace("%1", match).replace("%2", e), false,
            e.fileName, e.lineNumber);
      }
    }
    matches = matches_MatchPattern;

    this._userMatches = matches.concat();
  },
  "configurable": true,
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "uuid", {
  "get": function Script_getUuid() {
    return this._uuid;
  },
  "enumerable": true,
});

Object.defineProperty(Script.prototype, "version", {
  "get": function Script_getVersion() {
    return this._version;
  },
  "enumerable": true,
});

Script.prototype.setFilename = function (aBaseName, aFileName) {
  this._basedir = aBaseName;
  this._filename = aFileName;

  // If this script was created from the "new script" dialog,
  // pretend it has been installed from its final location,
  // so that relative dependency paths can be resolved correctly.
  if (!this.downloadURL) {
    this.downloadURL = this.fileURL;
  }
};

Script.prototype.fixTimestampsOnInstall = function () {
  this._modifiedTime = this.file.lastModifiedTime;
  this._installTime = this.file.lastModifiedTime;
};

Script.prototype._fromConfigNode = function (node) {
  this._basedir = node.getAttribute("basedir") || ".";
  this._filename = node.getAttribute("filename");
  this.author = node.getAttribute("author") || null;
  this.downloadURL = node.getAttribute("installurl") || null;
  this.homepageURL = node.getAttribute("homepageurl") || null;
  this.updateURL = node.getAttribute("updateurl") || null;

  if (!this.fileExists(this.baseDirFile)) {
    return undefined;
  }
  if (!this.fileExists(this.file)) {
    return undefined;
  }

  if (!node.hasAttribute("dependhash")
      || !node.hasAttribute("modified")
      || !node.hasAttribute("version")) {
    let scope = {};
    Cu.import("chrome://greasemonkey-modules/content/parseScript.js", scope);
    let parsedScript = scope.parse(
        this.textContent, GM_util.getUriFromUrl(this.downloadURL));

    this._dependhash = GM_util.hash(parsedScript._rawMeta);
    this._modifiedTime = this.file.lastModifiedTime;
    this._version = parsedScript._version;

    this._changed("modified", null);
  } else {
    this._dependhash = node.getAttribute("dependhash");
    this._modifiedTime = parseInt(node.getAttribute("modified"), 10);
    this._version = node.getAttribute("version");
    if (this._version === "null") {
      this._version = null;
    }
  }

  // Note that "checkRemoteUpdates" used to be a boolean.
  // As of #1647, it now holds one of the AddonManager.AUTOUPDATE_* values;
  // so it's name is suboptimal.
  if (node.getAttribute("checkRemoteUpdates") === "true") {
    // Legacy support, cast "true" to default.
    this.checkRemoteUpdates = AddonManager.AUTOUPDATE_DEFAULT;
  } else if (node.hasAttribute("checkRemoteUpdates")) {
    this.checkRemoteUpdates = parseInt(
        node.getAttribute("checkRemoteUpdates"), 10);
  }

  if (!node.hasAttribute("installTime")) {
    this._installTime = new Date().getTime();
    this._changed("modified", null);
  } else {
    this._installTime = parseInt(node.getAttribute("installTime"), 10);
  }

  this._uuid = node.getAttribute("uuid");

  for (let i = 0, iLen = node.childNodes.length; i < iLen; i++) {
    let childNode = node.childNodes[i];
    switch (childNode.nodeName) {
      case "Description":
      case "Name":
        let lang = childNode.getAttribute("lang");
        if (!this._locales[lang]) {
          this._locales[lang] = {};
        }
        this._locales[lang][childNode.nodeName.toLowerCase()]
            = childNode.textContent;
        break;
      case "Exclude":
        this._excludes.push(childNode.textContent);
        break;
      case "Grant":
        this._grants.push(childNode.textContent);
        break;
      case "Include":
        this._includes.push(childNode.textContent);
        break;
      case "Match":
        this._matches.push(new MatchPattern(childNode.textContent));
        break;
      case "Require":
        let scriptRequire = new ScriptRequire(this);
        scriptRequire._filename = childNode.getAttribute("filename");
        this._requires.push(scriptRequire);
        break;
      case "Resource":
        let scriptResource = new ScriptResource(this);
        scriptResource._charset = childNode.getAttribute("charset");
        scriptResource._filename = childNode.getAttribute("filename");
        scriptResource._mimetype = childNode.getAttribute("mimetype");
        scriptResource._name = childNode.getAttribute("name");
        this._resources.push(scriptResource);
        break;
      case "UserExclude":
        this._userExcludes.push(childNode.textContent);
        break;
      case "UserInclude":
        this._userIncludes.push(childNode.textContent);
        break;
      case "UserMatch":
        this._userMatches.push(new MatchPattern(childNode.textContent));
        break;
    }
  }

  this.checkConfig();
  this._description = node.getAttribute("description");
  this._enabled = node.getAttribute("enabled") == "true";
  this._name = node.getAttribute("name");
  this._namespace = node.getAttribute("namespace");
  this._noframes = node.getAttribute("noframes") == "true";
  // Legacy default.
  this._runAt = node.getAttribute("runAt") || "document-end";
  this._updateMetaStatus = node.getAttribute("updateMetaStatus") || "unknown";
  this.author = node.getAttribute("author") || "";
  this.icon.fileURL = node.getAttribute("icon");
};

Script.prototype.toConfigNode = function (doc) {
  var scriptNode = doc.createElement("Script");

  function addNode(name, content) {
    let node = doc.createElement(name);
    node.appendChild(doc.createTextNode(content));
    scriptNode.appendChild(doc.createTextNode("\n\t\t"));
    scriptNode.appendChild(node);

    return node;
  }

  function addArrayNodes(aName, aArray) {
    for (let i = 0, iLen = aArray.length; i < iLen; i++) {
      let val = aArray[i];
      addNode(aName, val);
    }
  }

  function addLocaleNode(aName, aLang, aContent) {
    let node = addNode(aName, aContent);
    node.setAttribute("lang", aLang);
  }

  addArrayNodes("Exclude", this._excludes);
  addArrayNodes("Grant", this._grants);
  addArrayNodes("Include", this._includes);
  for (let j = 0, jLen = this._matches.length; j < jLen; j++) {
    addNode("Match", this._matches[j].pattern);
  }
  addArrayNodes("UserExclude", this._userExcludes);
  addArrayNodes("UserInclude", this._userIncludes);
  for (let j = 0, jLen = this._userMatches.length; j < jLen; j++) {
    addNode("UserMatch", this._userMatches[j].pattern);
  }

  for (let j = 0, jLen = this._requires.length; j < jLen; j++) {
    let require = this._requires[j];
    let requireNode = doc.createElement("Require");

    requireNode.setAttribute("filename", require._filename);

    scriptNode.appendChild(doc.createTextNode("\n\t\t"));
    scriptNode.appendChild(requireNode);
  }

  for (let j = 0, jLen = this._resources.length; j < jLen; j++) {
    let resource = this._resources[j];
    let resourceNode = doc.createElement("Resource");

    if (resource._charset) {
      resourceNode.setAttribute("charset", resource._charset);
    }
    resourceNode.setAttribute("filename", resource._filename);
    resourceNode.setAttribute("mimetype", resource._mimetype);
    resourceNode.setAttribute("name", resource._name);

    scriptNode.appendChild(doc.createTextNode("\n\t\t"));
    scriptNode.appendChild(resourceNode);
  }

  for (let lang in this._locales) {
    if (this._locales[lang].description) {
      addLocaleNode("Description", lang, this._locales[lang].description);
    }

    if (this._locales[lang].name) {
      addLocaleNode("Name", lang, this._locales[lang].name);
    }
  }

  scriptNode.appendChild(doc.createTextNode("\n\t"));

  this._author && scriptNode.setAttribute("author", this._author);
  scriptNode.setAttribute("basedir", this._basedir);
  scriptNode.setAttribute("checkRemoteUpdates", this.checkRemoteUpdates);
  scriptNode.setAttribute("dependhash", this._dependhash);
  scriptNode.setAttribute("description", this._description);
  scriptNode.setAttribute("enabled", this._enabled);
  scriptNode.setAttribute("filename", this._filename);
  scriptNode.setAttribute("installTime", this._installTime);
  scriptNode.setAttribute("modified", this._modifiedTime);
  scriptNode.setAttribute("name", this._name);
  scriptNode.setAttribute("namespace", this._namespace);
  scriptNode.setAttribute("noframes", this._noframes);
  scriptNode.setAttribute("runAt", this._runAt);
  scriptNode.setAttribute("updateMetaStatus", this._updateMetaStatus);
  scriptNode.setAttribute("uuid", this._uuid);
  scriptNode.setAttribute("version", this._version);

  if (this.downloadURL) {
    scriptNode.setAttribute("installurl", this.downloadURL);
  }
  if (this.homepageURL) {
    scriptNode.setAttribute("homepageurl", this.homepageURL);
  }
  if (this.icon.filename) {
    scriptNode.setAttribute("icon", this.icon.filename);
  }
  if (this.updateURL) {
    scriptNode.setAttribute("updateurl", this.updateURL);
  }

  return scriptNode;
};

Script.prototype.toString = function () {
  return "[Greasemonkey Script " + this.id + "; " + this.version + "]";
};

Script.prototype.setDownloadedFile = function (file) {
  this._tempFile = file;
};

Script.prototype.info = function () {
  let matches = [];
  for (let i = 0, iLen = this.matches.length; i < iLen; i++) {
    let match = this.matches[i];
    matches.push(match.pattern);
  }
  let resources = this.resources.map(function (res) {
    return {
      "name": res.name,
      "mimetype": res.mimetype,
      /*
      "file_url": GM_util.getUriFromFile(res.file).spec,
      "gm_url": [
        GM_CONSTANTS.addonScriptProtocolScheme + ":",
        aScript.uuid,
        GM_CONSTANTS.addonScriptProtocolSeparator, res.name
      ].join(""),
      */
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
      "matches": matches,
      "name": this.name,
      "namespace": this.namespace,
      "noframes": this.noframes,
      // "requires": ? source URL,
      "resources": resources,
      "run-at": this.runAt,
      "version": this.version,
    },
    "scriptMetaStr": extractMeta(this.textContent),
    "scriptSource": this.textContent,
    "scriptWillUpdate": this.isRemoteUpdateAllowed(),
    "uuid": this.uuid,
    "version": gGreasemonkeyVersion,
  };
};

Script.prototype.isModified = function () {
  if (!this.fileExists(this.file)) {
    return false;
  }
  if (this._modifiedTime != this.file.lastModifiedTime) {
    this._modifiedTime = this.file.lastModifiedTime;

    return true;
  }

  return false;
};

Script.prototype.isRemoteUpdateAllowed = function (aForced) {
  if (!this.updateURL) {
    return false;
  }
  if (!aForced) {
    if (!this.enabled) {
      return false;
    }
    if (this._modifiedTime > this._installTime) {
      return false;
    }
  }

  let scheme;
  try {
    scheme = GM_CONSTANTS.ioService.extractScheme(this.downloadURL);
  } catch (e) {
    // Invalid URL, probably an old legacy install.
    // Do not update.
    return false;
  }

  switch (scheme) {
    case "about":
    case "chrome":
    case "file":
      // These schemes are explicitly never OK.
      return false;
    case "ftp":
    case "http":
      // These schemes are OK only if the user opts in.
      return !GM_prefRoot.getValue("requireSecureUpdates");
    case "https":
      // HTTPs is always OK.
      return true;
      break;
    default:
      // Anything not listed: default to not allow.
      return false;
  }
};

Script.prototype.updateFromNewScript = function (
    newScript, url, windowId, browser) {
  // Keep a _copy_ of the old script ID, so we can eventually pass it up
  // to the Add-ons manager UI, to update this script's old entry.
  let oldScriptId = "" + this.id;

  // If the @name and/or @namespace have changed,
  // make sure they don't conflict with another installed script.
  if (newScript.id != this.id) {
    if (!GM_util.getService().config.installIsUpdate(newScript)) {
      // Empty cached values.
      this._id = null;
      this._name = newScript._name;
      this._namespace = newScript._namespace;
    } else {
      // Notify the user of the conflict.
      GM_util.alert(GM_CONSTANTS.localeStringBundle.createBundle(
          GM_CONSTANTS.localeGreasemonkeyProperties)
          .GetStringFromName("script.duplicateInstalled")
          .replace("%1", newScript._name)
          .replace("%2", newScript._namespace));
      return undefined;
    }
  }

  // Copy new values.
  // NOTE:
  // User cludes are _not_ copied. They should remain as-is.
  this._author = newScript._author;
  this._description = newScript._description;
  this._excludes = newScript._excludes;
  this._grants = newScript._grants;
  this._includes = newScript._includes;
  this._locales = newScript._locales;
  this._localized = newScript._localized;
  this._matches = newScript._matches;
  this._noframes = newScript._noframes;
  this._runAt = newScript._runAt;
  this._version = newScript._version;
  this.downloadURL = newScript.downloadURL;
  this.homepageURL = newScript.homepageURL;
  this.updateURL = newScript.updateURL;

  this.showGrantWarning();
  this.checkConfig();

  // Update add-ons manager UI.
  this._changed("modified", oldScriptId);

  let dependhash = GM_util.hash(newScript._rawMeta);
  if ((dependhash != this._dependhash) && !newScript._dependFail) {
    // Store window references for late injection.
    if (this._runAt == "document-start") {
      GM_util.logError(
          '"' + this.localized.name + '" - ID: ' + this.id
          + "\n" + "Not running at document-start; waiting for update...",
          true);
      this.pendingExec.push("document-start update");
    } else if (windowId) {
      this.pendingExec.push({
        "browser": browser,
        "url": url,
        "windowId": windowId,
      });
    }

    // Re-download dependencies.
    let scope = {};
    Cu.import("chrome://greasemonkey-modules/content/remoteScript.js", scope);
    var rs = new scope.RemoteScript(this.downloadURL);
    newScript._basedir = this._basedir;
    rs.setScript(newScript);
    rs.download(GM_util.hitch(this, function (aSuccess) {
      if (!aSuccess) {
        GM_notification(
            "(" + this.localized.name + ") " +
            rs.errorMessage, "dependency-update-failed");
        return undefined;
      }

      // Get rid of old dependencies' files.
      for (let i = 0, iLen = this.dependencies.length; i < iLen; i++) {
        let dep = this.dependencies[i];
        try {
          if (dep.file.equals(this.baseDirFile)) {
            // Bugs like an empty file name can cause "dep.file" to point
            // to the containing directory.
            // Don't remove that.
            GM_util.logError(
                '"' + this.localized.name + '"' + "\n" +
                GM_CONSTANTS.localeStringBundle.createBundle(
                GM_CONSTANTS.localeGreasemonkeyProperties)
                .GetStringFromName("script.noDeleteDirectory"));
          } else {
            dep.file.remove(true);
          }
        } catch (e) {
          // Probably a locked file.
          // Ignore, warn.
          GM_util.logError(
              '"' + this.localized.name + '"' + "\n" +
              GM_CONSTANTS.localeStringBundle.createBundle(
              GM_CONSTANTS.localeGreasemonkeyProperties)
              .GetStringFromName("script.deleteFailed")
              .replace("%1", dep), false,
              e.fileName, e.lineNumber);
        }
      }

      // Import dependencies from new script.
      this._dependhash = dependhash;
      this._icon = newScript._icon;
      this._requires = newScript._requires;
      this._resources = newScript._resources;
      // And fix those dependencies to still reference this script.
      this._icon._script = this;
      for (let i = 0, iLen = this._requires.length; i < iLen; i++) {
        let require = this._requires[i];
        require._script = this;
      }
      for (let i = 0, iLen = this._resources.length; i < iLen; i++) {
        let resource = this._resources[i];
        resource._script = this;
      }

      // Install the downloaded files.
      rs.install(this, true);

      // Inject the script in all windows that have been waiting.
      var pendingExec;
      var pendingExecAry = this.pendingExec;
      this.pendingExec = [];
      while ((pendingExec = pendingExecAry.shift())) {
        if (pendingExec == "document-start update") {
          GM_util.logError(
              '"' + this.localized.name + '" - ID: ' + this.id
              + "\n" + "...script update complete "
              + "(will run at next document-start time).",
              true);
          continue;
        }

        let shouldRun = GM_util.scriptMatchesUrlAndRuns(
            this, pendingExec.url, this.runAt);

        if (shouldRun) {
          pendingExec.browser.messageManager.sendAsyncMessage(
              "greasemonkey:inject-delayed-script", {
                "script": new IPCScript(this, gGreasemonkeyVersion),
                "windowId": pendingExec.windowId,
              });
        }
      }

      this._changed("modified");
    }));
  }
};

Script.prototype.showGrantWarning = function () {
  if ((this._grants.length != 0)
      || !GM_prefRoot.getValue("showGrantsWarning")) {
    return undefined;
  }
  let chromeWin = GM_util.getBrowserWindow();
  if (!chromeWin) {
    // Ignore, this is probably a startup issue like #2294.
    return undefined;
  }

  function muteWarnings() {
    GM_prefRoot.setValue("showGrantsWarning", false);
  }

  let primaryAction = {
    "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("warning.scriptsShouldGrant.readDocs.key"),
    "callback": function () {
        chromeWin.gBrowser.selectedTab = chromeWin.gBrowser.addTab(
            "http://wiki.greasespot.net/@grant", {
              "ownerTab": chromeWin.gBrowser.selectedTab,
            });
        muteWarnings();
    },
    "label": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("warning.scriptsShouldGrant.readDocs"),
  };
  let secondaryActions = [{
    "accessKey": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("warning.scriptsShouldGrant.dontShow.key"),
    "callback": muteWarnings,
    "label": GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("warning.scriptsShouldGrant.dontShow"),
  }];

  chromeWin.PopupNotifications.show(
      chromeWin.gBrowser.selectedBrowser,
      "greasemonkey-grants",
      "(" + this.localized.name + ") "
      + GM_CONSTANTS.localeStringBundle.createBundle(
          GM_CONSTANTS.localeGreasemonkeyProperties)
          .GetStringFromName("warning.scriptsShouldGrant"),
      null, // anchorID.
      primaryAction, secondaryActions);
};

Script.prototype.checkConfig = function () {
  // TODO:
  // Some day, make "none" the default.
  // Until then: sniff.
  if (this._grants.length == 0) {
    if (GM_prefRoot.getValue("sniffGrants")) {
      this.grants = GM_util.sniffGrants(this);
    } else {
      this.grants = ["none"];
    }
    this._changed("modified");
  }

  if (!this._uuid || !this._uuid.length) {
    this._uuid = GM_util.uuid();
    this._changed("modified");
  }
};

Script.prototype.checkForRemoteUpdate = function (aCallback, aForced) {
  if (this.availableUpdate) {
    return aCallback("updateAvailable");
  }

  let uri = GM_util.getUriFromUrl(this.updateURL).clone();

  let usedMeta = false;
  if (this._updateMetaStatus != "fail") {
    uri.path = uri.path.replace(
        GM_CONSTANTS.fileScriptExtension, GM_CONSTANTS.fileMetaExtension);
    usedMeta = true;
  }
  var url = uri.spec;

  let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
  req.overrideMimeType("application/javascript");
  if (GM_prefRoot.getValue("requireTimeoutUpdates")) {
    let timeoutUpdatesInSeconds = GM_prefRoot.getValue(
        "timeoutUpdatesInSeconds");
    timeoutUpdatesInSeconds = isNaN(parseInt(timeoutUpdatesInSeconds, 10))
        ? 45 : parseInt(timeoutUpdatesInSeconds, 10);
    timeoutUpdatesInSeconds = timeoutUpdatesInSeconds >= 1
        && timeoutUpdatesInSeconds <= 60
        ? timeoutUpdatesInSeconds : 45;
    req.timeout = timeoutUpdatesInSeconds * 1000;
  }
  try {
    req.open("GET", url, true);
  } catch (e) {
    return aCallback("noUpdateAvailable", {
      "name": this.localized.name,
      "fileURL": this.fileURL,
      "url": url,
      "info": " = " + e,
      "updateStatus": "UPDATE_STATUS_DOWNLOAD_ERROR",
      "log": true,
    });
  }

  let channel;

  // See #2425, #1824.
  /*
  try {
    channel = req.channel.QueryInterface(Ci.nsIHttpChannel);
    channel.loadFlags |= channel.LOAD_BYPASS_CACHE;
  } catch (e) {
    // Ignore.
  }
  */

  // Private browsing.
  if (req.channel instanceof Ci.nsIPrivateBrowsingChannel) {
    let isPrivate = true;
    let chromeWin = GM_util.getBrowserWindow();
    if (chromeWin && chromeWin.gBrowser) {
      // i.e. the Private Browsing autoStart pref:
      // "browser.privatebrowsing.autostart"
      isPrivate = PrivateBrowsingUtils.isBrowserPrivate(chromeWin.gBrowser);
    }
    if (isPrivate) {
      channel = req.channel.QueryInterface(Ci.nsIPrivateBrowsingChannel);
      channel.setPrivate(true);
    }
  }
  /*
  dump("Script.checkForRemoteUpdate - url:" + "\n" + url + "\n"
      + "Private browsing mode: " + req.channel.isChannelPrivate + "\n");
  */

  // Let the server know we want a user script metadata block.
  req.setRequestHeader("Accept", "text/x-userscript-meta");
  req.onload = GM_util.hitch(
      this, "checkRemoteVersion", req, aCallback, aForced, usedMeta);
  req.onerror = GM_util.hitch(null, aCallback, "noUpdateAvailable", {
    "name": this.localized.name,
    "fileURL": this.fileURL,
    "info": " = " + GM_CONSTANTS.localeStringBundle.createBundle(
        GM_CONSTANTS.localeGreasemonkeyProperties)
        .GetStringFromName("error.unknown"),
    "url": url,
    "updateStatus": "UPDATE_STATUS_DOWNLOAD_ERROR",
    // "log": true,
    "log": false,
  });
  req.ontimeout = GM_util.hitch(null, aCallback, "noUpdateAvailable", {
    "name": this.localized.name,
    "fileURL": this.fileURL,
    "url": url,
    "info": " = timeout",
    "updateStatus": "UPDATE_STATUS_TIMEOUT",
    "log": true,
  });
  try {
    req.send(null);
  } catch (e) {
    return aCallback("noUpdateAvailable", {
      "name": this.localized.name,
      "fileURL": this.fileURL,
      "url": url,
      "info": " = " + e,
      "updateStatus": "UPDATE_STATUS_DOWNLOAD_ERROR",
      "log": true,
    });
  }
};

Script.prototype.checkRemoteVersion = function (req, aCallback, aForced, aMeta) {
  let metaFail = GM_util.hitch(this, function () {
    this._updateMetaStatus = "fail";
    this._changed("modified", null);

    return this.checkForRemoteUpdate(aCallback, aForced);
  });

  if ((req.status != 200) && (req.status != 0)) {
    return (aMeta ? metaFail() : aCallback("noUpdateAvailable", {
      "name": this.localized.name,
      "fileURL": this.fileURL,
      "url": req.responseURL,
      "info": " = status: " + req.status + " (" + req.statusText + ")",
      "updateStatus": "UPDATE_STATUS_DOWNLOAD_ERROR",
      "log": true,
      "notification": true,
    }));
  }

  let source = req.responseText;
  let scope = {};
  Cu.import("chrome://greasemonkey-modules/content/parseScript.js", scope);
  let newScript = scope.parse(source, this.downloadURL);
  let remoteVersion = newScript.version;
  if (!remoteVersion) {
    return (aMeta ? metaFail() : aCallback("noUpdateAvailable", {
      "name": this.localized.name,
      "fileURL": this.fileURL,
      "url": this.downloadURL,
      "info": " = version: " + remoteVersion,
      "updateStatus": "UPDATE_STATUS_NO_ERROR",
      "log": false,
    }));
  }

  if (aMeta && (this._updateMetaStatus != "ok")) {
    this._updateMetaStatus = "ok";
    this._changed("modified", null);
  }

  let versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Ci.nsIVersionComparator);
  if (!aForced && (versionChecker.compare(this._version, remoteVersion) >= 0)) {
    return aCallback("noUpdateAvailable", {
      "name": this.localized.name,
      "fileURL": this.fileURL,
      "url": this.downloadURL,
      "info": " ; version: " + this._version + " >= " + remoteVersion,
      "updateStatus": "UPDATE_STATUS_NO_ERROR",
      "log": false,
    });
  }

  this.availableUpdate = newScript;
  this._changed("modified", null);
  aCallback("updateAvailable");
};

Script.prototype.allFiles = function () {
  let files = [];
  if (!this.baseDirFile.equals(GM_util.scriptDir())) {
    files.push(this.baseDirFile);
  }
  files.push(this.file);
  for (let i = 0, iLen = this._requires.length; i < iLen; i++) {
    let require = this._requires[i];
    files.push(require.file);
  }
  for (let i = 0, iLen = this._resources.length; i < iLen; i++) {
    let resource = this._resources[i];
    files.push(resource.file);
  }

  return files;
};

Script.prototype.fileExists = function (file) {
  try {
    return file.exists();
  } catch (e) {
    return false;
  }
};

Script.prototype.allFilesExist = function () {
  return this.allFiles().every(this.fileExists);
};

// Don't call this.
// Call Config.uninstall(), which calls this.
Script.prototype.uninstall = function (forUpdate) {
  if (typeof forUpdate == "undefined") {
    forUpdate = false;
  }

  if (this.baseDirFile.equals(GM_util.scriptDir())) {
    // If script is in the root, just remove the file.
    try {
      if (this.file.exists()) {
        this.file.remove(false);
      }
    } catch (e) {
      dump("An uninstall script - Remove failed:"
          + "\n" + this.file.path + "\n");
    }
  } else if (this.baseDirFile.exists()) {
    // If script has its own dir, remove the dir + contents.
    try {
      this.baseDirFile.remove(true);
    } catch (e) {
      dump("An uninstall script - Remove failed:"
          + "\n" + this.baseDirFile.path + "\n");
    }
  }

  if (!forUpdate) {
    let storage = new GM_ScriptStorageBack(this);
    let file = storage.dbFile;
    GM_util.enqueueRemoveFile(file);
    file.leafName += "-journal";
    GM_util.enqueueRemoveFile(file);
  }

  this._changed("uninstall", forUpdate);
};
