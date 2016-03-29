'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import createDebug from 'debug';

export function debug(name) {
  return createDebug('hojs:' + name);
};

export var core = debug('core');
export var schema = debug('schema');
