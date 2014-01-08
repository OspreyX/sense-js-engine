var cp = require('child_process');
var path = require('path');
var _ = require('lodash');
var acorn = require('acorn');
var cch = require('comment-chunk-helper');
var engine = require('sense-engine');

var repeat = function(s, n) {
  var out = "";
  for (var i = 0; i < n; i++) out += s;
  return out;
};

var formatError = function(code, e) {
  try {
    var msg = [
      "engine:" + e.loc.line + ":" + e.loc.column + ": " + e.message.replace(/\(\d+:\d+\)$/, ""),
      code.split("\n")[e.loc.line-1],
      repeat(" ", e.loc.column) + "^"
    ];
    return msg.join("\n");    
  }
  catch (err) {
    return err.stack.toString();
  }
};

var getStatLocs = function(ast) {
  var statLocs = [];
  for (var i=0; i<ast.body.length;i++) {
    var stat = ast.body[i];
    if (stat.type === "EmptyStatement") continue;
    statLocs.push({
      start: {
        line: stat.loc.start.line-1,    // acorn indexes lines starting at 1
        column: stat.loc.start.column   // but columns starting at 0
      },
      end: {
        line: stat.loc.end.line-1,         
        column: stat.loc.end.column - 1 // acorn's upper bound is exclusive
      },
      properties: {
        isAssignment: stat.isAssignment,
        isExpression: stat.isExpression
      }
    });
  }
  return statLocs;
};

var markAssignments = function(ast) {
  for (var i = 0; i < ast.body.length; i++) {
    if (ast.body[i].type === 'ExpressionStatement') {
      ast.body[i].isExpression = true;
      if (ast.body[i].expression.type === 'AssignmentExpression') {
        ast.body[i].isAssignment = true;
      }
    }    
  }
};

var parse = function(code, cb) {
  try {
    var ast = acorn.parse(code, {locations: true});
    markAssignments(ast);
    cb(false, getStatLocs(ast));
  }
  catch (e) {
    // We should be able to simply pass the code on and let the engine in
    // child.js deal with presenting the syntax error, but unfortunately
    // that won't work until https://github.com/joyent/node/issues/3452
    // is fixed. For now, we manually format the syntax error. This will
    // be sent right to the engine.
    cb(formatError(code,e));
  }
};

var prepareCode = function(code) {
  // Use node.js's trick to handle function defs
  var scopeFunc = /^\s*function\s*([_\w\$]+)/;
  var matches = scopeFunc.exec(code);
  if (matches && matches.length === 2) {
    code = matches[1] + ' = ' + code;
  }


  // We have to first try the parenthesized version in order to mimic
  // the Node.js repl's effective syntax.
  // See https://github.com/joyent/node/blob/master/lib/repl.js#L244.
  // Unfortunately that means we have to do another parse.
  var pCode = "(" + code + ")";
  try {
    acorn.parse(pCode);
    return pCode;
  }
  catch (err) {
    return code;  
  }
};

var chunk = cch({
  parser: parse,
  lineComment: "//",
  blockComment: {
    left: "/*",
    right: "*/"
  }
});

/* Create the JavaScript Engine */
function createEngine(options) {
  // The engine implementation generally does not need to do anything with the 
  // options other than pass them through to sense-engine, but they may be 
  // useful in some circumstances. The options may contain:
  // * startupScript: A file that will be executed before any additional input 
  //   is taken.
  // * startupCode: JavaScript code that will be executed before any input is taken.
  // * batch: A boolean indicating whether the engine should exit when the command 
  //   queue empties.
  var worker = cp.fork(path.join(__dirname, 'child'), [], {});
  var engine = require('sense-engine')(options);

  // We report that the engine is ready to start taking input.
  var readyListener;
  worker.once('message', readyListener = function(m) {
    if (m === 'ready') {
      engine.ready();
    }
    else {
      worker.once('message', readyListener);
    }
  });
  process.on('exit', function() {
    worker.kill('SIGTERM');
  });
  worker.on('exit', process.exit);

  // Text output (from the stdout and stderr of the worker) and html output
  // (from calls to sense.display) can come at any time.
  worker.on('message', function(m) {
    if (!m.result && m.type) {
      if (m.type == "error" || m.type == "warning") {
        engine[m.type](m.value.message, m.value.details);
      }
      else {
        engine[m.type](m.value);
      }
    }
  });

  engine.chunk = chunk;

  // A very simple autocomplete function that just matches against
  // the globals. Note that autocompletion is not enabled yet on
  // Sense.
  engine.complete = function(substr, cb) {
    var names = Object.getOwnPropertyNames(global);
    cb(_.filter(names, function(x) {
      return x.indexOf(substr) === 0;
    }));
  };

  // This interrupt function just sends the SIGINT signal to the worker
  // process, but many other behaviors are possible.
  engine.interrupt = function() {
    return worker.kill('SIGINT');
  };

  // This function is responsible for sending code to the worker process
  // for execution, returning any results to the engine, and notifying
  // the engine when the computation has stopped and the next command
  // can be sent in.
  engine.execute = function(chunk, next) {
    if (chunk.type === 'comment') {
      // If the chunk is a comment, we report it to the engine without
      // communicating with the child process at all.
      engine.comment(chunk.value);
      // The engine is now ready to take the next chunk.
      next();
    } 
    else if (chunk.type === 'blockComment') {
      // If the chunk is a block comment, we assume that it's Markdown
      // documentation and pass it to the engine as such.
      engine.markdown(chunk.value);
      next();
    }
    else if (chunk.type === 'error') {
      // If the chunk is a syntax error, we pass it right to the engine.
      engine.error(chunk.value);
      next();
    }
    else {
      var code = chunk.value;
      engine.code(code, 'javascript');
      // To mimic the Node.js repl syntax, we need to do some preprocessing.
      worker.send(prepareCode(code));
      // The next message we get from the engine that isn't text will be 
      // the result of executing the code.
      worker.on('message', function(m) {
        var result = true;
        // If the message is tagged as a result, it indicates that execution of
        // the chunk is complete.
        if (m.result) {
          // If the chunk resulted in an error, display it.
          if (m.type === "error") {
            engine.error(m.value.message, m.value.details);
          }
          // If the chunk resulted in code, display it.
          if (m.type === "code") {
            engine.code(m.value.code, m.value.language);
          }
          // If the chunk resulted in a grid, display it.
          if (m.type === "grid") {
            engine.grid(m.value.data, m.value.columns, m.value.options);
          }
          // If the chunk was an assignment, or evaluated to 'undefined', do not
          // display the result. Otherwise, display the result.
          else if (m.value !== 'undefined' && !(chunk.properties && chunk.properties.isAssignment)) {
            engine[m.type](m.value);
          }
          // Whether the code returned a result or caused an error, the engine
          // is now ready to take the next code chunk.
          worker.removeListener('message', arguments.callee);
          next();          
        }
      });
    }
  };
  return engine;
}

exports.createEngine = createEngine;
