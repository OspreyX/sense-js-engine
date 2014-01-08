var util = require('util');
var _ = require('lodash');
var vm = require('vm');
var cp = require('child_process');
var path = require('path');
var sense = require('sense');
global.require = require;

module.filename = path.resolve('engine');
module.paths = require('module')._nodeModulePaths(module.filename);

var outputCatcher = function(chunk, encoding, cb) {
  try {
    process.send({type: "text", value: chunk.toString()});
    if (cb) cb();
  }
  catch (err) {
    if (cb) cb(err);
  }
};
process.stdout._write = outputCatcher;
process.stderr._write = outputCatcher;

var getErrorReply = function(err) {
  return {
    type: 'error',
    value: {
      message: err.name + ": " + err.message, 
      details: err.stack.toString().split('\n').slice(1).join('\n')
    }
  };
};

process.on('uncaughtException', function(err) {
  process.send(getErrorReply(err));
});

process.on('message', function(code) {
  var reply, result;
  try {
      result = vm.runInThisContext(code, 'engine');
      reply = sense.display(result, true);
    } catch (err) {
      reply = getErrorReply(err);
    }
  reply.result = true;
  process.send(reply);
});

process.send('ready');
