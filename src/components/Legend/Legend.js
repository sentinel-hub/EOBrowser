import React from 'react';
import axios, { CancelToken, isCancel } from 'axios';

import { createGradients } from '../../utils/legendUtils';

import './Legend.scss';

export default class Legend extends React.Component {
  render() {
    const { legendFromSpec, legendDefinitionJsonUrl, legendUrl, onLoadError } = this.props;
    return (
      <div className="layer-legend">
        {legendFromSpec ? (
          <LegendFromSpec legend={legendFromSpec} />
        ) : legendDefinitionJsonUrl ? (
          <LegendFromDefinitionJson legendDefinitionJsonUrl={legendDefinitionJsonUrl} />
        ) : (
          legendUrl && <LegendFromGraphicsUrl legendUrl={legendUrl} onLoadError={onLoadError} />
        )}
      </div>
    );
  }
}

/*
Generates legends by using url pointing to legend's json definition
*/
class LegendFromDefinitionJson extends React.Component {
  static defaultProps = {
    legendDefinitionJsonUrl: null,
  };
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      legend: null,
      error: null,
    };
    this.cancelTokenSource = CancelToken.source();
  }

  loadLegendDefinition(url) {
    const newPromise = new Promise((resolve, reject) => {
      axios(url, {
        cancelToken: this.cancelTokenSource.token,
      })
        .then(res => resolve(res.data))
        .catch(e => reject(e));
    });
    return newPromise;
  }

  componentDidMount() {
    let { legendDefinitionJsonUrl } = this.props;
    this.setState({
      loading: true,
    });

    this.loadLegendDefinition(legendDefinitionJsonUrl)
      .then(legend => this.setState({ legend: legend, loading: false }))
      .catch(error => {
        if (!isCancel(error)) {
          this.setState({ error, loading: false });
        }
      });
  }

  componentWillUnmount() {
    if (this.state.loading) {
      this.cancelTokenSource.cancel('Operation cancelled by user.');
    }
  }

  render() {
    const { loading, legend, error } = this.state;
    if (loading) {
      return <i className="fa fa-spinner fa-spin fa-fw" />;
    }
    if (error) {
      return <p>Error while loading legend data.</p>;
    }
    if (legend) {
      return <LegendFromSpec legend={legend} />;
    }
    return null;
  }
}
/*
Generates legend by using url to standard getLegendGraphics request or
any other image
*/
class LegendFromGraphicsUrl extends React.Component {
  static defaultProps = {
    legendUrl: null,
    onLoadError: () => {},
  };
  state = {
    error: false,
    loading: true,
  };

  handleError = () => {
    this.setState({ error: true, loading: false });
    this.props.onLoadError();
  };

  render() {
    const { error, loading } = this.state;
    const { legendUrl } = this.props;
    if (error) {
      return null;
    }
    if (loading) {
      return <i className="fa fa-spinner fa-spin fa-fw" />;
    }
    return (
      <img
        src={legendUrl}
        alt="legend"
        onError={this.handleError}
        onLoad={() => this.setState({ loading: false })}
      />
    );
  }
}

/*
Generates legend specified in layers_metadata.json file
*/
class LegendFromSpec extends React.Component {
  static defaultProps = {
    spec: null,
  };

  renderDiscreteLegend() {
    const { items } = this.props.legend;
    return items.map((legendItem, index) => (
      <div key={index} className="legend-item discrete">
        <div
          className="color"
          style={{
            backgroundColor: legendItem.color,
          }}
        />
        <label>{legendItem.label}</label>
      </div>
    ));
  }

  renderContinuousLegend() {
    const { legend } = this.props;
    const { minPosition, maxPosition, gradients } = createGradients(legend);
    const gradientsWithLabels = legend.gradients.filter(g => g.label !== undefined && g.label !== null);

    return (
      <div className="legend-item continuous">
        <div className="gradients">
          {gradients.map((g, index) => (
            <div
              key={index}
              className="gradient"
              style={{
                bottom: `${g.pos * 100}%`,
                height: `${g.size * 100}%`,
                background: `linear-gradient(to top, ${g.startColor}, ${g.endColor})`,
              }}
            />
          ))}
        </div>
        <div className="ticks">
          {gradientsWithLabels.map((g, index) => (
            <label
              key={index}
              className="tick"
              style={{
                bottom: `${((g.position - minPosition) / (maxPosition - minPosition) * 100).toFixed(1)}%`,
              }}
            >
              {g.label}
            </label>
          ))}
          {/*
            Labels are positioned absolutely, so they don't have width, which causes problems
            with positioning the layer description next to the legend. To solve this, we render
            duplicated (hidden) labels which only set the DOM element width:
          */}
          <div className="hidden-width-placeholders">
            {gradientsWithLabels.map((g, index) => (
              <label key={`${index}-hidden`} className="tick">
                {g.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  render() {
    try {
      const { items, gradients } = this.props.legend;
      if (gradients) {
        return this.renderContinuousLegend();
      }
      if (items) {
        return this.renderDiscreteLegend();
      }
      return null;
    } catch (err) {
      console.error(err);
      return <div>Error parsing legend data.</div>;
    }
  }
}
