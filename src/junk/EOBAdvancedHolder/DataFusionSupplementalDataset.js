import React from 'react';
import moment from 'moment';
import { t } from 'ttag';

import { EOBTimespanPicker } from '../EOBCommon/EOBTimespanPicker/EOBTimespanPicker';

export default class DataFusionSupplementalDataset extends React.Component {
  toggleEnabled = () => {
    const { settings } = this.props;
    const { enabled = false } = settings;
    this.props.onChange({
      ...settings,
      enabled: !enabled,
    });
  };

  updateMosaickingOrder = ev => {
    const { settings } = this.props;
    this.props.onChange({
      ...settings,
      mosaickingOrder: ev.target.value,
    });
  };

  toggleCustomTimespan = () => {
    const { settings } = this.props;
    const { isCustomTimespan = false } = settings;
    this.props.onChange({
      ...settings,
      isCustomTimespan: !isCustomTimespan,
    });
  };

  onTimespanChange = value => {
    const { settings } = this.props;
    const [from, to] = value.split('/');
    this.props.onChange({
      ...settings,
      timespan: [moment.utc(from), moment.utc(to)],
    });
  };

  render() {
    const {
      label,
      dataset,
      initialTimespan,
      additionalMosaickingOrders,
      settings: { enabled = false, mosaickingOrder = 'mostRecent', isCustomTimespan = false },
    } = this.props;
    return (
      <div className="supplemental-dataset">
        <input type="checkbox" id={`use-${dataset.id}`} checked={enabled} onChange={this.toggleEnabled} />
        <label htmlFor={`use-${dataset.id}`}>{label}</label>

        {enabled ? (
          <div className="datasource-info">
            <i className="fa fa-info-circle" />
            <span>{`Datasource alias in evalscript: "${dataset.shProcessingApiDatasourceAbbreviation.toLowerCase()}"`}</span>
          </div>
        ) : null}

        {enabled && (
          <div className="supplemental-dataset-settings">
            <div className="mosaicking-order">
              {t`Mosaicking order`}:
              <select className="dropdown" value={mosaickingOrder} onChange={this.updateMosaickingOrder}>
                <option value="mostRecent">{t`Most recent`}</option>
                <option value="leastRecent">{t`Least recent`}</option>
                {additionalMosaickingOrders.map(mo => (
                  <option key={mo.id} value={mo.id}>
                    {mo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="timespan">
              <input
                type="checkbox"
                id={`custom-timespan-${dataset.id}`}
                checked={isCustomTimespan}
                onChange={this.toggleCustomTimespan}
              />
              <label htmlFor={`custom-timespan-${dataset.id}`}>{t`Customize timespan`}</label>
              {isCustomTimespan && (
                <EOBTimespanPicker
                  initialTimespan={initialTimespan}
                  maxDate={dataset.maxDate === null ? new Date() : dataset.maxDate}
                  minDate={dataset.minDate}
                  applyTimespan={this.onTimespanChange}
                  autoApply={true}
                  searchAvailableDays={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
