const EXPORTED_SYMBOLS = ["GM_window"];

if (typeof Cc === "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci === "undefined") {
  var Ci = Components.interfaces;
}
if (typeof Cu === "undefined") {
  var Cu = Components.utils;
}


function GM_window(aFrame, aWhat) {
  aFrame.sendAsyncMessage("greasemonkey:window", {
    "what": aWhat,
  });
};
