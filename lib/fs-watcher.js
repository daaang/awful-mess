// Copyright (c) 2017 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

const FileTreeInspector = require("./file-tree-inspector");
const tick = require("./tick");

module.exports = function(parameters) {
  const internal = {};

  if (typeof parameters === "undefined")
    parameters = {};

  if (typeof parameters.tick === "undefined")
    internal.tick = tick;

  else
    internal.tick = parameters.tick;

  if (typeof parameters.inspector === "undefined")
    internal.inspector = FileTreeInspector();

  else
    internal.inspector = parameters.inspector;

  internal.lookAgain = (findFiles, previousMap, checksums) => {
    return new Promise(function(resolve, reject) {
      internal.gatherSizeMapping(findFiles).then(sizes => {
        if (internal.mapsAreEqual(previousMap, sizes))
          internal.compareChecksums(findFiles,
                                    sizes,
                                    checksums,
                                    1).then(resolve, reject);

        else
          internal.tick().then(() => {
            internal.lookAgain(findFiles,
                               sizes,
                               checksums).then(resolve, reject);
          }, reject);
      }, reject);
    });
  };

  internal.gatherSizeMapping = findFiles => {
    return new Promise(function(resolve, reject) {
      findFiles().then(paths => {
        const mapPromises = [];

        for (const path of paths)
          mapPromises.push(internal.inspector.getSizesUnder(path));

        Promise.all(mapPromises).then(maps => {
          const combinedMaps = new Map();

          for (const map of maps)
            map.forEach((size, path) => {
              combinedMaps.set(path, size);
            });

          resolve(combinedMaps);
        }, reject);
      }, reject);
    });
  };

  internal.compareChecksums = (findFiles, sizes, previousSums, n) => {
    return new Promise(function(resolve, reject) {
      const collectingChecksums = [];

      for (const path of sizes.keys())
        collectingChecksums.push(internal.getChecksum(path));

      Promise.all(collectingChecksums).then(results => {
        const currentSums = new Map();

        for (const checksum of results)
          currentSums.set(checksum.path, checksum.sum);

        if (internal.mapsAreEqual(previousSums, currentSums))
          if (n < 1)
            findFiles().then(resolve, reject);

          else
            internal.tick(30).then(() => {
              internal.compareChecksums(findFiles,
                                        sizes,
                                        currentSums,
                                        n - 1).then(resolve, reject);
            });

        else
          internal.lookAgain(findFiles,
                             sizes,
                             currentSums).then(resolve, reject);
      }, reject);
    });
  };

  internal.getChecksum = path => new Promise(function(resolve, reject) {
    internal.inspector.getChecksum(path).then(checksum => {
      resolve({"path": path, "sum": checksum});
    }, reject);
  });

  internal.mapsAreEqual = (lhs, rhs) => {
    let equalSoFar = (lhs.size === rhs.size);

    if (equalSoFar)
      for (const key of lhs.keys()) {
        if (lhs.get(key) === rhs.get(key))
          continue;

        equalSoFar = false;
        break;
      }

    return equalSoFar;
  };

  return findFiles => new Promise(function(resolve, reject) {
    internal.lookAgain(findFiles,
                       new Map(),
                       new Map()).then(resolve, reject);
  });
};
