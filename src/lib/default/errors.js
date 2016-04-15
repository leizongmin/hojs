'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export default function (registerError) {

  registerError('other_error', {
    description: 'other error',
    status: -1,
  });

  registerError('missing_required_parameter', {
    description: 'missing required parameter error',
    status: -2,
    message: (msg, data) => `missing required parameter ${data.name}${msg ? ': ' + msg : ''}`,
  });

  registerError('parameter_error', {
    description: 'parameter error',
    status: -3,
    message: (msg, data) => `incorrect parameter ${data.name}${msg ? ': ' + msg : ''}`,
  });

};
