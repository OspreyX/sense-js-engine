var shell, request, async, util, _;
shell = require("shelljs");
request = require("request");
async = require("async");
_ = require("underscore");
util = require("util");

// The five DisplayObject classes: iframe, markdown, html, code, image.
var iframe = exports.iframe = function iframe(params) {
  if (!(this instanceof iframe)) {
    return new iframe(params);
  }

  if (/^http:/.exec(params.src)) {
    throw new Error("The 'src' parameter must not be a plain http URL.")
  }
  if (!params.src) {
    throw new Error("Please provide the 'src' parameter.")
  }
  this.width = params.width || null;
  this.height = params.height || null;
  this.src = params.src || null;
};
// the isSenseWidget attribute protects against name collisions.
iframe.isSenseWidget = true;

var markdown = exports.markdown = function markdown(markdownText) {
  if (!(this instanceof markdown)) {
    return new markdown(markdownText);
  }

  this.markdown = markdownText;
};
markdown.isSenseWidget = true;

var html = exports.html = function html(htmlCode) {
  if (!(this instanceof html)) {
    return new html(htmlCode);
  }

  this.html = htmlCode;
};
html.isSenseWidget = true;

var code = exports.code = function code(params) {
  if (!(this instanceof code)) {
    return new code(params);
  }

  this.language = params.language || "javascript";
  this.code = params.code;
};
code.isSenseWidget = true;

var image = exports.image = function image(params) {
  if (!(this instanceof image)) {
    return new image(params);
  }

  if (!params.src) throw new Error("Please provide the 'src' parameter.");
  this.width = params.width || null;
  this.height = params.height || null;
  this.src = params.src;
  this.alt = params.alt || "";
  this.title = params.title || "";
};
image.isSenseWidget = true;

// grid is internal for now.
var grid = exports.grid = function grid(params) {
  if (!(this instanceof grid)) {
    return new grid(params);
  }

  this.data = params.data || [];
  this.columns = params.columns || [];
  this.options = params.options || [];
};
grid.isSenseWidget = true;

// This helper function is a version of "instanceof" that can tolerate
// two copies of this module being required from separate places.
var instanceOfWidget = exports.instanceOfWidget = function(obj, className) {
  if (obj && obj.__proto__ && obj.__proto__.constructor && obj.__proto__.constructor.name === className) {
    // Check for our special unique string in the constructor body, to protect against
    // name collisions.
    if (obj.__proto__.constructor.isSenseWidget) {
      return true;
    }
  }
  return false;
}

// Pushes html or text up for output.
var display = exports.display = function(obj, capture) {
  var displayForm;
  capture = capture || false;

  if (instanceOfWidget(obj, "iframe")) {
    displayForm = {type: "iframe", value: obj};
  } else if (instanceOfWidget(obj, "html")) {
    displayForm = {type: "html", value: obj.html};
  } else if (instanceOfWidget(obj, "markdown")) {
    displayForm = {type: "markdown", value: obj.markdown};
  } else if (instanceOfWidget(obj, "code")) {
    displayForm = {type: "code", value: obj};
  } else if (instanceOfWidget(obj, "image")) {
    displayForm = {type: "image", value: obj};
  } else if (instanceOfWidget(obj, "grid")) {
    displayForm = {type: "grid", value: obj};
  } else if (obj && _.isFunction(obj.toWidget)) {
    return display(obj.toWidget(), capture);
  } else {
    displayForm = {type: "text", value: util.inspect(obj)};
  }

  if (capture) {
    return displayForm;
  } else {
    process.send(displayForm);
  }
};

exports.help = function(obj) {
  process.send({type: "help", value: obj})
};

// npm install a package to /home/sense.
exports.install = function(pkg, cb) {
  async.series([
    function(cb) {
      shell.exec("mkdir -p /home/sense/node_modules", {async: true}, cb);
    },
    function(cb) {
      shell.exec("cd /home/sense;npm install " + pkg, {async: true}, cb); 
    }
  ], cb);
};

// Utility function. Request passes three arguments to its callbacks,
// we want only two for both the exposed API and async.
var wrapRequestCb = function(cb) {
  return function(err, res, body) {
    if (err) {
      cb(err);
    }
    else {
      cb(null, body);
    }
  }
};

// Utility function to get auth information. On Sense, this is usually
// process.env.SENSE_API_KEY. Off sense, this is process.env.SENSE_USER
// and process.env.SENSE_PASSWORD.
exports.getAuth = function() {
  if (process.env.SENSE_USERNAME && process.env.SENSE_PASSWORD) {
      return {
        user: process.env.SENSE_USERNAME,
        pass: process.env.SENSE_PASSWORD
      };
    }
  else if (process.env.SENSE_API_KEY) {
    return {
      user: process.env.SENSE_API_KEY,
      pass: ""
    };  
  }
  else {
    throw new Error("Please set environment variable SENSE_API_KEY or both SENSE_USERNAME and SENSE_PASSWORD to authenticate to the REST API.");
  }
};

// Synchronously returns all network information for this dashboard.
exports.networkInfo = function() {
  var portMapping = {};
  var i = 1;
  while (process.env.hasOwnProperty("SENSE_PORT" + i)) {
    portMapping[process.env["SENSE_PORT" + i]] = process.env["SENSE_PUBLIC_PORT" + i];
    i++;
  }
  portMapping[process.env["SENSE_SSH_PORT"]] = process.env["SENSE_PUBLIC_SSH_PORT"]
  return {
    publicDns: process.env.SENSE_PUBLIC_DNS,
    publicPortMapping: portMapping,
    sshPassword: process.env.SENSE_SSH_PASSWORD,
    publicSshPort: process.env.SENSE_PUBLIC_SSH_PORT,
    projectIP: process.env.SENSE_PROJECT_IP
  };
};

var getMasterId = function() {
  var masterId;
  if (process.env.SENSE_MASTER_ID === "") {
    masterId = process.env.SENSE_DASHBOARD_ID;
  }
  else {
    masterId = process.env.SENSE_MASTER_ID;
  }
  return masterId;
};

var getBaseUrl = function() {
  return process.env.SENSE_PROJECT_URL + "/dashboards";
};

// Params should be {size, [engine], [script], [code], [env], [n]}.
// Result passed to callback is either an error or an array of the standard REST
//  worker representation, as a JavaScript object.
exports.launchWorkers = function(params, cb) {
  var requestBody, url, size, engine, script, code, n, env, cb_;
  n = params.n || 1;
  engine = params.engine || "sense-js-engine";
  script = params.script || "";
  code = params.code || "";
  env = params.env || {};
  size = params.size || 1;

  if (!n) {
    throw new Error("Parameter 'n' must be an integer.")
  }

  requestBody = {
    engine: engine,
    size: size,
    script: script,
    code: code,
    env: env,
    master_id: getMasterId()
  };

  url = getBaseUrl();
  
  async.times(n, function(i, next) {
    request({
      method: "POST",
      url: url,
      json: requestBody,
      auth: exports.getAuth(),
    }, wrapRequestCb(next));    
  }, cb);
};

// Result passed to the callback is an array of the standard REST worker
// representation.
exports.listWorkers = function(cb) {
  var masterId, url, cb_;
  masterId = getMasterId();
  url = getBaseUrl() + "/" + process.env.SENSE_DASHBOARD_ID + "/workers";
    
  request({
    method: "GET",
    url: url,
    json: {}, // This causes request to JSON.parse the response body.
    auth: exports.getAuth(),
  }, wrapRequestCb(cb));
};

// Result passed to the callback is the standard REST worker representation.
exports.getMaster = function(cb) {
  var url, cb_;
  url = getBaseUrl() + "/" + getMasterId();
    
  cb_ = function(err, resp) {
    if (err) cb(err);
    else {
      cb(null, resp);
    }
  }

  request({
    method: "GET",
    url: url,
    json: {}, // This causes request to JSON.parse the response body.
    auth: exports.getAuth(),
  }, wrapRequestCb(cb_));
};

// If two arguments are provided, the first is an array of id's and the 
// second is a callback. If just one is provided, it's a callback, and
// all the worker dashboards in this cluster are stopped. Result passed
// to callback is an array of the standard REST worker representation.
exports.stopWorkers = function(idsOrCb, maybeCb) {
  var baseUrl, requestBody, cb, ids;
  if (arguments.length === 1) {
    cb = idsOrCb;
    exports.listWorkers(function(err, res) {
      var ids = [];
      for (var i=0; i<res.length; i++) {
        if (res[i].master_id) {
          ids.push(res[i].id);
        }
      }
      if (ids.length > 0) {
        exports.stopWorkers(ids, cb);
      }
      else {
        cb(null, []);
      }
    });
  }

  else {
    ids = idsOrCb;
    cb = maybeCb;
    baseUrl = getBaseUrl();
    async.map(ids, function(id, next) {
      request({
        method: "PUT",
        url: baseUrl + "/" + id + "/stop",
        auth: exports.getAuth(),
      }, wrapRequestCb(next))
    }, cb);
  }
};
