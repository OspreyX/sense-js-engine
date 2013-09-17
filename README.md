# Javascript Engine for Sense

[![Build Status](https://travis-ci.org/SensePlatform/sense-js-engine.png)](https://travis-ci.org/SensePlatform/sense-js-engine)

This module implements Javascript (NodeJS) engine for [Sense](https://senseplatform.com) using Sense's 
[Engine API](https://github.com/SensePlatform/sense-engine). It allows users to run JavaScript dashboards
on Sense. It is preinstalled.

## Implementation Details 

This module provides a complete example of how to implement an engine on Sense.

This module evaluates code chunks in a subprocess. This keeps the main process's event loop 
relatively free, allowing it to receive interrupt events and emit output while code chunks are running.
The code chunker is based on the [acorn](http://github.com/marijnh/acorn) parser.

You can install this engine locally using:

```
npm install sense-js-engine
```

You can test it from the command line using,

```
grunt test
```

If you install the module in your projects `/home/sense`, it will override the default JavaScript engine and
can be used from with Sense.  You can also install it in a subfolder and use `npm link` to link it to your projects
main node_modules folder.
