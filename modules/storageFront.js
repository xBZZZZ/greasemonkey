// The "front end" implementation of GM_ScriptStorageFront().
// This is loaded into the content process scope
// and simply delegates to the back end.

const EXPORTED_SYMBOLS = ["GM_ScriptStorageFront"];

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

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const MESSAGE_ERROR_PREFIX = "Script storage front end: ";
const CACHE_AFTER_N_GETS = 3;
const CACHE_MAX_VALUE = 4096;
const CACHE_SIZE = 1024;

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var cache = new Map();
var cacheHitCounter = new Map();

Services.cpmm.addMessageListener("greasemonkey:value-invalidate",
    function (message) {
      let data = message.data;
      data.keys.forEach(invalidateCache);
    });

function invalidateCache(key) {
  cache["delete"](key);
  cacheHitCounter["delete"](key);
}

function cacheKey(script, name) {
  return script.uuid + ":" + name;
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function GM_ScriptStorageFront(aScript, aMessageManager, aSandbox) {
  this._db = null;
  this._messageManager = aMessageManager;
  this._sandbox = aSandbox;
  this._script = aScript;
}

Object.defineProperty(GM_ScriptStorageFront.prototype, "dbFile", {
  "get": function GM_ScriptStorageFront_getDbFile() {
    throw new Error(MESSAGE_ERROR_PREFIX + "Has no DB file.");
  },
  "enumerable": true,
});

Object.defineProperty(GM_ScriptStorageFront.prototype, "db", {
  "get": function GM_ScriptStorageFront_getDb() {
    throw new Error(MESSAGE_ERROR_PREFIX + "Has no DB connection.");
  },
  "enumerable": true,
});

GM_ScriptStorageFront.prototype.close = function () {
  throw new Error(MESSAGE_ERROR_PREFIX + "Has no DB connection.");
};

GM_ScriptStorageFront.prototype.setValue = function (name, val) {
  if (2 !== arguments.length) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.args.setValue"));
  }

  let key = cacheKey(this._script, name);

  invalidateCache(key);

  if (typeof val == "undefined") {
    val = null;
  }
  this._messageManager.sendSyncMessage(
      "greasemonkey:scriptVal-set", {
        "scriptId": this._script.id,
        "name": name,
        "val": val,
      });
};

GM_ScriptStorageFront.prototype.getValue = function (name, defVal) {
  var value;

  let key = cacheKey(this._script, name);

  if (cache.has(key)) {
    value = cache.get(key);
  } else {
    let count = (cacheHitCounter.get(key) || 0) + 1;
    let intentToCache = count > CACHE_AFTER_N_GETS;

    value = this._messageManager.sendSyncMessage(
        "greasemonkey:scriptVal-get", {
          "cacheKey": key,
          "name": name,
          "scriptId": this._script.id,
          "willCache": intentToCache,
        });
    value = value.length && value[0];

    // Avoid caching large values.
    if ((typeof value === "string") && (value.length > CACHE_MAX_VALUE)) {
      count = 0;
      intentToCache = false;
    }

    try {
      value = JSON.parse(value);
    } catch (e) {
      GM_util.logError(
          MESSAGE_ERROR_PREFIX + "JSON parse error:" + "\n" + e, false,
          e.fileName, e.lineNumber);
      return defVal;
    }

    if (intentToCache) {
      // Clean caches if scripts dynamically generate lots of keys.
      if (cache.size > CACHE_SIZE) {
        cache.clear();
        cacheHitCounter.clear();
      }
      cache.set(key, value);
    }

    cacheHitCounter.set(key, count);
  }

  if (typeof defVal == "undefined") {
    defVal = undefined;
  }
  if ((value === undefined) || (value === null)) {
    return defVal;
  }

  return Cu.cloneInto(value, this._sandbox, {
    "wrapReflectors": true,
  });
};

GM_ScriptStorageFront.prototype.deleteValue = function (name) {
  let key = cacheKey(this._script, name);

  invalidateCache(key);

  this._messageManager.sendSyncMessage(
      "greasemonkey:scriptVal-delete", {
        "cacheKey": key,
        "name": name,
        "scriptId": this._script.id,
      });
};

GM_ScriptStorageFront.prototype.listValues = function () {
  var value = this._messageManager.sendSyncMessage(
      "greasemonkey:scriptVal-list", {
        "scriptId": this._script.id,
      });
  value = value.length && value[0] || [];

  try {
    value = JSON.parse(JSON.stringify(value));
    return Cu.cloneInto(value, this._sandbox, {
      "wrapReflectors": true,
    });
  } catch (e) {
    GM_util.logError(
        MESSAGE_ERROR_PREFIX + "JSON parse error?" + "\n" + e, false,
        e.fileName, e.lineNumber);
    return Cu.cloneInto([], this._sandbox);
  }
};

GM_ScriptStorageFront.prototype.getStats = function () {
  throw new Error(MESSAGE_ERROR_PREFIX + "Does not expose stats.");
};
