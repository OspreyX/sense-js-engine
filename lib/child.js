var util = require("util");
var _ = require("underscore");
var vm = require("vm");
var cp = require("child_process");
var sense = require("sense");

global.require = require;
var displayResult = function(obj) {
  // resultWidget is a widget wrapper of 'obj', cloned if 'obj' is a widget,
  // with the 'result' property set to true.
  var resultWidget;
  if (obj instanceof sense.Widget) resultWidget = sense.widget(obj.mime, obj.data);
  else resultWidget = sense.widget(obj);
  resultWidget.result = true;

  // resultWidget is passed up for output.
  process.send(resultWidget);
};

var outputCatcher = function(chunk, encoding, cb) {
  try {
    // Any text emitted by the dashboard is passed up for output.
    sense.display(sense.text(chunk.toString()));
    if (cb) cb();
  }
  catch (err) {
    if (cb) cb(err);
  }
};
process.stdout._write = outputCatcher;
process.stderr._write = outputCatcher;

process.on("message", function(code) {
  var reply, result;
  try {
    result = vm.runInThisContext(code, "dashboard");
    displayResult(result);
  } 
  catch (err) {
    displayResult(sense.error({
      message: err.name + ": " + err.message,
      details: err.stack.toString().split("\n").slice(1).join("\n")
    }));
  }
});

process.send("ready");
