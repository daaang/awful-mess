// Copyright (c) 2017 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

/* eslint-env mocha */
const expect = require("chai").expect;
const later = require("../helpers/later")(it);

const Scheduler = require("../../lib/scheduler");
const fsWatcher = require("../../lib/fs-watcher");
const MockInspector = require("../mock/file-tree-inspector");
const Ticker = require("../mock/ticker");

let scheduler, ticker, fakeFS, tasks;
const theScheduler = later.customIt(() => scheduler(tasks));

const TaskSpy = function(find) {
  const task = {};

  task.pwd = "";
  task.log = [];

  task.find = () => new Promise(function(resolve, reject) {
    task.log.push(["find", null]);
    resolve(find());
  });

  task.move = files => new Promise(function(resolve, reject) {
    task.log.push(["move", files]);

    for (const file of files)
      for (const key of fakeFS.keys())
        if (key.startsWith(file))
          fakeFS.delete(key);

    find = () => [];

    resolve(task.pwd);
  });

  task.run = wd => new Promise(function(resolve, reject) {
    task.log.push(["run", wd]);
    resolve();
  });

  return task;
};

const setAt = function(time, key, value) {
  ticker.at(time, () => {
    fakeFS.set(key, value);
  });
};

describe("in a mocked environment", () => {
  beforeEach(() => {
    const mockObj = MockInspector();

    tasks = {};
    ticker = Ticker();
    fakeFS = mockObj.fs;

    scheduler = Scheduler(
      {"watcher": fsWatcher({"tick": ticker.tick,
                             "inspector": mockObj.inspector}),
       "tick": ticker.tick});
  });

  theScheduler("runs to completion", () => {});

  describe("given a task which always finds no files", () => {
    beforeEach(() => {
      tasks.alwaysEmpty = TaskSpy(() => []);
    });

    theScheduler("runs task.find()", () => {
      expect(tasks.alwaysEmpty.log.length).to.be.above(0);
    });

    theScheduler("doesn't run task.move() or task.run()", () => {
      for (const line of tasks.alwaysEmpty.log)
        expect(line[0]).to.equal("find");
    });
  });

  describe("with a.txt and a task which finds it", () => {
    beforeEach(() => {
      fakeFS.set("a.txt", "hello");
      tasks.atxt = TaskSpy(() => ["a.txt"]);
      tasks.atxt.pwd = "atxt_autodir";
    });

    theScheduler("runs task.move(['a.txt'])", () => {
      expect(tasks.atxt.log).to.deep.include(["move", ["a.txt"]]);
    });

    theScheduler("runs task.run('atxt_autodir')", () => {
      expect(tasks.atxt.log).to.deep.include(["run", "atxt_autodir"]);
    });

    describe("with b.txt in 10 seconds and a task for it", () => {
      beforeEach(() => {
        setAt(10, "b.txt", "ayyy");
        tasks.btxt = TaskSpy(() => {
          if (fakeFS.has("b.txt"))
            return ["b.txt"];

          else
            return [];
        });

        tasks.btxt.pwd = "btxt_autodir";
      });

      theScheduler("runs task.move() for b.txt", () => {
        expect(tasks.btxt.log).to.deep.include(["move", ["b.txt"]]);
      });

      theScheduler("runs task.run() for b.txt", () => {
        expect(tasks.btxt.log).to.deep.include(["run", "btxt_autodir"]);
      });
    });

    describe("given the a.txt task is inherited as a prototype", () => {
      beforeEach(() => {
        tasks = Object.create(tasks);
      });

      theScheduler("does nothing", () => {
        expect(tasks.atxt.log).to.deep.equal([]);
      });
    });
  });

  describe("with a.txt in 10 seconds and a task for it", () => {
    beforeEach(() => {
      setAt(10, "a.txt", "ayyy");
      tasks.atxt = TaskSpy(() => [...fakeFS.keys()]);
    });

    theScheduler("exits before a.txt exists", () => {
      expect(tasks.atxt.log).to.deep.equal([["find", null]]);
    });
  });
});

describe("a Scheduler() given no parameters", () => {
  it("can be created without error", () => {
    scheduler = Scheduler();
  });
});
