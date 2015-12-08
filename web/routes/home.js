/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

$HO$.web.route.get('/', (req, res, next) => {
  res.json({date: new Date, value: Math.random()});
});
