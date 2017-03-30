const EXPORTED_SYMBOLS = ["GM_PrefManager", "GM_prefRoot"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/constants.js");


/**
 * Simple API on top of preferences for greasemonkey.
 * Construct an instance by passing the startPoint of a preferences subtree.
 * "greasemonkey." prefix is assumed.
 */
function GM_PrefManager(startPoint) {
  startPoint = "extensions.greasemonkey." + (startPoint || "");

  this.pref = Cc["@mozilla.org/preferences-service;1"]
      .getService(Ci.nsIPrefService)
      .getBranch(startPoint);

  this.observers = new Map();
};

GM_PrefManager.prototype.MIN_INT_32 = -0x80000000;
GM_PrefManager.prototype.MAX_INT_32 = 0x7FFFFFFF;
GM_PrefManager.prototype.nsISupportsString = Ci.nsISupportsString;

/**
 * Whether a preference exists.
 */
GM_PrefManager.prototype.exists = function (prefName) {
  return this.pref.getPrefType(prefName) != 0;
};

/**
 * Enumerate preferences.
 */
GM_PrefManager.prototype.listValues = function () {
  return this.pref.getChildList("", {});
};

/**
 * Returns the named preference, or defaultValue if it does not exist.
 */
GM_PrefManager.prototype.getValue = function (prefName, defaultValue) {
  var prefType = this.pref.getPrefType(prefName);

  // underlying preferences object throws an exception if pref doesn't exist
  if (prefType == this.pref.PREF_INVALID) {
    return defaultValue;
  }

  try {
    switch (prefType) {
      case this.pref.PREF_STRING:
        return this.pref.getComplexValue(prefName, this.nsISupportsString).data;
      case this.pref.PREF_BOOL:
        return this.pref.getBoolPref(prefName);
      case this.pref.PREF_INT:
        return this.pref.getIntPref(prefName);
    }
  } catch(e) {
    return defaultValue != undefined ? defaultValue : null;
  }

  return null;
};

/**
 * Sets the named preference to the specified value. values must be booleans,
 * integers, or strings.
 */
GM_PrefManager.prototype.setValue = function (prefName, value) {
  let prefType = typeof value;
  let goodType = false;

  switch (prefType) {
    case "boolean":
    case "string":
      goodType = true;
      break;
    case "number":
      if (((value % 1) == 0)
          && (value >= this.MIN_INT_32)
          && (value <= this.MAX_INT_32)) {
        goodType = true;
      }
      break;
  }

  if (!goodType) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.args.getValue"));
  }

  // Underlying preferences object throws an exception if new pref has
  // a different type than old one. i think we should not do this,
  // so delete old pref first if this is the case.
  if (this.exists(prefName) && (typeof this.getValue(prefName) != prefType)) {
    this.remove(prefName);
  }

  // set new value using correct method
  switch (prefType) {
    case "boolean":
      this.pref.setBoolPref(prefName, value);
      break;
    case "number":
      this.pref.setIntPref(prefName, Math.floor(value));
      break;
    case "string":
      let str = Cc["@mozilla.org/supports-string;1"]
          .createInstance(this.nsISupportsString);
      str.data = value;
      this.pref.setComplexValue(prefName, this.nsISupportsString, str);
      break;
  }
};

/**
 * Deletes the named preference or subtree.
 */
GM_PrefManager.prototype.remove = function (prefName) {
  this.pref.deleteBranch(prefName);
};

/**
 * Call a function whenever the named preference subtree changes.
 */
GM_PrefManager.prototype.watch = function (prefName, watcher) {
  // Construct an observer.
  let observer = {
    "observe": function (subject, topic, prefName) {
      watcher(prefName);
    },
  };

  // Store the observer in case we need to remove it later.
  this.observers.set(watcher, observer);

  this.pref.QueryInterface(Ci.nsIPrefBranchInternal)
      .addObserver(prefName, observer, false);
};

/**
 * Stop watching.
 */
GM_PrefManager.prototype.unwatch = function (prefName, watcher) {
  let obs = this.observers.get(watcher);
  if (obs) {
    this.observers.delete(watcher);
    this.pref.QueryInterface(Ci.nsIPrefBranchInternal)
        .removeObserver(prefName, obs);
  }
};

var GM_prefRoot = new GM_PrefManager();
