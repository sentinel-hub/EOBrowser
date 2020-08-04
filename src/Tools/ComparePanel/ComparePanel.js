import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';
import dragula from 'react-dragula';
import 'react-dragula/dist/dragula.min.css';

import store, { compareLayersSlice } from '../../store';
import { NotificationPanel } from '../../junk/NotificationPanel/NotificationPanel';
import ComparedLayer from './ComparedLayer';

import './ComparePanel.scss';

export const COMPARE_SPLIT = t`split`;
export const COMPARE_OPACITY = t`opacity`;
const NO_COMPARE_LAYERS_MESSAGE = t`No layers to compare.`;

class ComparePanel extends Component {
  state = {
    compareMode: COMPARE_SPLIT,
  };

  onChangeCompareMode = e => {
    this.setState({
      compareMode: e.target.value,
    });
    store.dispatch(compareLayersSlice.actions.resetOpacityAndClipping());
  };

  removeAll = () => {
    store.dispatch(compareLayersSlice.actions.setComparedLayers([]));
  };

  dragulaDecorator = componentBackingInstance => {
    if (componentBackingInstance) {
      const drake = dragula([componentBackingInstance], {
        moves: (el, container, handle) => {
          if (
            handle.classList.contains('compare-drag-handler') ||
            handle.classList.contains('compare-drag-handler-icon')
          ) {
            return true;
          }
        },
      });

      drake.on('drop', (el, target, source, sibling) => {
        const droppedLocation = Array.from(el.parentNode.children).indexOf(el);
        drake.cancel(true);
        this.onDrop(el.id, droppedLocation);
      });
    }
  };

  onDrop = (oldIndex, newIndex) => {
    store.dispatch(compareLayersSlice.actions.updateOrder({ oldIndex: oldIndex, newIndex: newIndex }));
  };

  addAllPins = () => {
    const { pins } = this.props;
    store.dispatch(compareLayersSlice.actions.addComparedLayers(pins.map(p => p.item)));
  };

  render() {
    const { compareMode } = this.state;
    const { comparedLayers, comparedOpacity, comparedClipping, pins } = this.props;

    return (
      <div className="compare-panel">
        <div className="compare-panel-header">
          <div className={`remove-all ${comparedLayers.length === 0 && 'disabled'}`} onClick={this.removeAll}>
            <i className="fa fa-trash" />
            {t`Remove all`}
          </div>
          <div className={`add-all-pins ${pins.length === 0 && 'disabled'}`} onClick={this.addAllPins}>
            <i className="fa fa-plus-square" />
            {t`Add all pins`}
          </div>
          <div className="compare-panel-toggle">
            <select className="dropdown" value={compareMode} onChange={this.onChangeCompareMode}>
              <option key={0} value={COMPARE_SPLIT}>
                {t`Split`}
              </option>
              <option key={1} value={COMPARE_OPACITY}>
                {t`Opacity`}
              </option>
            </select>
          </div>
        </div>

        <div className="compare-layers-list" ref={this.dragulaDecorator}>
          {comparedLayers.map((layer, i) => (
            <ComparedLayer
              id={i}
              key={`${i}-${layer.id}`}
              index={i}
              layer={layer}
              compareMode={compareMode}
              onDrop={this.onDrop}
              handleTouchMove={this.handleTouchMove}
              opacity={comparedOpacity[i]}
              clipping={comparedClipping[i]}
            />
          ))}
        </div>

        {!comparedLayers.length && <NotificationPanel type="info" msg={NO_COMPARE_LAYERS_MESSAGE} />}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  comparedLayers: store.compare.comparedLayers,
  comparedOpacity: store.compare.comparedOpacity,
  comparedClipping: store.compare.comparedClipping,
  pins: store.pins.items,
});

export default connect(mapStoreToProps, null)(ComparePanel);
