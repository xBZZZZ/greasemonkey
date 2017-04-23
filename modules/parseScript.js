const EXPORTED_SYMBOLS = ["parse"];

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

Cu.import("chrome://greasemonkey-modules/content/extractMeta.js");
Cu.import("chrome://greasemonkey-modules/content/script.js");
Cu.import("chrome://greasemonkey-modules/content/scriptIcon.js");
Cu.import("chrome://greasemonkey-modules/content/scriptRequire.js");
Cu.import("chrome://greasemonkey-modules/content/scriptResource.js");
Cu.import("chrome://greasemonkey-modules/content/third-party/MatchPattern.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const META_SEPARATOR = "\0";

// Parse the source of a script; produce Script object.
function parse(aSource, aUri, aFailWhenMissing) {
  var meta = extractMeta(aSource).match(/.+/g);
  if (aFailWhenMissing && !meta) {
    return null;
  }

  var script = new Script();

  var scriptName = null;
  if (aUri && aUri.spec) {
    scriptName = aUri.spec;
    scriptName = scriptName.substring(
        0, scriptName.indexOf(GM_CONSTANTS.fileScriptExtension));
    scriptName = scriptName.substring(scriptName.lastIndexOf("/") + 1);
    script["_name"] = scriptName;
  }
  if (aUri) {
    script["_namespace"] = aUri.host;
    script["downloadURL"] = aUri.spec;
  }

  if (!meta) {
    setDefaults(script);
    return script;
  }

  var resourceNames = {};
  for (let i = 0, metaLine = ""; metaLine = meta[i]; i++) {
    var data;
    try {
      data = GM_util.parseMetaLine(metaLine.replace(/\s+$/, ""));
    } catch (e) {
      // Ignore invalid/unsupported meta lines.
      continue;
    }

    switch (data.keyword) {
      case "author":
      case "copyright":
        script[data.keyword] = data.value;
        break;

      case "description":
      case "name":
        let locale = data.locale;

        if (locale) {
          if (!script._locales[locale]) {
            script._locales[locale] = {};
          }
          script._locales[locale][data.keyword] = data.value;
        } else {
          if ((data.keyword == "description")
              && (script["_" + data.keyword] == "")) {
            script["_" + data.keyword] = data.value;
          }
          if ((data.keyword == "name")
            && ((script["_" + data.keyword] == GM_CONSTANTS.scriptType)
            || (script["_" + data.keyword] == scriptName))) {
            script["_" + data.keyword] = data.value;
          }
        }
        break;

      case "namespace":
      case "version":
        script["_" + data.keyword] = data.value;
        break;

      case "noframes":
        script["_" + data.keyword] = true;
        break;

      case "exclude":
        script["_excludes"].push(data.value);
        break;

      case "grant":
        script["_grants"].push(data.value);
        break;

      case "icon":
        try {
          script[data.keyword].setMetaVal(data.value);
          script["_rawMeta"] += data.keyword + META_SEPARATOR
              + data.value + META_SEPARATOR;
        } catch (e) {
          script.parseErrors.push(e.message);
        }
        break;

      case "include":
        script["_includes"].push(data.value);
        break;

      case "installURL":
        data.keyword = "downloadURL";
      case "downloadURL":
      case "homepageURL":
      case "updateURL":
        try {
          let uri = GM_util.getUriFromUrl(data.value, aUri);
          script[data.keyword] = uri.spec;
        } catch (e) {
          GM_util.logError("ParseScript - failed to parse "
              + data.keyword + ' = "' + data.value + '":' + "\n" + e, false,
              e.fileName, e.lineNumber);
        }
        break;

      case "match":
        try {
          let match = new MatchPattern(data.value);
          script._matches.push(match);
        } catch (e) {
          script.parseErrors.push(
              GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGreasemonkeyProperties)
                  .GetStringFromName("parse.ignoringMatch")
                  .replace("%1", data.value).replace("%2", e)
              );
        }
        break;

      case "require":
        try {
          let reqUri = GM_util.getUriFromUrl(data.value, aUri);
          let scriptRequire = new ScriptRequire(script);
          scriptRequire._downloadURL = reqUri.spec;
          script["_requires"].push(scriptRequire);
          script["_rawMeta"] += data.keyword + META_SEPARATOR
              + data.value + META_SEPARATOR;
        } catch (e) {
          dump("ParseScript - failed to parse "
              + data.keyword + ' = "' + data.value + '":' + "\n" + e);
          script.parseErrors.push(
              GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGreasemonkeyProperties)
                  .GetStringFromName("parse.requireFailed")
                  .replace("%1", data.value)
              );
        }
        break;

      case "resource":
        let name = data.value1;
        let url = data.value2;

        if (name in resourceNames) {
          script.parseErrors.push(
              GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGreasemonkeyProperties)
                  .GetStringFromName("parse.resourceDuplicate")
                  .replace("%1", name));
          break;
        }
        resourceNames[name] = true;

        try {
          let resUri = GM_util.getUriFromUrl(url, aUri);
          let scriptResource = new ScriptResource(script);
          scriptResource._name = name;
          scriptResource._downloadURL = resUri.spec;
          script["_resources"].push(scriptResource);
          script["_rawMeta"] += data.keyword + META_SEPARATOR
              + name + META_SEPARATOR + resUri.spec + META_SEPARATOR;
        } catch (e) {
          script.parseErrors.push(
              GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGreasemonkeyProperties)
                  .GetStringFromName("parse.resourceFailed")
                  .replace("%1", name).replace("%2", url)
              );
        }

        break;

      case "run-at":
        script["_runAt"] = data.value;
        break;

    }
  }

  setDefaults(script);
  return script;
}


function setDefaults(script) {
  if (!script.updateURL && script.downloadURL) {
    script.updateURL = script.downloadURL;
  }
  // In case of a search and replace:
  // document-end, document-idle, document-start
  if (!script._runAt || !script._runAt.match(
      new RegExp("^document-(end|idle|start)$", ""))) {
    script._runAt = "document-end";
  }
  if ((script._includes.length == 0) && (script._matches.length == 0)) {
    script._includes.push("*");
  }
}
