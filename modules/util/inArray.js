const EXPORTED_SYMBOLS = ["inArray"];


function inArray(aArr, aVal) {
  if ("includes" in Array.prototype) {
    return aArr.includes(aVal);
  } else {
    for (let i = 0, iLen = aArr.length; i < iLen; i++) {
      let val = aArr[i];
      if (aVal === val) {
        return true;
      }
    }

    return false;
  }
}
