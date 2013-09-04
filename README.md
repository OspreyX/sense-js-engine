## The Sense Platform's JavaScript engine

This module is an example implementation of the [Engine API](http://help.senseplatform.com/api/engines). It allows users to run JavaScript dashboards on the Sense Platform. It is preinstalled on Sense.

Note that this module evaluates code chunks in a subprocess. This keeps the main process's event loop relatively free, allowing it to receive interrupt events and emit output while code chunks are running. The code chunker is based on the [acorn](http://github.com/marijnh/acorn) parser.

You can test it from the command line using [the sense-dashboard package](http://github.com/SensePlatform/sense-dashboard). If you like, you can modify it and run dashboards using your modified version by installing it to a project's node_modules folder.
