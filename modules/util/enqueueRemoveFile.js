const EXPORTED_SYMBOLS = ["enqueueRemoveFile"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");


function addEnqueuedPath(aPath) {
  let paths = getEnqueuedPaths();
  paths.push(aPath);
  GM_prefRoot.setValue("enqueuedRemovals", JSON.stringify(paths));
}

function getEnqueuedPaths() {
  return JSON.parse(GM_prefRoot.getValue("enqueuedRemovals", "[]"));
}

function removeEnqueuedPath(aPath) {
  let paths = getEnqueuedPaths();
  do {
    var i = paths.indexOf(aPath);
    if (i != -1) {
      paths.splice(i, 1);
    }
  } while (i != -1);
  GM_prefRoot.setValue("enqueuedRemovals", JSON.stringify(paths));
}

// Try to remove a file identified by path; return true for success.
function removePath(aPath, aDoEnqueueFailure) {
  let file = Cc["@mozilla.org/file/local;1"]
      .createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(aPath);
  } catch (e) {
    // Invalid path; just act like it was removed.
    return true;
  }

  if (file.exists()) {
    try {
      file.remove(false);
    } catch (e) {
      if (aDoEnqueueFailure) {
        addEnqueuedPath(aPath);
      }

      return false;
    }
  }

  return true;
}

function enqueueRemoveFile(aFile) {
  removePath(aFile.path, true);
}

// Once at start up, try to remove all enqueued paths.
(function () {
  let _enqueueRemoveFilePaths = getEnqueuedPaths();
  for (let _enqueueRemoveFileI = 0,
      _enqueueRemoveFileILen = _enqueueRemoveFilePaths.length;
      _enqueueRemoveFileI < _enqueueRemoveFileILen;
      _enqueueRemoveFileI++) {
    let _enqueueRemoveFilePath = _enqueueRemoveFilePaths[_enqueueRemoveFileI];
    if (removePath(_enqueueRemoveFilePath, false)) {
      removeEnqueuedPath(_enqueueRemoveFilePath);
    }
  }
})();
