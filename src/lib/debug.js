'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import createDebug from 'debug';

export function create(name) {
  return createDebug('hojs:' + name);
};

export var core = create('core');
export var schema = create('schema');
export var test = create('test');
