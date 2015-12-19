/**
 * ho config
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

module.exports = function (ns) {

  ns('debug', false);

  ns('web.port', 3000);
  ns('web.assets', {
    maxAge: '365d',
  });

  ns('db.mysql', {
    host: '127.0.0.1',
    port: 3306,
    database: 'ho',
    user: 'ho',
    password: '',
    pool: 10,
  });

};
