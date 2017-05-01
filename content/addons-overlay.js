// This file is concerned with altering the Firefox 4+ AOM window,
// for those sorts of functionality we want that the API does not handle.
// (As opposed to addons4.jsm which is responsible
// for what the API does handle.)
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

(function private_scope() {
Cu.import("resource://gre/modules/AddonManager.jsm");

Cu.import("chrome://greasemonkey-modules/content/addons.js");
Cu.import("chrome://greasemonkey-modules/content/prefmanager.js");
Cu.import("chrome://greasemonkey-modules/content/third-party/droppedUrls.js");
Cu.import("chrome://greasemonkey-modules/content/util.js");


const SORT_BY = {
  "valueDef": "uiState,name",
  "checkStateReverse": "!",
  "checkStateValueAscending": "2",
  "checkStateValueDescending": "1",
};

window.addEventListener("focus", focus, false);
window.addEventListener("load", init, false);
window.addEventListener("unload", unload, false);

// Patch the default createItem() to add our custom property.
var _createItemOrig = createItem;
createItem = function GM_createItem(aObj, aIsInstall, aIsRemote) {
  let item = _createItemOrig(aObj, aIsInstall, aIsRemote);
  if (aObj.type == GM_CONSTANTS.scriptAddonType) {
    // Save a reference to this richlistitem on the Addon object,
    // so we can fix attributes if/when it changes.
    aObj.richlistitem = item;
    setRichlistitemNamespace(aObj);
    setRichlistitemExecutionIndex(aObj);
  }

  return item;
};

// Patch the default onDrop() to make user script installation work.
var _gDragDrop_onDrop_Orig = gDragDrop.onDrop;
gDragDrop.onDrop = function GM_onDrop(aEvent) {
  let urls = droppedUrls(aEvent);

  let droppedNonUserScript = false;
  for (let i = urls.length - 1, url = null; url = urls[i]; i--) {
    if (url.match(
        new RegExp(GM_CONSTANTS.fileScriptExtensionRegexp + "$", ""))) {
      GM_util.showInstallDialog(url);
    } else {
      droppedNonUserScript = true;
    }
  }

  // Pass call through to the original handler,
  // if any non-user-script was part of this drop action.
  if (droppedNonUserScript) {
    _gDragDrop_onDrop_Orig(aEvent);
  }
  else {
    aEvent.preventDefault();
  }
};

// Set up an "observer" on the config, to keep the displayed items up to date
// with their actual state.
var observer = {
  "notifyEvent": function observer_notifyEvent(script, event, data) {
    if (!isScriptView()) {
      return undefined;
    }

    var addon = ScriptAddonFactoryByScript(script);
    let item;
    switch (event) {
      case "edit-enabled":
        item = gListView.getListItemForID(addon.id);
        let callback = data ? item.onEnabled : item.onDisabled;
        if (!callback) {
          // This observer triggers in the case of an uninstall undo.
          // But does not need to - and can not - run.
          // Ignore this case.
          break;
        }
        item.userDisabled = !data;
        callback.call(item);

        break;
      case "install":
        gListView.addItem(addon);

        break;
      case "modified":
        if (!data) {
          break;
        }
        var oldAddon = ScriptAddonFactoryByScript({
          "id": data,
        });
        if (!oldAddon) {
          break;
        }
        addon = ScriptAddonFactoryByScript(script, true);

        // Use old and new the addon references to update the view.
        item = createItem(addon);
        let oldItem = gListView.getListItemForID(oldAddon.id);
        oldItem.parentNode.replaceChild(item, oldItem);

        break;
      case "uninstall":
        if (!data) {
          // In this observer context, "data" is a boolean,
          // true means the uninstall happened "for update".
          // If it was _not_ for update, remove this item from the UI.
          gListView.removeItem(addon);
        }

        break;
    }

    setEmptyWarningVisible();
  },
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function addonIsInstalledScript(aAddon) {
  if (!aAddon) {
    return false;
  }
  if (aAddon.type != GM_CONSTANTS.scriptAddonType) {
    return false;
  }
  if (aAddon._script.needsUninstall) {
    return false;
  }
  return true;
};

function isScriptView() {
  return gViewController.currentViewId == GM_CONSTANTS.scriptViewID;
}

function addonExecutesNonFirst(aAddon) {
  if (!aAddon) {
    return false;
  }
  if (aAddon.type != GM_CONSTANTS.scriptAddonType) {
    return false;
  }
  return 0 != aAddon.executionIndex;
}

function addonExecutesNonLast(aAddon) {
  if (!aAddon) {
    return false;
  }
  if (aAddon.type != GM_CONSTANTS.scriptAddonType) {
    return false;
  }
  return (GM_util.getService().config.scripts.length - 1)
      != aAddon.executionIndex;
}

function addonUpdateCanBeForced(aAddon) {
  if (!aAddon) {
    return false;
  }
  if (aAddon.type != GM_CONSTANTS.scriptAddonType) {
    return false;
  }
  let script = aAddon._script;
  // Can be forced if non-forced isn't allowed, but forced is.
  return !script.isRemoteUpdateAllowed(false)
      && script.isRemoteUpdateAllowed(true);
}

function sortedByExecOrder() {
  return document.getElementById("greasemonkey-sort-bar")
      .getElementsByAttribute("sortBy", "executionIndex")[0]
      .hasAttribute("checkState");
};

function focus() {
  // When the window gains focus, it might be from switching to an editor
  // and back, so scan for updated scripts.
  let config = GM_util.getService().config;
  config.updateModifiedScripts("document-start", null);
  config.updateModifiedScripts("document-end", null);
  config.updateModifiedScripts("document-idle", null);
}

function init() {
  GM_util.getService().config.addObserver(observer);

  gViewController.commands.cmd_userscript_edit = {
      "isEnabled": addonIsInstalledScript,
      "doCommand": function (aAddon) {
        GM_util.openInEditor(aAddon._script);
      }
    };
  gViewController.commands.cmd_userscript_show = {
      "isEnabled": addonIsInstalledScript,
      "doCommand": function (aAddon) {
        GM_openFolder(aAddon._script.file);
      }
    };

  gViewController.commands.cmd_userscript_execute_first = {
      "isEnabled": addonExecutesNonFirst,
      "doCommand": function (aAddon) {
        reorderScriptExecution(aAddon, -9999);
      }
    };
  gViewController.commands.cmd_userscript_execute_sooner = {
      "isEnabled": addonExecutesNonFirst,
      "doCommand": function (aAddon) {
        reorderScriptExecution(aAddon, -1);
      }
    };
  gViewController.commands.cmd_userscript_execute_later = {
      "isEnabled": addonExecutesNonLast,
      "doCommand": function (aAddon) {
        reorderScriptExecution(aAddon, 1);
      }
    };
  gViewController.commands.cmd_userscript_execute_last = {
      "isEnabled": addonExecutesNonLast,
      "doCommand": function (aAddon) {
        reorderScriptExecution(aAddon, 9999);
      }
    };

  gViewController.commands.cmd_userscript_forcedFindItemUpdates = {
      "isEnabled": addonUpdateCanBeForced,
      "doCommand": function (aAddon) {
        let result = confirm(
            GM_CONSTANTS.localeStringBundle.createBundle(
                  GM_CONSTANTS.localeGmAddonsProperties)
                  .GetStringFromName("confirmForceUpdate"));
        if (result) {
          aAddon.forceUpdate = true;
          gViewController.commands.cmd_findItemUpdates.doCommand(aAddon);
          aAddon.forceUpdate = false;
        }
      }
  };

  window.addEventListener("ViewChanged", onViewChanged, false);
  // Initialize on load as well as when it changes later.
  onViewChanged();

  document.getElementById("greasemonkey-sort-bar").addEventListener(
      "command", onSortersClicked, false);
  applySort();
};

function getSortBy(aButtons) {
  let sortBy = GM_prefRoot.getValue("sortBy", SORT_BY.valueDef);
  let sortByValue = sortBy.replace(SORT_BY.checkStateReverse, "");
  let sortByCheckStateAscending =
      !(sortBy.substring(0, 1) == SORT_BY.checkStateReverse);

  // Remove checkState from all buttons.
  for (let i = 0, iLen = aButtons.length; i < iLen; i++) {
    let el = aButtons[i];
    el.removeAttribute("checkState");
  }

  let button = null;
  for (let i = 0, iLen = aButtons.length; i < iLen; i++) {
    button = aButtons[i];
    if (button.getAttribute("sortBy") == sortByValue) {
      button.setAttribute("checkState",
      (sortByCheckStateAscending
          ? SORT_BY.checkStateValueAscending
          : SORT_BY.checkStateValueDescending));
      break;
    }
  }

  return button;
}

function setSortBy(button) {
  let ascending = SORT_BY.checkStateValueDescending
      != button.getAttribute("checkState");

  GM_prefRoot.setValue(
      "sortBy",
      (!ascending ? SORT_BY.checkStateReverse : "")
      + button.getAttribute("sortBy"));
}

function onSortersClicked(aEvent) {
  if (aEvent.target.tagName != "button") {
    return undefined;
  }
  let button = aEvent.target;

  let checkState = button.getAttribute("checkState");

  // Remove checkState from all buttons.
  let buttons = document.getElementById("greasemonkey-sort-bar")
      .getElementsByTagName("button");
  for (let i = 0, el = null; el = buttons[i]; i++) {
    el.removeAttribute("checkState");
  }

  // Toggle state of this button.
  if (checkState == SORT_BY.checkStateValueAscending) {
    button.setAttribute("checkState", SORT_BY.checkStateValueDescending);
  } else {
    button.setAttribute("checkState", SORT_BY.checkStateValueAscending);
  }

  setSortBy(button);

  applySort();
};

function applySort() {
  if (gViewController.currentViewId != GM_CONSTANTS.scriptViewID) {
    return undefined;
  }

  // Find checked button.
  let buttons = document.getElementById("greasemonkey-sort-bar")
      .getElementsByTagName("button");
  getSortBy(buttons);
  let button = null;
  for (let i = 0; button = buttons[i]; i++) {
    if (button.hasAttribute("checkState")) {
      break;
    }
  }

  let ascending = SORT_BY.checkStateValueDescending
      != button.getAttribute("checkState");
  let sortBy = button.getAttribute("sortBy").split(",");

  setSortBy(button);

  let list = document.getElementById("addon-list");
  let elements = Array.slice(list.childNodes, 0);
  sortElements(elements, sortBy, ascending);
  while (list.lastChild) {
    list.removeChild(list.lastChild);
  }
  elements.forEach(function (el) {
    list.appendChild(el);
  });
};

function onViewChanged(aEvent) {
  if (gViewController.currentViewId == GM_CONSTANTS.scriptViewID) {
    document.documentElement.classList.add("greasemonkey");
    setEmptyWarningVisible();
    applySort();
  } else {
    document.documentElement.classList.remove("greasemonkey");
  }
};

function setEmptyWarningVisible() {
  let emptyWarning = document.getElementById("user-script-list-empty");
  emptyWarning.collapsed = !!GM_util.getService().config.scripts.length;
}

function selectScriptExecOrder() {
  if (sortedByExecOrder()) {
    return undefined;
  }

  let button = document.getElementById("greasemonkey-sort-bar")
      .getElementsByAttribute("sortBy", "executionIndex")[0];
  // Sort the script list by execution order.
  onSortersClicked({
    "target": button,
  });
};

function reorderScriptExecution(aAddon, aMoveBy) {
  selectScriptExecOrder();
  GM_util.getService().config.move(aAddon._script, aMoveBy);
  AddonManager.getAddonsByTypes(
      [GM_CONSTANTS.scriptAddonType], function (aAddons) {
    // Fix all the "executionOrder" attributes.
    for (let i = 0, iLen = aAddons.length; i < iLen; i++) {
      let addon = aAddons[i];
      setRichlistitemExecutionIndex(addon);
    }
    // Re-sort the list, with these fixed attributes.
    applySort();
    // Ensure the selected element is still visible.
    let richlistbox = document.getElementById("addon-list");
    richlistbox.ensureElementIsVisible(richlistbox.currentItem);
  });
};

function setRichlistitemExecutionIndex(aAddon) {
  aAddon.richlistitem.setAttribute("executionIndex",
      // String format with leading zeros, so it will sort properly.
      ("0000" + aAddon.executionIndex).substr(-5));
};

function setRichlistitemNamespace(aAddon) {
  aAddon.richlistitem.setAttribute("namespace", aAddon.namespace);
};

function unload() {
  var GM_config = GM_util.getService().config;
  // Since .getAddonsByTypes() is asynchronous,
  // AddonManager gets destroyed by the time the callback runs.
  // Cache this value we need from it.
  var pending_uninstall = AddonManager.PENDING_UNINSTALL;

  AddonManager.getAddonsByTypes(
      [GM_CONSTANTS.scriptAddonType], function (aAddons) {
    let didUninstall = false;
    for (let i = 0, addon = null; addon = aAddons[i]; i++) {
      if (addon.pendingOperations & pending_uninstall) {
        addon.performUninstall();
        didUninstall = true;
      }
    }
    // Guarantee that the config.xml is saved to disk.
    // TODO:
    // This without dipping into private members.
    if (didUninstall) {
      GM_config._save(true);
    }
  });

  GM_config.removeObserver(observer);
};
})();

function GM_openUserscriptsOrg() {
  let chromeWin = GM_util.getBrowserWindow();
  chromeWin.gBrowser.selectedTab = chromeWin.gBrowser.addTab(
      "http://wiki.greasespot.net/User_Script_Hosting");
}
