# ho.js -- 基于 Express 的轻量级 RESTful API 服务器框架


## 安装

```bash
$ npm install hojs --save
```


## 使用方法

```javascript
'user strict';

import Hojs from 'hojs';
import validator from 'validator';

const $ = global.$ = new Hojs();

// 开启的POST请求参数编码方法
$.api.enable('json', 'multipart', 'urlencoded');

// 返回API格式
$.api.output((err, ret, req, res, next) => {
  if (err) {
    res.json({status: err.code, error: err.data});
  } else {
    res.json({status: 1, result: ret});
  }
});

// 引入全局中间件
$.api.use((req, res, next) => {
  // 默认传递参数覆盖优先级 req.apiParams > req.params > req.body > req.query
  // 通过 req.apiParams 来传递额外的参数给 API 处理函数，一般使用 $ 开头
  req.apiParams.$yes = true;
  next();
});

// 注册自定义检查类型
// 参数格式：(名称, 用于检查的函数, 参数说明)
$.api.registerType('email', (v) => validator.isEmail(email), '邮箱');
$.api.registerType('username', (v) => /^[a-z][a-z0-9_]{1,19}$/.test(v), '用户名');
$.api.registerType('loginUserInfo', (v) => {
  return v.id && v.email && v.name;
}, '登录信息');

// 注册 API
$.api
.get('/user/:id')
.title('查询用户信息')       // API标题
.description('')           // API 说明
.use($.api.checkSign)      // 使用内置的 checkSign 中间件来检查签名
.use(checkAccessToken)     // 使用 checkAccessToken 中间件检查用户登录情况
.group('user')             // API 分组，用于自动生成文档
.example({                 // API 使用示例
  input: {email: 'ooxx@qq.com'},
  output: {
    email: 'ooxx@qq.com',
    name: 'ooxx',
    id: '1',
    create_at: '2016-03-24 23:42:24',
  }
})
.params({
  $user: {
    type: 'loginUserInfo',
    comment: '通过`access_token`参数指定'
  },
  id: {
    type: 'number',
    format: true,
  },
  email: 'email',
  username: 'username',
})
.required('$user')                        // 必须提供的参数
.requiredOneOf('id', 'email', 'username') // 必须提供其中一个的参数
.register(async function (params) {       // API 处理函数
  return {id: params.id, name: `用户${params.id}`};
});
// 也可使用callback方式
// .register(function (params, callback) {
//   callback(null, {id: params.id, name: `用户${params.id}`});
// })

// 初始化
$.init();
```

生成的文档如下：

-----

### user.get

查询用户信息

请求地址：`GET /user/:id`

请求参数  | 类型（验证方式）     | 必填     | 说明
:--------|:------------------|:--------|:-----
$session | loginUserInfo     | 是      | 登录信息，通过`access_token`参数指定
id       | number            | 多选一   | 无
email    | email             | 多选一   | 用户邮箱
name     | username          | 多选一   | 用户名

说明：

+ `id`, `email`, `name` 这三个需要提交其中一个

返回格式：

```javascript
// 请求参数
input = {
  "email": "ooxx@qq.com"
}
// 返回结果
output = {
  "status": 1,
  "result": {
    "email": "ooxx@qq.com",
    "name": "ooxx",
    "id": "1",
    "create_at": "2016-03-24 23:42:24"
  }
}
```


-----


## License

```
The MIT License (MIT)

Copyright (c) 2016 Zongmin Lei <leizongmin@gmail.com>
http://ucdok.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
