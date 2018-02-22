// Copyright (c) 2018 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const expect = require("chai").expect;
const Task = require("..").Task;

const fs = require("fs");
const makePromise = require("../lib/make-promise");

const writeFile = makePromise(fs.writeFile);
const rm = makePromise(fs.unlink);
const mkdir = makePromise(fs.mkdir);
const rmdir = makePromise(fs.rmdir);

let task;
const doNothing = pwd => Promise.resolve();

describe("in an environment with 'watch' and 'run' directories", () => {
  beforeEach(() => {
    return mkdir("test_task").then(() => {
      return Promise.all([
        mkdir("test_task/watch"),
        mkdir("test_task/run")
      ]);
    });
  });

  afterEach(() => {
    return Promise.all([
      rmdir("test_task/watch"),
      rmdir("test_task/run")
    ]).then(() => {
      return rmdir("test_task");
    });
  });

  describe("Task('watch', 'run', doNothing)", () => {
    beforeEach(() => {
      task = Task("test_task/watch", "test_task/run", doNothing);
    });

    it("can init", () => {});
  });
});
