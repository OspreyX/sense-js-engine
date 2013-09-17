var util = require('util');
var _ = require('lodash');
var vm = require('vm');
var cp = require('child_process');
global.require = require;

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

process.on('message', function(code) {
  var reply, result;
  try {
    result = vm.runInThisContext(code, 'engine');
      if (result && _.isFunction(result.toHtml)) {
        reply = {
                  type: 'html',
                  value: result.toHtml()
                };
      } else {
        reply = {
                  type: 'text',
                  value: util.inspect(result)
                };
      }
    } catch (err) {
      reply = {
        type: 'error',
        value: {
          message: err.name + ": " + err.message, 
          details: err.stack.toString().split('\n').slice(1).join('\n')
        }
      };
    }
    reply.result = true;
    process.send(reply);
});

process.send('ready');
