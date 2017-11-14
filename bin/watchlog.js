#!/usr/bin/env node
// Copyright (c) 2017 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

const Tail = require("tail").Tail;
const exec = require("executive");
const logTools = require("../lib/cli-logger");

if (process.argv.length !== 3) {
  console.log("Expected a filename argument");
  process.exit(1);
}

const logFilename = process.argv[2];
exec("touch " + logFilename);

const logTail = new Tail(logFilename, {"fromBeginning": true});

logTools.BulletedListener().then(function(listener) {
  logTail.on("line", function(data) {
    listener.log(JSON.parse(data));
  });

  logTail.on("error", function(err) {
    console.log(err);
    process.exit(1);
  });

  setTimeout(() => {
    exec("touch " + logFilename);
  }, 100);

  listener.promise.then(() => {
    process.exit(0);
  }, error => {
    logTools.walkErrorToStdOut(error);
    process.exit(1);
  });
});
