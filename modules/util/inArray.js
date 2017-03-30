const EXPORTED_SYMBOLS = ["inArray"];


function inArray(aArr, aVal) {
  for (let i = 0, iLen = aArr.length; i < iLen; i++) {
    let val = aArr[i];
    if (aVal === val) {
      return true;
    }
  }

  return false;
}
