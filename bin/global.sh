#!/bin/sh 
":" //# comment; exec /usr/bin/env node --no-warnings "$0" "$@"

const Generator = require('../index');

const generator = new Generator();
generator.init(process.argv);
