'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

(function (global) {

  const RESTClient = global.RESTClient = {};

  if (!document.getElementById('RESTClient')) {
    const e = document.createElement('div');
    e.id = 'RESTClient';
    document.body.appendChild(e);
  }

  class ClientContainer extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        show: false,
        schema: null,
      };
      this.hide = () => {
        this.setState({show: false});
      };
    }

    render() {
      if (!this.state.show) {
        return null;
      }
      const schema = this.state.schema;
      return (
        <div className="fullscreen-modal">
          <h3>{schema.title}</h3>
          <p>调试界面暂时没空写，求Pull Request</p>
          <button onClick={this.hide}>关闭</button>
        </div>
      );
    }

  }
  RESTClient.ClientContainer = ClientContainer;

  RESTClient.ref = ReactDOM.render(<ClientContainer />, document.getElementById('RESTClient'));

  RESTClient.show = function (schema) {
    console.log(schema);
    RESTClient.ref.setState({
      show: true,
      schema: schema,
    });
  };


})(window);