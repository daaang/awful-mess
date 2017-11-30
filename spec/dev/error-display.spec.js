// Copyright (c) 2017 The Regents of the University of Michigan.
// All Rights Reserved. Licensed according to the terms of the Revised
// BSD License. See LICENSE.txt for details.

/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const expect = require("chai").expect;
const errorDisplay = require("../../lib/error-display");

let error, lines;

describe("a single error on a single node", () => {
  beforeEach(() => {
    error = Error();
    error.description = "one node";
    error.messages = [Error("uh oh")];
    error.children = [];
  });

  describe("its array of lines", () => {
    beforeEach(() => {
      lines = errorDisplay.lines(error);
    });

    it("has 2 lines", () => {
    });
  });
});
