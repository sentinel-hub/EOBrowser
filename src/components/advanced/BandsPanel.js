import React from 'react';
import PropTypes from 'prop-types';
import dragula from 'react-dragula';
import 'react-dragula/dist/dragula.min.css';
import './bands.scss';

class BandsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.dragula = null;
  }

  getChannel(value, key) {
    return this.props.channels.filter(obj => obj[key] === value)[0];
  }

  getWarning() {
    if (this.props.channels.find(ch => ch === 'NULL')) {
      return (
        <div id="warning" className="notification">
          <i className="fa fa-warning" />
          You need to fill all three channels to provide Sentinel imagery.
        </div>
      );
    }
  }

  componentWillUnmount() {
    if (this.dragula) {
      this.dragula.destroy();
    }
  }

  componentDidMount() {
    let colorsHolder = this.refs.colorsHolder;
    let colTarR = this.refs.colTarR;
    let colTarG = this.refs.colTarG;
    let colTarB = this.refs.colTarB;

    let layers = this.props.layers;
    this.dragula = dragula([colorsHolder, colTarR, colTarG, colTarB], {
      moves: function(el, target) {
        return target === colorsHolder;
      },
      accepts: function(el, target, source, sibling) {
        return target !== colorsHolder;
      },
      copy: true,
    })
      .on('drop', (el, target, source, sibling) => {
        if ([colTarR, colTarG, colTarB].indexOf(source) > -1) {
          source.childNodes[0].parentNode.removeChild(source.childNodes[0]);
          layers[source.dataset.colPrefix] = 'NULL';
        }
        if (target !== colorsHolder && target !== null) {
          layers[target.dataset.colPrefix] = el.textContent;
        }

        if (target !== null) {
          if (target.childNodes.length > 1) {
            for (let i = 0; i < target.childNodes.length; i++) {
              let child = target.childNodes[i];
              if (el !== child && child !== undefined) {
                child.parentNode.removeChild(child);
              }
            }
          }
        }

        document.getElementById('colorsWrap').classList.remove('ondrag');
        this.props.onDrag(layers);
      })
      .on('drag', (el, source) => {
        if (colorsHolder === source) {
          document.getElementById('colorsWrap').classList.add('ondrag');
        }
      });
  }

  render() {
    let { layers, channels } = this.props;
    return (
      <div id="colorsWrap">
        <p>Drag bands onto RGB fields.</p>
        <div className="colorsContainer" ref="colorsHolder" id="colorsHolder">
          {channels.map((channel, i) => (
            <div
              key={i}
              className="bandItem"
              title={channel.description}
              style={{ backgroundColor: channel.color }}
            >
              {channel.name}
            </div>
          ))}
        </div>
        <div id="colorsOutput" ref="colorsOutput">
          <b>R:</b>
          <div className="colHolder" data-col-prefix="r" ref="colTarR" id="oR">
            <div
              style={{
                backgroundColor: this.getChannel(layers.r, 'name').color,
              }}
              title={this.getChannel(layers.r, 'name').description}
            >
              {layers.r}
            </div>
          </div>
          <b>G:</b>
          <div className="colHolder" data-col-prefix="g" ref="colTarG" id="oG">
            <div
              style={{
                backgroundColor: this.getChannel(layers.g, 'name').color,
              }}
              title={this.getChannel(layers.g, 'name').description}
            >
              {layers.g}
            </div>
          </div>
          <b>B:</b>
          <div className="colHolder" data-col-prefix="b" ref="colTarB" id="oB">
            <div
              style={{
                backgroundColor: this.getChannel(layers.b, 'name').color,
              }}
              title={this.getChannel(layers.b, 'name').description}
            >
              {layers.b}
            </div>
          </div>
        </div>
        {this.getWarning()}
      </div>
    );
  }
}

BandsPanel.propTypes = {
  channels: PropTypes.array,
  layers: PropTypes.object,
  onDrag: PropTypes.func,
};

export default BandsPanel;
