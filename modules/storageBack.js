// The "back end" implementation of GM_ScriptStorageBack().
// This is loaded into the component scope and is capable of accessing
// the file based SQL store.

const EXPORTED_SYMBOLS = ["GM_ScriptStorageBack"];

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


const MESSAGE_ERROR_PREFIX = "Script storage back end: ";

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function GM_ScriptStorageBack(script) {
  this._db = null;
  this._script = script;
}

Object.defineProperty(GM_ScriptStorageBack.prototype, "dbFile", {
  "get": function GM_ScriptStorageBack_getDbFile() {
    let file = GM_util.scriptDir();
    file.append(this._script.baseDirName + GM_CONSTANTS.fileScriptDBExtension);

    return file;
  },
  "enumerable": true,
});

Object.defineProperty(GM_ScriptStorageBack.prototype, "db", {
  "get": function GM_ScriptStorageBack_getDb() {
    if (null == this._db) {
      this._db = Services.storage.openDatabase(this.dbFile);

      // The auto_vacuum pragma has to be set before the table is created.
      this._db.executeSimpleSQL("PRAGMA auto_vacuum = INCREMENTAL;");
      this._db.executeSimpleSQL("PRAGMA incremental_vacuum(10);");
      this._db.executeSimpleSQL("PRAGMA journal_mode = MEMORY;");
      this._db.executeSimpleSQL("PRAGMA synchronous = OFF;");
      this._db.executeSimpleSQL("PRAGMA temp_store = MEMORY;");
      this._db.executeSimpleSQL("PRAGMA wal_autocheckpoint = 10;");

      this._db.executeSimpleSQL(
          "CREATE TABLE IF NOT EXISTS scriptvals ("
          + "name TEXT PRIMARY KEY NOT NULL, "
          + "value TEXT "
          + ")");

      // See #1879.
      // Run vacuum once manually to switch to the correct auto_vacuum mode
      // for databases that were created with incorrect auto_vacuum.
      this._db.executeSimpleSQL("VACUUM;");
    }
    return this._db;
  },
  "enumerable": true,
});

GM_ScriptStorageBack.prototype.close = function () {
  this._db.close();
};

GM_ScriptStorageBack.prototype.setValue = function (name, val) {
  if (2 !== arguments.length) {
    throw new Error(
        GM_CONSTANTS.localeStringBundle.createBundle(
            GM_CONSTANTS.localeGreasemonkeyProperties)
            .GetStringFromName("error.args.setValue"));
  }

  var stmt = this.db.createStatement(
      "INSERT OR REPLACE INTO scriptvals (name, value) VALUES (:name, :value)");
  try {
    stmt.params.name = name;
    stmt.params.value = JSON.stringify(val);
    stmt.execute();
  } finally {
    stmt.reset();
  }

  this._script.changed("val-set", name);
};

GM_ScriptStorageBack.prototype.getValue = function (name) {
  var value = null;
  var stmt = this.db.createStatement(
      "SELECT value FROM scriptvals WHERE name = :name");
  try {
    stmt.params.name = name;
    while (stmt.step()) {
      value = stmt.row.value;
    }
  } catch (e) {
    GM_util.logError(
        MESSAGE_ERROR_PREFIX + "getValue error:" + "\n" + e, false,
        e.fileName, e.lineNumber);
  } finally {
    stmt.reset();
  }

  return value;
};

GM_ScriptStorageBack.prototype.deleteValue = function (name) {
  var stmt = this.db.createStatement(
      "DELETE FROM scriptvals WHERE name = :name");
  try {
    stmt.params.name = name;
    stmt.execute();
  } finally {
    stmt.reset();
  }

  this._script.changed("val-del", name);
};

GM_ScriptStorageBack.prototype.listValues = function () {
  var valueNames = [];

  var stmt = this.db.createStatement("SELECT name FROM scriptvals");
  try {
    while (stmt.executeStep()) {
      valueNames.push(stmt.row.name);
    }
  } finally {
    stmt.reset();
  }

  return valueNames;
};

GM_ScriptStorageBack.prototype.getStats = function () {
  var stats = {
    "count": undefined,
    "size": undefined,
  };
  var stmt = this.db.createStatement(
      "SELECT COUNT(0) AS count, SUM(LENGTH(value)) AS size FROM scriptvals");
  try {
    while (stmt.step()) {
      stats.count = stmt.row.count;
      stats.size = stmt.row.size || 0;
    }
  } catch (e) {
    GM_util.logError(
        MESSAGE_ERROR_PREFIX + "getStats error:" + "\n" + e, false,
        e.fileName, e.lineNumber);
  } finally {
    stmt.reset();
  }

  return stats;
};
