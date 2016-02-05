// Entry point for browserify.

'use strict';

var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');
var webppl = require('./main');
var optimize = require('./transforms/optimize').optimize;
var naming = require('./transforms/naming').naming;
var thunkify = require('./syntax').thunkify;
var cps = require('./transforms/cps').cps;
var analyze = require('./analysis/main').analyze;

// This is populated by the bundle.js browserify transform.
var packages = [];

// Load JS and headers from packages.
packages.forEach(function(pkg) {
  console.log('package ' + pkg.name + ' loaded.');
  if (pkg.js) { global[pkg.js.identifier] = pkg.js.path; }
  pkg.headers.forEach(webppl.requireHeaderWrapper);
});

var extra = webppl.parsePackageCode(packages);

function run(code, k, options) {
  if (options === undefined) {
    options = {};
  }
  var optionsExtended = _.extend({extra: extra}, options);

  return webppl.run(code, k, optionsExtended);
}

function compile(code, options) {
  if (options === undefined) {
    options = {};
  }
  var optionsExtended = _.extend({extra: extra}, options);
  return webppl.compile(code, optionsExtended);
}

function webpplCPS(code) {
  var programAst = esprima.parse(code);
  var newProgramAst = optimize(cps(thunkify(programAst)));
  return escodegen.generate(newProgramAst);
}

function webpplNaming(code) {
  var programAst = esprima.parse(code);
  var newProgramAst = naming(thunkify(programAst));
  return escodegen.generate(newProgramAst);
}

global.webppl = {
  run: run,
  compile: compile,
  cps: webpplCPS,
  naming: webpplNaming,
  analyze: analyze
};

console.log('webppl loaded.');
