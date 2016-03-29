'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

function jsonStringify(data, space) {
  var seen = [];
  return JSON.stringify(data, function (key, val) {
    if (!val || typeof val !== 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  }, space);
}

function makeSchemaNav(schema) {
  return (
    <div className="nav-item" key={schema.id}>
      <a href={`#${schema.id}`}>{schema.route} {schema.title}</a>
    </div>
  );
}

function makeSchemaDocs(schema) {
  return (
    <div className="schema" key={schema.route} id={schema.id}>
      <h2 className="title"><a href={`#${schema.id}`}>{schema.route} {schema.title}</a></h2>
      <div className="group">分组：{schema.group}</div>
      <div className="description">{schema.description}</div>
      <div className="block">
        <div className="block-title">请求参数</div>
        {
          Object.keys(schema.params).map(name => {
            const info = schema.params[name];
            return (
              <div className="param-item" key={name}>
                <span className="param-name">{name}</span>
                <span className="param-type">{info.type}</span>
                <span className="param-comment">{info.comment}</span>
              </div>
            );
          })
        }
      </div>
      <div className="block">
        <div className="block-title">必须参数</div>
      {
        schema.required.map(name => {
          return (
            <div key={name}>
              <span className="param-name">{name}</span>
            </div>
          );
        })
      }
      {
        schema.requiredOneOf.map(names => {
          return (
            <div key={names}>
              <span className="param-name">{names.join(', ')} 其中一个</span>
            </div>
          );
        })
      }
      </div>
      <div className="block">
        <div className="block-title">使用示例</div>
        {
          schema.examples.map(({input, output}, i) => {
            return (
              <div className="example" key={i}>
                <pre key={`input-${i}`}>input = {jsonStringify(input, 2)};</pre>
                <pre key={`output-${i}`}>output = {jsonStringify(output, 2)};</pre>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

class App extends React.Component {
  render() {

    DOCS_DATA.schemas.forEach(v => {
      v.route = `${v.method.toUpperCase()} ${v.path}`;
      v.id = `[${v.method.toUpperCase()}]${v.path}`;
    });
    const list = DOCS_DATA.schemas.map(makeSchemaDocs);
    const nav = DOCS_DATA.schemas.map(makeSchemaNav);

    return (
      <div className="container">
        <div className="nav">
          <div className="fixed">{nav}</div>
        </div>
        <div className="schemas">{list}</div>
      </div>
    );
  }
}


ReactDOM.render(<App />, document.getElementById('app'));
