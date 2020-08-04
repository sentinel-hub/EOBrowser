import React from 'react';

import { createGradients } from './legendUtils';

/*
Generates legend specified in layers_metadata.js file
*/
export default class LegendFromSpec extends React.Component {
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
                bottom: `${(((g.position - minPosition) / (maxPosition - minPosition)) * 100).toFixed(1)}%`,
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
