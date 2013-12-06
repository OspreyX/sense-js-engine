var util = require('util');
var _ = require('lodash');
var vm = require('vm');
var cp = require('child_process');
var path = require('path');
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
      if (result && _.isFunction(result.toIFrame)) {
        reply = {
          type: 'iframe',
          value: result.toIFrame()
        };
      } else if (result && _.isFunction(result.toImage)) {
        reply = {
          type: 'image',
          value: result.toImage()
        };
      } else if (result && _.isFunction(result.toMarkdown)) {
        reply = {
          type: 'markdown',
          value: result.toMarkdown()
        };
      } else if (result && _.isFunction(result.toCode)) {
        reply = {
          type: 'code',
          value: result.toCode()
        };
      } else {
        reply = {
          type: 'text',
          value: util.inspect(result)
        };
      }
    } catch (err) {
      reply = getErrorReply(err);
    }
    reply.result = true;
    process.send(reply);
});

process.send('ready');
