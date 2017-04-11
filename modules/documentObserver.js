"use strict";

const EXPORTED_SYMBOLS = ["onNewDocument"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://greasemonkey-modules/content/util.js");


const OBSERVER_TOPIC = "document-element-inserted";

var callbacks = new WeakMap();

function onNewDocument(topWindow, callback) {
  callbacks.set(topWindow, callback);
}

let contentObserver = {
  "observe": function (aSubject, aTopic, aData) {
    if (!GM_util.getEnabled()) {
      return undefined;
    }

    switch (aTopic) {
      case OBSERVER_TOPIC:
        let doc = aSubject;
        let win = doc && doc.defaultView;

        if (!doc || !win) {
          return undefined;
        }

        let topWin = win.top;

        let frameCallback = callbacks.get(topWin);
        if (!frameCallback) {
          return undefined;
        }

        frameCallback(win);
      break;
      default:
        dump("Content frame observed unknown topic: " + aTopic + "\n");
        break;
    }
  },
};

Services.obs.addObserver(contentObserver, OBSERVER_TOPIC, false);
