const EXPORTED_SYMBOLS = ["emptyEl"];


function emptyEl(aEl) {
  while (aEl.firstChild) {
    aEl.removeChild(aEl.firstChild);
  }
}
