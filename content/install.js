if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const HTML_NS = "http://www.w3.org/1999/xhtml";

var gRemoteScript = window.arguments[0].wrappedJSObject[0];
var gBrowser = window.arguments[0].wrappedJSObject[1];
var gScript = window.arguments[0].wrappedJSObject[2];

var gAcceptButton = null;
var gCurrentDelay = null;
var gProgress = 0;
var gShowScriptButton = null;
var gTimer = null;
var gTotalDelay = new GM_PrefManager().getValue("installDelay", 5);

function init() {
  setUpIncludes("includes", "includes-label", "includes-desc",
      gScript.includes);
  setUpIncludes("excludes", "excludes-label", "excludes-desc",
      gScript.excludes);

  let matches = [];
  for (let i = 0, iLen = gScript.matches.length; i < iLen; i++) {
    let match = gScript.matches[i];
    matches.push(match.pattern);
  }
  setUpIncludes("matches", "matches-label", "matches-desc", matches);

  gShowScriptButton = document.documentElement.getButton("extra1");
  gAcceptButton = document.documentElement.getButton("accept");
  gAcceptButton.baseLabel = gAcceptButton.label;

  startTimer();
  gShowScriptButton.disabled = true;

  let bundle = document.getElementById("gm-browser-bundle");

  document.getElementById("heading").appendChild(
      document.createTextNode(bundle.getString("greeting.msg")));

  let desc = document.getElementById("scriptDescription");
  desc.appendChild(document.createElementNS(HTML_NS, "strong"));
  desc.firstChild.appendChild(document.createTextNode(gScript.localized.name));
  if (gScript.version) {
    desc.appendChild(document.createTextNode(" " + gScript.version));
  }
  desc.appendChild(document.createElementNS(HTML_NS, "br"));
  desc.appendChild(document.createTextNode(gScript.localized.description));

  if (gRemoteScript.done) {
    // Download finished before we could open, fake a progress event.
    onProgress(null, null, 1);
  } else {
    // Otherwise, listen for future progress events.
    gRemoteScript.onProgress(onProgress);
  }
}

function onBlur(e) {
  stopTimer();
}

function onCancel() {
  gRemoteScript.cancel();
  window.close();
}

function onFocus(e) {
  startTimer();
}

function onInterval() {
  gCurrentDelay--;
  updateLabel();

  if (gCurrentDelay == 0) {
    stopTimer();
  }
}

function onOk() {
  // Stops multiple pressing of the button.
  gAcceptButton.disabled = true;
  gRemoteScript.install();
  window.setTimeout(window.close, 0);
}

function onProgress(aRemoteScript, aEventType, aData) {
  // Lingering download after window cancel.
  if (!document) {
    return undefined;
  }
  gProgress = Math.floor(100 * aData);
  if (gRemoteScript.done) {
    gShowScriptButton.disabled = false;

    document.getElementById("loading").style.display = "none";
    if (gRemoteScript.errorMessage) {
      gShowScriptButton.disabled = true;
      document.getElementById("dialogContentBox").style.display = "none";
      document.getElementById("errorContentBox").style.display = "-moz-box";
      document.getElementById("errorMessage")
          .textContent = gRemoteScript.errorMessage;
      stopTimer();
      updateLabel(false);
      return undefined;
    }
  } else {
    document.getElementById("progressmeter").setAttribute("value", gProgress);
  }
  updateLabel();
}

function onShowSource() {
  gRemoteScript.showSource(gBrowser);
  window.setTimeout(window.close, 0);
}

function pauseTimer() {
  stopTimer();
  gCurrentDelay = gTotalDelay;
  updateLabel();
}

function setUpIncludes(aBox, aLabel, aDesc, aIncludes) {
  if (aIncludes.length > 0) {
    document.getElementById(aBox).style.display = "block";
    document.getElementById(aLabel).style.display = "block";
    aDesc = document.getElementById(aDesc);

    for (let i = 0, iLen = aIncludes.length; i < iLen; i++) {
      aDesc.appendChild(document.createTextNode(aIncludes[i]));
      aDesc.appendChild(document.createElementNS(HTML_NS, "br"));
    }

    aDesc.removeChild(aDesc.lastChild);
  }
}

function startTimer() {
  gCurrentDelay = gTotalDelay;
  updateLabel();

  gTimer = window.setInterval(onInterval, 500);
}

function stopTimer() {
  if (gTimer) {
    window.clearInterval(gTimer);
  }
  gCurrentDelay = 0;
}

function updateLabel(aOkAllowed) {
  if (typeof aOkAllowed == "undefined") {
    aOkAllowed = true;
  }

  if (gCurrentDelay > 0) {
    gAcceptButton.focus();
    gAcceptButton.label = gAcceptButton.baseLabel + " (" + gCurrentDelay + ")";
  } else {
    gAcceptButton.label = gAcceptButton.baseLabel;
  }

  /*
  Part 1/3 (remoteScript.js - Part 2/3 and 3/3).
  Sometimes - throws an errors:
    NS_ERROR_FILE_IS_LOCKED: Component returned failure code:
      0x8052000e (NS_ERROR_FILE_IS_LOCKED) [nsIFile.moveTo]
      remoteScript.js:394:0
    NS_ERROR_FILE_NOT_FOUND: Component returned failure code:
      0x80520012 (NS_ERROR_FILE_NOT_FOUND) [nsIFile.lastModifiedTime]
      script.js:474:0
    TypeError: this._tempDir is null
      remoteScript.js:394:4
  Especially if it contains many requires and resources
  and if the button "Install" is pressed too soon.
  gRemoteScript.done: This parameter also must be verified.
  */
  let disabled = aOkAllowed
      ? ((gCurrentDelay > 0) || (gProgress < 100) || !gRemoteScript.done)
      : true;
  gAcceptButton.disabled = disabled;
}

// See: closewindow.xul.
function GM_onClose() {
  gRemoteScript.cleanup();
}
