// Decorate a function with a memoization wrapper, with a limited-size cache
// to reduce peak memory utilization.
//
// Simple usage:
//
// function foo(arg1, arg2) { /* complex operation */ }
// foo = GM_util.memoize(foo);
//
// The memoized function may have any number of arguments,
// but they must be be serializable, and uniquely.
// It's safest to use this only on functions that accept primitives.

const EXPORTED_SYMBOLS = ["memoize"];

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;


const LIMIT_DEF = 3000;

function memoize(func, limit) {
  limit = limit || LIMIT_DEF;
  var cache = {
    "__proto__": null,
  };
  var keylist = [];

  return function (a) {
    var args = Array.prototype.slice.call(arguments);

    args.forEach(function (aVal, aIndex) {
      if (aVal instanceof Ci.nsIURI) {
        // See #1874.
        args[aIndex] = aVal.spec;
      }
    });

    let key = uneval(args);
    if (key in cache) {
      return cache[key];
    }

    let result = func.apply(null, arguments);

    cache[key] = result;

    if (keylist.push(key) > limit) {
      delete cache[keylist.shift()];
    }

    return result;
  };
}
