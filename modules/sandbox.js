const EXPORTED_SYMBOLS = ["createSandbox", "runScriptInSandbox"];

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
Cu.import("chrome://greasemonkey-modules/content/GM_openInTab.js");
Cu.import("chrome://greasemonkey-modules/content/GM_setClipboard.js");
Cu.import("chrome://greasemonkey-modules/content/menucommand.js");
Cu.import("chrome://greasemonkey-modules/content/miscapis.js");
Cu.import("chrome://greasemonkey-modules/content/notificationer.js");
Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/storageFront.js");
Cu.import("chrome://greasemonkey-modules/content/third-party/getChromeWinForContentWin.js");
// Cu.import("chrome://greasemonkey-modules/content/third-party/GM_cookie.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");
Cu.import("chrome://greasemonkey-modules/content/xmlhttprequester.js");


// https://hg.mozilla.org/mozilla-central/file/33031c875984/js/src/jsapi.cpp#l1072
// Only a particular set of strings are allowed.
const JAVASCRIPT_VERSION_MAX = "ECMAv5";

function createSandbox(aFrameScope, aContentWin, aUrl, aScript, aRunAt) {
  let unsafeWindowDefault = "const unsafeWindow = window;";

  if (GM_util.inArray(aScript.grants, "none")) {
    // If there is an explicit none grant, use a plain unwrapped sandbox
    // with no other content.
    var contentSandbox = new Cu.Sandbox(
        aContentWin, {
          "sameZoneAs": aContentWin,
          "sandboxName": aScript.id,
          "sandboxPrototype": aContentWin,
          "wantXrays": false,
        });

    // GM_info is always provided.
    injectGMInfo(contentSandbox, aContentWin, aScript);

    // Alias unsafeWindow for compatibility.
    Cu.evalInSandbox(unsafeWindowDefault, contentSandbox);

    return contentSandbox;
  }

  var sandbox = new Cu.Sandbox(
      [aContentWin], {
        "sameZoneAs": aContentWin,
        "sandboxName": aScript.id,
        "sandboxPrototype": aContentWin,
        "wantXrays": true,
        "wantExportHelpers": true,
      });

  // http://bugzil.la/1043958
  // Note that because waivers aren't propagated between origins,
  // we need the unsafeWindow getter to live in the sandbox.
  // See also:
  // toolkit/commonjs/sdk/content/sandbox.js
  let _unsafeWindowGrant = GM_prefRoot.getValue("api.unsafeWindow.grant");
  if (!_unsafeWindowGrant || (_unsafeWindowGrant
      && GM_util.inArray(aScript.grants, "unsafeWindow"))) {
    let unsafeWindowGetter = new sandbox.Function (
        "return window.wrappedJSObject || window;");
    Object.defineProperty(sandbox, "unsafeWindow", {
      "get": unsafeWindowGetter,
    });
  } else {
    Cu.evalInSandbox(unsafeWindowDefault, sandbox);
  }

  if (GM_util.inArray(aScript.grants, "GM_addStyle")) {
    sandbox.GM_addStyle = GM_util.hitch(
        null, GM_addStyle, aContentWin, aScript.fileURL, aRunAt);
  }

  /*
  if (GM_prefRoot.getValue("api.GM_cookie")) {
    if (GM_util.inArray(aScript.grants, "GM_cookie")) {
      sandbox.GM_cookie = GM_util.hitch(
          null, GM_cookie, aContentWin, sandbox,
          aScript.fileURL, aUrl);
    }
  }
  */

  let scriptStorage = new GM_ScriptStorageFront(
      aFrameScope, aContentWin, sandbox, aScript);
  if (GM_util.inArray(aScript.grants, "GM_deleteValue")) {
    sandbox.GM_deleteValue = GM_util.hitch(scriptStorage, "deleteValue");
  }
  if (GM_util.inArray(aScript.grants, "GM_getValue")) {
    sandbox.GM_getValue = GM_util.hitch(scriptStorage, "getValue");
  }
  if (GM_util.inArray(aScript.grants, "GM_setValue")) {
    sandbox.GM_setValue = GM_util.hitch(scriptStorage, "setValue");
  }

  if (GM_util.inArray(aScript.grants, "GM_listValues")) {
    sandbox.GM_listValues = GM_util.hitch(scriptStorage, "listValues");
  }

  let scriptResources = new GM_Resources(aScript);
  if (GM_util.inArray(aScript.grants, "GM_getResourceText")) {
    sandbox.GM_getResourceText = GM_util.hitch(
        scriptResources, "getResourceText",
        aContentWin, sandbox, aScript.fileURL);
  }
  if (GM_util.inArray(aScript.grants, "GM_getResourceURL")) {
    sandbox.GM_getResourceURL = GM_util.hitch(
        scriptResources, "getResourceURL",
        aContentWin, sandbox, aScript);
  }

  if (GM_util.inArray(aScript.grants, "GM_log")) {
    sandbox.GM_log = GM_util.hitch(new GM_ScriptLogger(aScript), "log");
  }

  if (GM_util.inArray(aScript.grants, "GM_notification")) {
    sandbox.GM_notification = GM_util.hitch(
        new GM_notificationer(
            getChromeWinForContentWin(aContentWin), aContentWin, sandbox,
            aScript.fileURL, aScript.localized.name),
        "contentStart");
  }

  if (GM_util.inArray(aScript.grants, "GM_openInTab")) {
    sandbox.GM_openInTab = GM_util.hitch(null, GM_openInTab, aFrameScope, aUrl);
  }

  if (GM_util.inArray(aScript.grants, "GM_registerMenuCommand")) {
    Cu.evalInSandbox(
        "this._MenuCommandSandbox = " + MenuCommandSandbox.toSource(), sandbox);
    sandbox._MenuCommandSandbox(
        aFrameScope.content,
        aScript.uuid, aScript.localized.name, aScript.fileURL,
        MenuCommandRespond,
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.menu.callbackIsNotFunction"),
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.menu.couldNotRun"),
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.menu.invalidAccesskey"),
        MenuCommandEventNameSuffix);
    Cu.evalInSandbox(
        "delete this._MenuCommandSandbox;", sandbox);
  }

  if (GM_util.inArray(aScript.grants, "GM_setClipboard")) {
    sandbox.GM_setClipboard = GM_util.hitch(
        null, GM_setClipboard, aContentWin, aScript.fileURL);
  }

  if (GM_util.inArray(aScript.grants, "GM_xmlhttpRequest")) {
    sandbox.GM_xmlhttpRequest = GM_util.hitch(
        new GM_xmlhttpRequester(aContentWin, sandbox, aScript.fileURL, aUrl),
        "contentStartRequest");
  }

  // See #2129.
  Object.getOwnPropertyNames(sandbox).forEach(function (prop) {
    if (prop.indexOf("GM_") == 0) {
      sandbox[prop] = Cu.cloneInto(
          sandbox[prop], sandbox, {
            "cloneFunctions": true,
            "wrapReflectors": true,
          });
    }
  });

  // GM_info is always provided.
  injectGMInfo(sandbox, aContentWin, aScript);

  return sandbox;
}

function injectGMInfo(aSandbox, aContentWin, aScript) {
  let _gEnvironment = GM_util.getEnvironment();
  if (_gEnvironment.e10s
      && _gEnvironment.osMac
      && ((_gEnvironment.sandboxContentLevel != null)
          && (_gEnvironment.sandboxContentLevel > 1))) {
    return undefined;
  }

  var rawInfo = aScript.info();
  var scriptURL = aScript.fileURL;

  rawInfo.isIncognito = GM_util.windowIsPrivate(aContentWin);
  rawInfo.isPrivate = rawInfo.isIncognito;
  
  // TODO:
  // Also delay top level clone via lazy getter (XPCOMUtils.defineLazyGetter)?
  aSandbox.GM_info = Cu.cloneInto(rawInfo, aSandbox);

  var waivedInfo = Cu.waiveXrays(aSandbox.GM_info);
  var fileCache = new Map();

  function getScriptSource() {
    let content = fileCache.get("scriptSource");
    if (content === undefined) {
      content = GM_util.fileXhr(scriptURL, "application/javascript");
      fileCache.set("scriptSource", content);
    }

    return content;
  }

  function getMeta() {
    let meta = fileCache.get("meta");
    if (meta === undefined) {
      meta = extractMeta(getScriptSource());
      fileCache.set("meta", meta);
    }

    return meta;
  }

  // lazy getters for heavyweight strings that aren't sent down through IPC
  Object.defineProperty(waivedInfo, "scriptSource", {
    "get": Cu.exportFunction(getScriptSource, aSandbox),
  });

  // meta depends on content, so we need a lazy one here too
  Object.defineProperty(waivedInfo, "scriptMetaStr", {
    "get": Cu.exportFunction(getMeta, aSandbox),
  });
}

function runScriptInSandbox(aSandbox, aScript) {
  let _gEnvironment = GM_util.getEnvironment();
  if (_gEnvironment.e10s
      && _gEnvironment.osMac
      && ((_gEnvironment.sandboxContentLevel != null)
          && (_gEnvironment.sandboxContentLevel > 1))) {
    GM_util.logError(
        GM_CONSTANTS.info.scriptHandler
        + " - this configuration:"
        + "\n" + JSON.stringify(_gEnvironment)
        + "\n" + "is not supported.",
        false, aScript.fileURL, null);
    return undefined;
  }

  // Eval the code, with anonymous wrappers when/if appropriate.
  function evalWithWrapper(aUrl) {
    try {
      GM_CONSTANTS.jsSubScriptLoader.loadSubScript(
          aUrl, aSandbox, GM_CONSTANTS.fileScriptCharset);
    } catch (e) {
      // js/src/js.msg: JSMSG_BAD_RETURN_OR_YIELD
      if (e.message == "return not in function") {
        // See #1592.
        // We never anon wrap anymore,
        // unless forced to by a return not in a function.
        GM_util.logError(
            GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGreasemonkeyProperties)
                  .GetStringFromName("returnNotInFuncDeprecated"),
            true, // Is a warning.
            e.fileName,
            e.lineNumber);

        let code = GM_util.fileXhr(aUrl, "application/javascript");
        Cu.evalInSandbox(
            "(function () { " + code + "\n})()",
            aSandbox, JAVASCRIPT_VERSION_MAX, aUrl, 1);
      } else {
        // Otherwise raise.
        throw e;
      }
    }
  }

  // Eval the code, with a try/catch to report errors cleanly.
  function evalWithCatch(aUrl) {
    try {
      evalWithWrapper(aUrl);
    } catch (e) {
      // Log it properly.
      GM_util.logError(e, false, e.fileName, e.lineNumber);
      // Stop the script, in the case of requires, as if it was one big script.
      return false;
    }
    return true;
  }

  for (let i = 0, iLen = aScript.requires.length; i < iLen; i++) {
    let require = aScript.requires[i];
    if (!evalWithCatch(require.fileURL)) {
      return undefined;
    }
  }
  evalWithCatch(aScript.fileURL);
}
