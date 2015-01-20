# Utilities for [JavaScript](http://nodejs.org) on [Sense](https://www.senseplatform.com)

[![Build Status](https://travis-ci.org/SensePlatform/sense-js-module.png)](https://travis-ci.org/SensePlatform/sense-js-modlue)

This package serves two purposes. First, it provides rich display functions that display [markdown](http://daringfireball.net/projects/markdown/), 
images, raw HTML and other content in Sense dashboards.

Second, it complements Sense's [REST API](https://help.senseplatform.com/api/rest)
by wrapping and simplifying some of the most common cluster management
operations, such as launching and stopping worker dashboards. It 
provides this functionality to support other packages that implement 
higher-level approaches to cluster computing.

## Installation

This package is preinstalled on Sense. You can import it with

```javascript
require("sense")
```

To install it elsewhere, do

```javascript
npm install sense
```

## Examples

This example demonstrates HTML widgets and rich display:

```javascript
var sense = require("sense");

// markdown documentation
var markdown = [
"To quote George E. P. Box,",
"",
"> All models are *wrong*,",
"> but some are **useful**.",
].join("\n");

sense.markdown(markdown);

// Arbitrary raw HTML in an IFrame
sense.iframe({
  src: "https://npmjs.org",
  width: "500px",
  height: "500px"
});

// Syntax-highlighted code
sense.code("var f = function(x, cb) {cb(null, x);};", "javascript");

// An image
sense.image({
  src: "https://npmjs.org/static/npm.png", 
  width: "518px", 
  height: "202px"
});

// Help
sense.help("<b>HINT: Use HTML widgets to add interactivity to your dashboard!</b>");
```

The next example launches several worker dashboards and communicates with them 
using [ZeroMQ](https://github.com/JustinTulloss/zeromq.node)
over the project's private network. 

First, execute the following code in a dashboard and wait for the installation to finish.
You only need to do this once per project.

```javascript
// Use 'install' to install package 'zmq' from the NPM package.
sense.install("zmq");
```

Then, save the following code to file `worker-script.js` in the project's home folder:

```javascript
// worker-script.js

// Worker dashboards should execute this code on startup.
// Each worker will attempt to connect to the ZeroMQ server whose 
// address is stored in its 'SERVER' environment variable and 
// then will send a message to the server.

// Because zmq was previously installed to the project (see below), 
// workers don't need to reinstall it.
var zmq = require('zmq');
var sense = require('sense');

// Connect to the master
var sock = zmq.socket('req');
console.log('Connecting to master...');
sock.connect(process.env.SERVER);

// Handle replies
sock.on("message", function(msg) {
  sense.display(sense.html('<b>Received reply: ' + msg.toString() + '</b>'));
});

// Send a message
sock.send('Sense is so easy!');
```

Finally, execute the following code in a dashboard.

```javascript
var sense = require("sense");
var nWorkers = 3;

// Create the ZeroMQ server.
var zmq = require("zmq");
var sock = zmq.socket("rep");

// Use 'getNetworkInfo' to find out the private IP address of the current
// dashboard in the project's virtual private network.
var address = "tcp://" + sense.networkInfo().projectIP + ":5000";
sock.bindSync(address);

// Listen for worker messages.
var responses = 0;
sock.on("message", function(msg) {
  sense.display(sense.html("<b>Received request: " + msg.toString() + "</b>"));
  sock.send("I agree.");

  // When all workers have sent messages, stop them.
  responses++;
  if (responses === nWorkers) {
    sense.stopWorkers(console.log);
  }
});

// Use 'launchWorkers' to start three small worker dashboards. The above
// code is sent to each, and the current dashboard's project IP address is
// stored in each worker's environment as 'SERVER', so each worker will contact
// the current dashboard.
var workers = sense.launchWorkers({
  n: nWorkers,
  size: 0,
  script: "worker-script.js",
  env: {"SERVER": address}
}, console.log);

```
## API

### Widgets and display

A widget is an object that appears as rendered HTML when dropped at the console. You can create widgets using the functions `code`, `html`, `iframe`, `image` and `markdown`:

```javascript
var sense = require('sense');

var x = sense.iframe({
  width: "500px",
  height: "250px",
  src: "https://npmjs.org"
});

// Pasting this into the Sense console will show an iframe
// containing the npm homepage.
x;
```

The five widget-generating functions are documented below. The `display` function, when applied to any widget, displays it in the console:

```javascript
// This string will show up in the console as unformatted text.
sense.display("See the iframe below for the npm homepage.");

// The IFrame widget just produced will show up as rendered HTML again.
sense.display(x);
```

You can also create a widget by equipping an arbitrary object with a `toWidget` method, which should return another widget:

```javascript
var y = {toWidget: function() {return x;}};

// Pasting this into the Sense console will show the same iframe again.
y;
```

### code

Returns a widget that appears as syntax-highlighted code.

```javascript
var sense = require("sense");
sense.code(params);
```

The parameters should be an object with the following keys:

* **code**: A string containing code.
* **language**: A string identifying the language, for example 'javascript'.

### html
Returns a simple HTML widget. The HTML code must pass [AngularJS' $sanitise function](http://docs.angularjs.org/api/ngSanitize.$sanitize).

```javascript
var sense = require("sense");
sense.html(html);
```

### iframe

Returns a widget containing arbitrary HTML.

```javascript
var sense = require("sense");
sense.iframe(params);
```

The parameters should be an object with the following keys:

* **src**: A valid iframe src attribute. On Sense, relative paths are relative to the CDN; for example, `"folder/widget.html"` resolves to the file in the dashboard's cdn folder at `/cdn/folder/widget.html`. If it is a URL, it must be https, not plain http.
* **height**: The height of the iframe, in a valid CSS format.
* **width**: The width of the iframe, in a valid CSS format.

### image

Returns a widget that appears as an image.

```javascript
var sense = require("sense");
sense.image(params);
```

The parameters should be an object with the following keys:

* **src**: A valid image 'src' attribute. On Sense, relative paths are relative to the CDN; for example, `"folder/image.png"` resolves to the file in the dashboard's cdn folder at `/cdn/folder/image.png`. If it is a URL, it must be https, not plain http.
* **height**: The height of the displayed image, in a valid CSS format.
* **width**: The width of the displayed image, in a valid CSS format.
* **alt** [optional]: The alt parameter for the image.
* **title** [optional]: The title of the image.


### markdown

Returns a widget that appears as rendered [markdown](http://daringfireball.net/projects/markdown/).

```javascript
var sense = require("sense");
sense.markdown(markdown);
```

### help
Displays HTML through the Sense help system. Does not return a widget.

```javascript
var sense = require("sense");
sense.help(html);
```

### install

Asynchronously installs an [npm](http://npmjs.org) package to the project. 

```python
var sense = require("sense");
sense.install(package_name, function(err, consoleOutput){...});
```

### networkInfo

Returns the current dashboard's contact information 
in an object with keys `publicDns`, `publicPortMapping`, `sshPassword`, `publicSshPort` and 
`projectIP`.

```javascript
var sense = require("sense");
var info = sense.networkInfo();
```

Every project has its own [virtual private network (VPN).](http://en.wikipedia.org/wiki/Virtual_private_network)
The project IP address is bound to the project VPN and is only accessible to 
other dashboards in the same project. The project VPN makes it easy to 
use cluster computing frameworks that lack built-in security features, 
such as [MPI](http://en.wikipedia.org/wiki/Message_Passing_Interface).

The public DNS hostname, public port mapping and SSH password describe how 
the current dashboard can be contacted from outside the project. The public 
port mapping is an object whose  keys and values are integers. Only ports 
that are keys of the public port mapping can be accessed via the public DNS 
hostname.  If you run a service on port 3000, for example, it  can be accessed 
from anywhere on the internet on the public DNS hostname and port 
`publicPortMapping[3000]`.

If required, you can SSH to dashboards using the public DNS hostname and port
`publicSshPort` with username "sense" and the SSH password.

### launchWorkers

Asynchronously launches worker dashboards into the cluster. 

```javascript
var sense = require("sense");
sense.launchWorkers(params, function(errors, info){...});
```    

In Sense, a cluster is a group of dashboards with the same master dashboard.  
Worker dashboards multiplex their outputs to the master and are cleaned up
automatically when the master is stopped or fails.  These features
make it easy to manage, monitor and debug distributed applications
on Sense.

The parameters should be an object with the following keys:

* **n**: The number of workers to launch.
* **size** (optional): The size of the workers, from 0 to 16.
* **engine** (optional): The name of the engine to use. Defaults to 
  "nodejs", but workers can run other engines too.
* **script** (optional): A script file that the worker should
  execute on launch. The path is relative to the project's home folder.
* **code** (optional): Code that the worker should execute on 
  launch. If both are provided, script has precedence over code.
* **env** (optional): An object containing environment variables that should be
  set on the workers before any code is executed. This is the preferred way 
  to send a master's contact information information to workers.

If there are no errors, the value passed to the callback is an array of objects. Each object describes one of the workers that was launched and contains keys such as `"id"`, `"engine"`, `"status"`, etc. The full format is documented [here.](http://help.senseplatform.com/api/rest#retrieve-dashboard)

### listWorkers

Asynchronously retrieves information on the worker dashboards in the cluster in an 
array of objects like that provided by launchWorkers.

```javascript
var sense = require("sense");
sense.listWorkers(function(err, info){...});
```

### getMaster

Asynchronously retrieves information on the cluster's master dashboard in an object like the ones provided by launchWorkers.

```javascript
var sense = require("sense");
sense.getMaster(function(err, info){...});
```

### stopWorkers

Asynchronously stops worker dashboards.

```javascript
var sense = require("sense");

// To stop specific workers:
sense.stopWorkers([id1, id2, ...], function(errors, info) {...});

// To stop all workers in the cluster:
worker.info <- sense.stopWorkers(function(errors, info) {...});
```

Dashboards' numerical IDs are available at key `id` in the objects provided by 
listWorkers and launchWorkers. The value passed to the callback is an array of the same type as that provided by listWorkers.

### getAuth

Returns authentication information for the [REST API](https://help.senseplatform.com/api/rest)
as an object with keys `"user"` and `"password"`.

Sense's REST API gives you complete programmatic 
control over virtually every aspect of Sense. Most REST calls require 
[Basic Authentication](http://en.wikipedia.org/wiki/Basic_access_authentication).
 To make authenticated REST calls, supply 
the information returned by getAuth your HTTP client of choice, such as [request](https://github.com/mikeal/request). 

By default getAuth uses the environment variable SENSE_API_TOKEN for
authentication. This token restricts access to the current project. 
For access across projects, you can pass in credentials manually 
or set SENSE_USERNAME and SENSE_PASSWORD in the environment. To better 
understand these options, read the [Understanding Project Security](http://help.senseplatform.com/understanding-project-security)
documentation.

#### Authenticated REST Example

This example retrieves information about the current project:

```javascript
var sense = require("sense");
var request = require('request');

var auth = sense.getAuth();

var url = process.env.SENSE_PROJECT_URL;

request({
  method: "GET",
  url: url,
  json: {},
  auth: auth,
}, function(err, response, body) {...});

```

The environment variables used in this example are common to all dashboards,
across all engines, and are documented [here](https://docs.senseplatform.com/getting-started/#environment).

# Support

* **Documentation**: http://help.senseplatform.com
* **Email**: support@senseplatform.com
* **Twitter**: https://twitter.com/senseplatform
* **Google Group**: https://groups.google.com/forum/?fromgroups#!forum/sense-users
* **IRC**: `#senseplatform` on `irc.freenode.net`

# License

MIT
