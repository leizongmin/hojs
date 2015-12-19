'use strict';

/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const path = require('path');

let file = process.argv[2];
if (!file) throw new Error('please specified a filename');

require('babel-register');

require(path.resolve(file));

