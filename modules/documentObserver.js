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


// See #1849.
const OBSERVER_TOPIC_1 = "content-document-global-created";
const OBSERVER_TOPIC_2 = "document-element-inserted";
const OBSERVER_TOPIC = OBSERVER_TOPIC_2;

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
        let doc;
        let win;
        switch (aTopic) {
          case OBSERVER_TOPIC_1:
            // aData != "null" - because of the page "about:blank".
            doc = aData && (aData != "null");
            win = aSubject;

            break;
          case OBSERVER_TOPIC_2:
            doc = aSubject;
            win = doc && doc.defaultView;

            break;
        }

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
