// run with mocha -u bdd

var senseEngine = require('sense-engine');
var assert = require('chai').assert

describe('io', function() {
  // This first test is a way to define 'tester' synchronously
  // using Mocha's done() function.
  var tester;
  it('creating dashboard', function(done) {
    senseEngine.test(require('../lib/index').createDashboard, function(tester_) {
      tester = tester_;
      done()
    });
  });

  var assertOutputTypes = function(input, types, done) {
    tester(input, function (output) {
      try {
        assert.equal(output.length, types.length)
      }
      catch (e) {
        done(e)
        return                
      }
      for (var i = 0; i < types.length; i++) {
        try {
          assert.equal(output[i].mime, types[i]);
        }
        catch (e) {
          done(e);
          return;                                
        }
      }
      done();
    });
  };

  it('should not output assignment results', function(done) {
    assertOutputTypes("a=0", ["text/javascript"], done);
  });

  it('should output other results', function(done) {
    assertOutputTypes("a", ["text/javascript", "text/plain"], done);
  });

  it('should output code before runtime errors', function(done) {
    assertOutputTypes("b", ["text/javascript", "application/error"], done);
  });

  it('should output short syntax errors with no code', function(done) {
    assertOutputTypes("(", ["application/error"], done);
  });

  it('should render block comments', function(done) {
    assertOutputTypes("/*\nSome documentation.\n*/", ["text/markdown"], done);
  });

  it('should not render line comments', function(done) {
    assertOutputTypes("//line1\n//line2\n\n//line3", ["text/comment", "text/comment"], done);
  });

  it('should group multiline statements', function(done) {
    assertOutputTypes("(function(x) {\n  return x*x;\n})(2);", ["text/javascript", "text/plain"], done);
  });

  it('schould recognize unparenthesized object literals', function(done) {
    assertOutputTypes("{x: 0};", ["text/javascript", "text/plain"], done);
  });

  it('should tolerate blank lines', function(done) {
    assertOutputTypes("a\n\nb", ["text/javascript", "text/plain", "text/javascript", "application/error"], done);
  });

  it('should preserve result ordering', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push(i);
    }
    var types = [];
    for (i = 0; i < n; i++) {
      types.push("text/javascript", "text/plain");
    }
    assertOutputTypes(code.join("\n"), types, done);
  });

  it('should preserve error ordering', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push("q");
    }
    var types = [];
    for (i = 0; i < n; i++) {
      types.push("text/javascript", "application/error");
    }
    assertOutputTypes(code.join("\n"), types, done);
  });

  it('should preserve stdout ordering', function (done) {
    var n = 1000;
    var code = [];
    for (var i = 0; i < n; i++) {
      code.push("console.log(" + i + ")");
    }
    var types = [];
    for (i = 0; i < n; i++) {
      types.push("text/javascript", "text/plain");
    }
    assertOutputTypes(code.join("\n"), types, done);
  });

});