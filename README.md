# Javascript Engine for Sense

[![Build Status](https://travis-ci.org/SensePlatform/sense-js-engine.png)](https://travis-ci.org/SensePlatform/sense-js-engine)

This module implements a JavaScript (NodeJS) engine for 
[Sense](https://senseplatform.com) using Sense's 
[Engine API](https://github.com/SensePlatform/sense-engine). 
It is preinstalled on Sense.

## Installation and usage

You can install this engine locally using

```
npm install sense-js-engine
```

You can test it from the command line using

```
grunt test
```

If you install the module in your projects `/home/sense`, it will
override the default JavaScript engine and can be used from with
Sense. You can also install it in a subfolder and use `npm link` to
link it to your projects main node_modules folder.

## Implementation overview

This module provides a complete example of how to implement an engine
for Sense.

The engine evaluates code chunks in a subprocess, keeping the main
process's event loop relatively free. This allows the engine to
receive interrupt events and emit output while code chunks are
running.

Each engine must define the `chunk` method, providing a 'chunker': a
function that splits long strings of code into logical units such as
statements and block  comments. This engine's chunker uses the
[acorn](https://github.com/marijnh/acorn) parser with the  [comment-
chunk-helper](https://github.com/SensePlatform/comment-chunk-helper)
package.

While evaluating code chunks, the subprocess generates output, which
it sends to the engine according to its type using [`process.send`](ht
tp://nodejs.org/api/child_process.html#child_process_child_send_messag
e_sendhandle). When the subprocess has finished evaluating a code
chunk, it sends an output message of type 'result', indicating that it
is ready for the next code chunk.

The engine itself communicates with the frontend using the methods
defined in the [engine API](https://github.com/SensePlatform/sense-
engine).
