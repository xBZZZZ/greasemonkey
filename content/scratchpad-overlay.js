window.addEventListener("load", function () {
  if (typeof Cc === "undefined") {
    let Cc = Components.classes;
  }
  if (typeof Ci === "undefined") {
    let Ci = Components.interfaces;
  }
  if (typeof Cu === "undefined") {
    let Cu = Components.utils;
  }

  Cu.import("chrome://greasemonkey-modules/content/constants.js");


  const FILE_SCRIPT_EXTENSION_REGEXP = new RegExp(
      GM_CONSTANTS.fileScriptExtensionRegexp + "$", ""); 

  let args = window.arguments;
  if (!args) {
    return undefined;
  }
  if (!(args[0] instanceof Ci.nsIDialogParamBlock)) {
    return undefined;
  }
  args = args[0].GetString(1);
  if (!args) {
    return undefined;
  }
  args = JSON.parse(args);
  if (!args.filename) {
    return undefined;
  }
  if (!FILE_SCRIPT_EXTENSION_REGEXP.test(args.filename)) {
    return undefined;
  }

  Cu.import("chrome://greasemonkey-modules/content/util.js");

  // If we're opening a user script:
  // Put the cursor at the top.
  // See #1708.
  // Remove when http://bugzil.la/843597 is fixed.
  var initializeCheckCount = 0;
  var initializeCheckTimer = null;
  function moveCursorToTop() {
    if (initializeCheckCount > 50) {
      GM_util.logError(
          "Greasemonkey - Gave up waiting for Scratchpad.initialized.");
      clearInterval(initializeCheckTimer);
    }
    initializeCheckCount++;

    if (!Scratchpad.initialized) {
      return undefined;
    }

    Scratchpad.editor.setCursor({
      "line": 0,
      "ch": 0,
    });

    clearInterval(initializeCheckTimer);
  }
  initializeCheckTimer = setInterval(moveCursorToTop, 20);

  // Hide all the elements which don't make sense when editing a script.
  // See #1771 and #1774.
  function setNodeAttr(aId, aAttr, aVal) {
    let el = document.getElementById(aId);
    if (el) {
      el.setAttribute(aAttr, aVal);
    }
  }

  setNodeAttr("sp-execute-menu", "collapsed", true);
  setNodeAttr("sp-environment-menu", "collapsed", true);
  setNodeAttr("sp-toolbar-run", "collapsed", true);
  setNodeAttr("sp-toolbar-inspect", "collapsed", true);
  setNodeAttr("sp-toolbar-display", "collapsed", true);

  // Plus the keyboard shortcuts for them.
  setNodeAttr("sp-key-run", "disabled", true);
  setNodeAttr("sp-key-inspect", "disabled", true);
  setNodeAttr("sp-key-display", "disabled", true);
  setNodeAttr("sp-key-evalFunction", "disabled", true);
  setNodeAttr("sp-key-reloadAndRun", "disabled", true);

  // But the context menu items can't be accessed by ID (?!) so iterate.
  let textPopup = document.getElementById("scratchpad-text-popup");
  if (textPopup) {
    for (let i = 0, iLen = textPopup.childNodes.length; i < iLen; i++) {
      let node = textPopup.childNodes[i];
      if (node.id == "sp-text-run") {
        node.collapsed = true;
        if (node.previousSibling && (node.previousSibling.tagName.toLowerCase()
            == "menuseparator")) {
          node.previousSibling.collapsed = true;
        }
      }
      if (node.id == "sp-text-inspect") {
        node.collapsed = true;
      }
      if (node.id == "sp-text-display") {
        node.collapsed = true;
      }
      if (node.id == "sp-text-evalFunction") {
        node.collapsed = true;
      }
      if (node.id == "sp-text-reloadAndRun") {
        node.collapsed = true;
        if (node.previousSibling && (node.previousSibling.tagName.toLowerCase()
            == "menuseparator")) {
          node.previousSibling.collapsed = true;
        }
      }
    }
  }
}, true);
