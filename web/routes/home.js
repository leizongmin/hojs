/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */


$HO$.web.route.get('/', (req, res, next) => {

  //res.render('home');

  setTimeout(() => {
    res.send(new Date().getTime().toString() + '-BB');
  }, 0);

});
