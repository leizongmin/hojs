/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */


module.exports = function (project, mod, router) {

  router.get('/', (req, res, next) => {
    res.send(new Date);
  });

};
