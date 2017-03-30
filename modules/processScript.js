"use strict";

// Frame scripts, including all their functions, block scopes etc.
// are instantiated for each tab.
// Having a single per-process script has a lower footprint
// for stateless things.
// Avoid keeping references to frame scripts or their content,
// this could leak frames!

const EXPORTED_SYMBOLS = ["addFrame"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

// Each (child) process needs to handle navigation to ".user.js" via file:// .
Cu.import("chrome://greasemonkey-modules/content/installPolicy.js");


// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

function addFrame(frameMM) {
  frameMM.addMessageListener("greasemonkey:frame-urls", urlTree);
}

function urlsOfAllFrames(contentWindow) {
  var urls = [contentWindow.location.href];
  function collect(contentWindow) {
    urls = urls.concat(urlsOfAllFrames(contentWindow));
  }
  Array.from(contentWindow.frames).forEach(collect);

  return urls;
}

function urlTree(message) {
  let frameMM = message.target;
  let urls = urlsOfAllFrames(frameMM.content);
  let response = {
    "urls": urls,
  };
  frameMM.sendAsyncMessage("greasemonkey:frame-urls", response);
}
