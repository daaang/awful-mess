// Copyright (c) 2017 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

module.exports = function() {
  let internal = {};
  let emitter = {};

  emitter.emit = function(theEvent) {
    internal.cache.set(theEvent, "fixme");

    if (internal.callbacks.has(theEvent))
      internal.callbacks.get(theEvent)();
  };

  emitter.on = function(theEvent, callback) {
    internal.callbacks.set(theEvent, callback);

    if (internal.cache.has(theEvent))
      callback();
  };

  internal.callbacks = new Map();
  internal.cache = new Map();

  return emitter;
};