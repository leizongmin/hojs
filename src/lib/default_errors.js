'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export default function (registerError) {

  registerError('other_error', {
    status: -1,
  });

  registerError('missing_required_parameter', {
    status: -2,
    message: (msg, data) => `missing required parameter ${data.name}${msg ? ': ' + msg : ''}`,
  });

  registerError('parameter_error', {
    status: -3,
    message: (msg, data) => `incorrect parameter ${data.name}${msg ? ': ' + msg : ''}`,
  });

};
