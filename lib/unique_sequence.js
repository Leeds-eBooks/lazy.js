var UniqueSequence = CachingSequence.inherit(function(parent) {
  this.parent = parent;
});

UniqueSequence.prototype.each = function(fn) {
  var set = new Set(),
      i = 0;
  this.parent.each(function(e) {
    if (set.add(e)) {
      return fn(e, i++);
    }
  });
};

/**
 * @constructor
 */
function UniqueArrayWrapper(parent) {
  this.parent = parent;
  this.each = getEachForSource(parent.source);
}

UniqueArrayWrapper.prototype = new CachingSequence();

UniqueArrayWrapper.prototype.eachNoCache = function(fn) {
  var source = this.parent.source,
      value,
      found,

      // Yes, this is hideous.
      // Trying to get performance first, will refactor next!
      i = -1,
      j,
      k = 0;

  while (++i < source.length) {
    value = source[i];
    found = false;

    // Scan downwards to look for a dupe.
    j = i - 1;
    while (j >= 0) {
      if (source[j--] === value) {
        found = true;
        break;
      }
    }

    if (!found && fn(source[i], k++) === false) {
      return false;
    }
  }
};

UniqueArrayWrapper.prototype.eachArrayCache = function(fn) {
  // Basically the same implementation as w/ the set, but using an array because
  // it's cheaper for smaller sequences.
  var source = this.parent.source,
      cache = [],
      value,
      i = -1,
      j = 0;
  while (++i < source.length) {
    value = source[i];
    if (!contains(cache, value)) {
      cache.push(value);
      if (fn(value, j++) === false) {
        return false;
      }
    }
  }
};

function getEachForSource(source) {
  if (source.length < 20) {
    return UniqueArrayWrapper.prototype.eachNoCache;
  } else if (source.length < 200) {
    return UniqueArrayWrapper.prototype.eachArrayCache;
  } else {
    return UniqueSequence.prototype.each;
  }
}