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

// 注册字段类型
$.method.registerType('email', (v) => validator.isEmail(email));

// 注册 method
$.method('user.get')
.check({
  id: 'number',
  email: ['email', '用户邮箱'],
  name: [(v) => v.length > 4 && v.length < 20, '用户名'],
}, {
  required: [],                   // 必须包含的参数
  oneOf: [['id', 'email', 'name']], // 需要包含其中一个参数
  formatParams: true,             // 是否自动格式化输入参数，比如把为string的number转换为number
})
.register(function (params, callback) {
  // 方法主要代码
  callback(null, {id: params.id, name: `用户${params.id}`});
});

// 开启的POST请求参数编码方法
$.api.enable('json', 'multiparty', 'urlencoded');

// 返回API格式
$.api.output((err, ret, req, res, next) => {
  if (err) {
    res.json({status: err.code, error: err.data});
  } else {
    res.json({status: 1, result: ret});
  }
});

// 引入中间件
$.api.use((req, res, next) => {

});

// 注册 API
$.api.get('/user/:id',
  $.api.checkSign, // 使用内置的 checkSign 中间件来检查签名
  {
    method: 'user.get', // 需要调用 $.method('user.get') 来处理
    group: 'user',      // API 分组，用于自动生成文档
    description: '查询用户信息',  // API 说明
    examples: [         // 定义使用示例
      {
        input: {email: 'ooxx@qq.com'},
        output: {
          email: 'ooxx@qq.com',
          name: 'ooxx',
          id: '1',
          create_at: '2016-03-24 23:42:24',
        }
      }
    ],
  });
// 如果不包含生成文档需要的信息，也可简写成
// $.api.get('/user/:id', $.api.checkSign, 'user.get')
```

生成的文档如下：

-----

### user.get

查询用户信息

请求地址：`GET /user/:id`

请求参数 | 类型（验证方式）                          | 必填     | 说明
:-------|:---------------------------------------|:--------|:-----
id      | number                                 | 多选一   | 无
email   | email                                  | 多选一   | 用户邮箱
name    | `(v) => v.length > 4 && v.length < 20` | 多选一   | 用户名

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
