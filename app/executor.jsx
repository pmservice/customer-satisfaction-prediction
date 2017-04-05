/* eslint-env es6

   Copyright 2016 IBM Corp.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const React = require('react');
const ReactDOM = require('react-dom');
const Dropzone = require('react-dropzone');

var Loader = React.createClass({
  render: function () {
    return (
      <svg viewBox="25 25 50 50" className="loader loader--dark">
        <circle r="20" cy="50" cx="50" className="loader__path">
        </circle>
      </svg>
    );
  }
});

var LoaderImpl = React.createClass({
  getInitialState: function () {
    return {
      loadingVisible: false
    };
  },

  render: function () {
    let loading = null;
    if (this.state.loadingVisible === true) {
      loading = (
        <div className="loadingOverlayContainer">
          <div className="loadingContainer">
            <Loader />
          </div>
        </div>
      );
    }
    return loading;
  }
});

var ModelContainer = React.createClass({
  getInitialState: function () {
    return {
      streams: [],
      selectedStreamData: null,
      selectedTable: null
    };
  },

  componentDidMount: function () {
    mainLoader.setState({
      loadingVisible: true
    });
    this.serverRequest = $.get('/env/models', function (result) {
      this.setState({
        streams: result
      });
      mainLoader.setState({
        loadingVisible: false
      });
    }
    .bind(this))
    .fail(function (jqXHR, textStatus, errorThrown) {
      mainLoader.setState({
        loadingVisible: false
      });
    });
  },

  componentWillUnmount: function () {
    this.serverRequest.abort();
  },

  _prepareInputInfo: function (data) {
    let values = [];
    Object.keys(data).forEach(function (key) {
      values.push(key + ' (' + data[key] + ')');
    });
    return values.join(', ');
  },

  _onStreamSelectChange: function (event) {
    ReactDOM.render(<div className="format-info"></div>, document.getElementById('inputFormat'));
    if (document.getElementById('tableSelect') != null)
      document.getElementById('tableSelect').selectedIndex = 0;

    let selectedStreamData = JSON.parse(event.target.value);
    let selectedTable = null;
    if (Object.keys(selectedStreamData.tableData).length === 1) {
      let tableName = Object.keys(selectedStreamData.tableData)[0];
      let headerData = selectedStreamData.tableData[tableName];
      selectedTable = {
        name: tableName,
        headerData: headerData
      };
      ReactDOM.render(<div className="format-info"> {'Format: ' + this._prepareInputInfo(headerData)} </div>, document.getElementById('inputFormat'));
    }

    this.setState({
      selectedStreamData: selectedStreamData,
      selectedTable: selectedTable
    });
  },

  _onTableSelectChange: function (event) {
    let selectedTable = JSON.parse(event.target.value);
    ReactDOM.render(<div className="format-info"> {'Format: ' + this._prepareInputInfo(selectedTable.headerData)} </div>, document.getElementById('inputFormat'));
    // user requested to hardcode examples
    var inputTextVal = '';
    if (this.state.selectedStreamData.id === 'drug1N') {
      inputTextVal = '35,F,HIGH,NORMAL,0.697,0.056';
    }
    this.setState({
      selectedTable: selectedTable
    });
    inputComponent.setState({
      inputText: inputTextVal
    });
    inputComponent.forceUpdate();
  },

  render: function () {
    let tableSelect = null;
    if (this.state.selectedStreamData != null && Object.keys(this.state.selectedStreamData.tableData).length > 1) {
      let context = this;
      tableSelect = (
        <select id="tableSelect" onChange={this._onTableSelectChange} className="form-control model-select">
          <option disabled selected key="select a branch"> -- select a branch -- </option>
          {Object.keys(this.state.selectedStreamData.tableData).map(function (tableName) {
            return (
              <option value={JSON.stringify({name: tableName, headerData: context.state.selectedStreamData.tableData[tableName]})} key={tableName}>{tableName}</option>
            );
          })}
        </select>
      );

    }

    let data = this.state.streams;
    return (
      <div id="model-select-container">
        <select id="streamSelect" onChange={this._onStreamSelectChange} className="form-control model-select">
          <option disabled selected key="select a model"> -- select a model -- </option>
          {data.map(function (entry) {
            return (
              <option value={JSON.stringify(entry)} key={entry.id}>{entry.stream}</option>
            );
          })}
        </select>
        {tableSelect}
      </div>
    );
  }
});

var Text = React.createClass({
  render: function () {
    return (
      <label className="control-label">{this.props.label} {this.props.value}</label>
    );
  }
});

var ExpandingText = React.createClass({
  getInitialState: function () {
    return {
      show: false
    };
  },

  _expand: function () {
    this.setState({
      show: !this.state.show
    });
  },

  render: function () {
    var msgStyle = {
      color: 'red',
      cursor: React.Children.count(this.props.children) > 0 ? 'help' : 'default'
    };
    var detailsStyle = {
      marginLeft: '40px',
      display: this.state.show ? 'block' : 'none'
    };
    return (
      <div>
        <p style={msgStyle} onClick={this._expand}>{this.props.val}</p>
        <div style={detailsStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
});

var Input = React.createClass({
  getInitialState: function () {
    return {inputText: ''};
  },
  _handleChange: function (event) {
    let val = event.target.value;
    if (typeof val !== 'undefined') {
      this.setState({inputText: val});
    }
  },
  _onDrop: function (files) {
    let reader = new FileReader();
    let file = files[0];
    reader.onload = (evt, isCsv = file.name.endsWith('.csv')) => {
      let inputs = evt.target.result;
      // for .csv files remove the header (first line)
      if (isCsv) {
        inputs = inputs.slice(inputs.indexOf('\n')).trim();
      }
      inputComponent.setState({inputText: inputs});
      inputComponent.forceUpdate();
    };
    reader.readAsText(file);
  },
  validate: function () {
    try {
      return this.state.inputText.trim() !== '';
    } catch (err) {
      return false;
    }
  },

  render: function () {
    let textareaStyle = {};
    if (this.state.inputText === '') {
      textareaStyle = {
        backgroundImage: 'url(images/upload.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      };
    }
    return (
      <Dropzone style={{width: '100%'}} multiple={false} disablePreview={true} disableClick={true} accept=".csv, text/plain" onDrop={this._onDrop} ref="dropzone">
        <div>
          <textarea
            style={textareaStyle}
            required className='form-control ioTextStyle' rows="6" value={this.state.inputText}
            onChange={this._handleChange}
            onDoubleClick={() => {this.refs.dropzone.open();}} >
          </textarea>
        </div>
      </Dropzone>
    );
  }
});

var ScoreTable = React.createClass({
  getInitialState: function () {
    return {
      hideColumns: true
    };
  },

  componentDidMount: function () {
    window.onresize = function () {
      this._scoreTableAdjustment();
    };
    this._scoreTableAdjustment();
  },

  _scoreTableAdjustment: function () {
    document.getElementById('scoreDiv').style.width = (0.9 * document.body.clientWidth).toString() + 'px';
  },

  render: function () {
    let ctx = this;
    let propsData = JSON.parse(this.props.data);
    let {data, header} = propsData;
    let showHideButtons;
    if (this.props.hideableColumns) {
      if (this.state.hideColumns) {
        data = data.map((row) => row.filter((e, i) => !this.props.hideableColumns.includes(i)));
        header = header.filter((e, i) => !this.props.hideableColumns.includes(i));
      }
      showHideButtons = (
        <div>
          {this.props.hideableColumns.map(i =>
            <button className='btn btn-primary' onClick={() => { ctx.setState({hideColumns: !ctx.state.hideColumns}) }}>{ctx.state.hideColumns ? 'Show' : 'Hide'} {propsData.header[i]}</button>
          )}
        </div>
      );
    }
    return (
      <div>
        <label className="control-label" htmlFor="focusedInput">Output data</label>
        {showHideButtons}
        <div id="scoreDiv" className="ioTextStyle">
          <table id="scoreTable" className="table table-bordered light-color2">
            <thead>
              <tr>
                {header.map(function (entry) {
                  return <th>{entry}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {data.map(function (row) {
                return (
                  <tr>
                    {row.map(function (entry) {
                      return <td>{entry}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

function _validateForm() {
  let selectResult = $('#modelCntn select').val();
  if (typeof selectResult === 'undefined' || selectResult === null) {
    _showError('Select model from a list.');
  } else if (!inputComponent.validate()) {
    _showError('Provide valid input data.');
  } else {
    return true;
  }
  return false;
}

function _showError(message) {
  alert.warn(message);
}

var RunButton = React.createClass({
  _updateResponse: function (e) {
    alert.clear();
    e.preventDefault();

    if (!_validateForm()) {
      return;
    }
    mainLoader.setState({
      loadingVisible: true
    });
    ReactDOM.render(
      <p>Waiting for a score....</p>,
      document.getElementById('scoringCntn')
    );
    var streamResult = modelComponent.state.selectedStreamData;
    var tableResult = modelComponent.state.selectedTable;
    var contextId = streamResult.id;
    var data = {};
    data.scoringData = $('#inputCntn textarea').val().trim();
    data.tableName = tableResult.name;
    $.post('/env/score/' + contextId, data, function (response) {
      mainLoader.setState({
        loadingVisible: false
      });
      let data = JSON.stringify(response[0]);
      let hideableColumns = response[0].header.findIndex((e) => {
        return (e === 'Churn' || e === 'Actual Churn')
      });
      ReactDOM.render(
        <ScoreTable data={JSON.stringify(response[0])} hideableColumns={[hideableColumns]}/>,
        document.getElementById('scoringCntn')
      );
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      mainLoader.setState({
        loadingVisible: false
      });
      /* extract error */
      let err = [jqXHR];
      try {
        err = err[0].responseJSON.error.split(/(?:,\smsg=|,\sdetails:)/);
      } catch (e) {
        // suppress
      }
      ReactDOM.render(<p></p>, document.getElementById('scoringCntn'));
      _showError(err.length > 1 && err[1] != 'null' ? err[1] : 'Undefined error');
    });
  },

  render: function () {
    return (
      <button type="button" onClick={this._updateResponse} className="btn btn-primary">Get score</button>
    );
  }
});

var AlertImpl = React.createClass({
  getInitialState: function () {
    return {
      errorMsg: '',
      display: false
    };
  },

  warn: function (msg) {
    this.setState({
      errorMsg: msg,
      display: true
    });
  },

  clear: function () {
    this.setState({
      errorMsg: '',
      display: false
    });
  },

  render: function () {
    if (!this.state.display)
      return null;
    else
      return (
        <div className="alert alert-warning">
          <a href="#" className="close" onClick={this.clear} data-dismiss="alert" aria-label="close">&times;</a>
          <strong>Warning!</strong> {this.state.errorMsg}
        </div>
      );
  }
});

var mainLoader = ReactDOM.render(<LoaderImpl />, document.getElementById('loader'));
ReactDOM.render(<RunButton />, document.getElementById('runButton'));

var modelComponent = ReactDOM.render(<ModelContainer />, document.getElementById('modelCntn'));
var inputComponent = ReactDOM.render(<Input />, document.getElementById('inputCntn'));
var alert = ReactDOM.render(<AlertImpl />, document.getElementById('alert'));
