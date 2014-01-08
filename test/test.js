// run with mocha -u bdd or grunt test

var engine = require('../lib').createEngine();
var assert = require('chai').assert;

describe('io', function() {
  // This first test is a way to define 'tester' synchronously
  // using Mocha's done() function.
  var tester;
  it('creating engine', function(done) {
    engine.test(function(tester_) {
      tester = tester_;
      done();
    });
  });

  var assertOutputTypes = function(input, types, done) {
    tester(input, function (output) {
      try {
        assert.equal(output.length, types.length);
      } 
      catch (e) {
        done(e);
        return;              
      }
      for (var i = 0; i < types.length; i++) {
        try {
          assert.equal(output[i].type, types[i]);
        }
        catch (e) {
          done(e);
          return;                                
        }
      }
      done();
    });
  };

  it('is loading sense module', function(done) {
    tester("var sense = require('sense')", function(output) {
      done();
    });    
  });

  it('should not output assignment results', function(done) {
    assertOutputTypes("a=0", ["code"], done);
  });

  it('should display iframe widgets', function(done) {
    assertOutputTypes("sense.iframe({src: 'hello'})", ["code", "iframe"], done);
  });

  it('should display html widgets', function(done) {
    assertOutputTypes("sense.html('<p>hello</p>')", ["code", "html"], done);
  });

  it('should display markdown widgets', function(done) {
    assertOutputTypes("sense.markdown('**markdown**')", ["code", "markdown"], done);
  });

  it('should display code widgets', function(done) {
    assertOutputTypes("sense.code({code: 'var x = 0;', language: 'javascript'})", ["code", "code"], done);
  });

  it('should display image widgets', function(done) {
    assertOutputTypes("sense.image({width: '3px', height: '4px', src: 'hello'})", ["code", "image"], done);
  });

  it('should display help through the help system', function(done) {
    assertOutputTypes("sense.help('<b>Instructions</b>')", ["code", "help"], done);
  });

  it('should not output assigned widgets', function(done) {
    assertOutputTypes("y=sense.iframe({src: 'hello'})", ["code"], done);
  });

  it('should recognize the toWidget method', function(done) {
    assertOutputTypes("({toWidget: (function() {return sense.iframe({src: 'hello'});})})", ["code", "iframe"], done);
  });

  it('should output other results', function(done) {
    assertOutputTypes("a", ["code", "text"], done);
  });

  it('should output code before runtime errors', function(done) {
    assertOutputTypes("b", ["code", "error"], done);
  });

  it('should output short syntax errors with no code', function(done) {
    assertOutputTypes("(", ["error"], done);
  });

  it('should render block comments', function(done) {
    assertOutputTypes("/*\nSome documentation.\n*/", ["markdown"], done);
  });

  it('should not render line comments', function(done) {
    assertOutputTypes("//line1\n//line2\n\n//line3", ["comment", "comment"], done);
  });

  it('should group multiline statements', function(done) {
    assertOutputTypes("(function(x) {\n  return x*x;\n})(2);", ["code", "text"], done);
  });

  it('schould recognize unparenthesized object literals', function(done) {
    assertOutputTypes("{x: 0};", ["code", "text"], done);
  });

  it('should tolerate blank lines', function(done) {
    assertOutputTypes("a\n\nb", ["code", "text", "code", "error"], done);
  });

  it('should preserve result ordering', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push(i);
    }
    var types = [];
    for (i = 0; i < n; i++) {
      types.push("code", "text");
    }
    assertOutputTypes(code.join("\n"), types, done);
  });

  it('should clear the command queue on first error', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push("q");
    }
    assertOutputTypes(code.join("\n"), ["code", "error"], done);
  });

  it('should preserve stdout ordering', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push("console.log(" + i + ")");
    }
    var types = [];
    for (i = 0; i < n; i++) {
      types.push("code", "text");
    }
    assertOutputTypes(code.join("\n"), types, done);
  });

});