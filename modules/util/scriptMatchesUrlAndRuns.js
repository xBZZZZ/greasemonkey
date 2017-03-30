const EXPORTED_SYMBOLS = ["scriptMatchesUrlAndRuns"];


function scriptMatchesUrlAndRuns(script, url, when) {
  return !script.pendingExec.length
      && script.enabled
      && !script.needsUninstall
      && ((when == script.runAt) || (when == "any"))
      && script.matchesURL(url);
}
