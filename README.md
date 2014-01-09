# JavaScript Engine for Sense

[![Build Status](https://travis-ci.org/SensePlatform/sense-js-engine.png)](https://travis-ci.org/SensePlatform/sense-js-engine)

This module implements a JavaScript (Node.js) engine for 
[Sense](https://senseplatform.com) using Sense's 
[Engine API](https://github.com/SensePlatform/sense-engine). 
It is preinstalled on Sense.

![Sense JavaScript Engine](https://s3.amazonaws.com/sense-files/jsscreenshot.png)

## Installation and Usage

You can install this engine locally using

```
npm install sense-js-engine
```

You can test it from the command line using

```
grunt test
```

If you install this package in your project's `/home/sense`, it will
override the default JavaScript engine and can be used from Sense.

## Implementation Overview

This module provides a complete example of how to implement an 
[engine](https://github.com/SensePlatform/sense-engine) for Sense.

The engine evaluates code chunks in a subprocess, keeping the main
process's event loop relatively free. This allows the engine to
receive interrupt events and emit output while code chunks are
running.

Each engine must define the `chunk` method that splits long strings of 
code into logical units such as statements and block comments. This 
engine's chunker uses the [acorn](https://github.com/marijnh/acorn) parser with the 
[comment-chunk-helper](https://github.com/SensePlatform/comment-chunk-helper)
package.

While evaluating code chunks, the subprocess generates output, which
it sends to the engine according to its type using [`process.send`](h
ttp://nodejs.org/api/child_process.html#child_process_child_send_messa
ge_sendhandle). When the subprocess has finished evaluating a code
chunk, it sends an output message of type `result`, indicating that it
is ready for the next code chunk.

The engine itself communicates with the frontend using the methods
defined in the [Engine API](https://github.com/SensePlatform/sense-engine).

## Support

* Email: support@senseplatform.com
* Twitter: https://twitter.com/SensePlatform
* Google Group: https://groups.google.com/forum/?fromgroups#!forum/sense-users
* IRC: `#senseplatform` on `irc.freenode.net`

## LICENSE

MIT