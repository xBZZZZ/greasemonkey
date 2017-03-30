const EXPORTED_SYMBOLS = ["hitch"];


function hitch(obj, method) {
  if (obj && method && (typeof method == "string")) {
    if (!obj[method]) {
      throw 'GM_util.hitch: Method "' + method
          + '" does not exist on object:' + "\n" + obj;
    }
    method = obj[method];
  } else if (typeof method == "function") {
    obj = obj || {};
  } else {
    throw "GM_util.hitch: Invalid arguments.";
  }

  var staticArgs = Array.prototype.splice.call(arguments, 2, arguments.length);

  return function () {
    // Make a copy of staticArgs
    // (don't modify it because it gets reused for every invocation).
    let args = Array.prototype.slice.call(staticArgs);

    // Add all the new arguments.
    Array.prototype.push.apply(args, arguments);

    // Invoke the original function with the correct this obj
    // and the combined list of static and dynamic arguments.
    return method.apply(obj, args);
  };
}
