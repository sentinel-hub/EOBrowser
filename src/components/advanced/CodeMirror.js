import React from 'react';
import request from 'axios';
import Codemirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

class CodeMirror extends React.Component {
  constructor(props) {
    super(props);
    const { evalscript, isEvalUrl, evalscripturl = '' } = props;
    this.state = {
      evalscript,
      isEvalUrl,
      evalscripturl,
    };
  }

  updateCode = evalscript => {
    this.setState({ evalscript }, this.onCallback);
  };

  onCallback = () => {
    this.props.onChange(this.state);
  };

  selectEvalMode = isEvalUrl => {
    this.setState({ isEvalUrl }, this.onCallback);
  };

  updateUrl = e => {
    this.setState({ evalscripturl: e.target.value }, this.onCallback);
  };

  onKeyDown = e => {
    e.key === 'Enter' && this.loadCode();
  };
  loadCode = () => {
    const { loading, evalscripturl } = this.state;
    if (loading) return;
    this.setState({ loading: true });
    if (evalscripturl.includes('http://')) {
      return;
    }
    request
      .get(evalscripturl)
      .then(res => {
        const { data: text } = res;
        this.updateCode(text);
        this._CM.codeMirror.setValue(text);
        this.setState({ loading: false, success: true }, () => {
          this.onCallback();
          setTimeout(() => this.setState({ success: false }), 2000);
        });
      })
      .catch(e => {
        console.error(e);
        this.setState({ loading: false });
        this.setState({ error: 'Error loading script. Check your URL.' }, () => {
          setTimeout(() => this.setState({ error: null }), 3000);
        });
      });
  };

  render() {
    var options = {
      lineNumbers: true,
      mode: 'javascript',
      lint: true,
    };
    const { error, loading, success, evalscript, evalscripturl, isEvalUrl } = this.state;
    // const cleanUrl = window.decodeURIComponent(evalscripturl)
    const hasWarning = evalscripturl.includes('http://');

    return (
      <div style={{ clear: 'both' }}>
        <Codemirror
          value={evalscript || ''}
          onChange={this.updateCode}
          options={options}
          ref={el => (this._CM = el)}
        />
        {error && (
          <div className="notification">
            <i className="fa fa-warning" /> {error}
          </div>
        )}
        <div style={{ padding: 5, fontSize: 12 }}>
          <div title="Insert URL to your custom script">
            Script URL [?]:
            <span style={{ float: 'right', marginTop: '-3px' }}>
              <input
                type="checkbox"
                id="evalscriptUrlCB"
                onClick={e => this.selectEvalMode(e.target.checked)}
                checked={isEvalUrl}
              />
              <label htmlFor="evalscriptUrlCB" style={{ marginTop: '-3px' }}>
                Use URL
              </label>
            </span>
          </div>{' '}
          <input
            placeholder="Enter URL to your script"
            onKeyDown={this.onKeyDown}
            disabled={!isEvalUrl}
            style={{ width: 'calc(100% - 40px)' }}
            value={evalscripturl}
            onChange={this.updateUrl}
          />
          {success || hasWarning ? (
            <i
              title={success ? 'Script loaded.' : 'Only HTTPS domains are allowed.'}
              className={`fa fa-${success ? 'check' : 'warning'}`}
              style={{ marginLeft: 7 }}
            />
          ) : (
            <a onClick={this.loadCode}>
              <i className={`fa fa-refresh ${loading && 'fa-spin'}`} style={{ marginLeft: 7 }} />
            </a>
          )}
        </div>
        <div className="scriptBtnPanel">
          <button onClick={() => this.props.onRefresh()} className="btn">
            <i className="fa fa-refresh" />Refresh
          </button>
        </div>
      </div>
    );
  }
}
export default CodeMirror;
