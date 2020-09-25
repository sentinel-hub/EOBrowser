import React from 'react';
import range from 'lodash/range';
import { t } from 'ttag';

import { getShortMonth } from '../EOBDatePicker/MomentLocaleUtils';

import './EOBFilterSearchByMonths.scss';

export default class EOBFilterSearchByMonths extends React.Component {
  state = {
    doFiltering: false,
    selectedMonths: new Set(range(12)),
  };

  handleFilterCheckboxChange = () => {
    this.setState(
      prevState => ({
        doFiltering: !prevState.doFiltering,
      }),
      this.publishChange,
    );
  };

  toggleMonth = monthIndex => {
    this.setState(prevState => {
      const newValue = new Set(prevState.selectedMonths);
      if (newValue.has(monthIndex)) {
        newValue.delete(monthIndex);
      } else {
        newValue.add(monthIndex);
      }
      return {
        selectedMonths: newValue,
      };
    }, this.publishChange);
  };

  publishChange = () => {
    const { doFiltering, selectedMonths } = this.state;
    const filterMonths = doFiltering ? Array.from(selectedMonths) : null;
    this.props.onChange(filterMonths);
  };

  render() {
    const { doFiltering, selectedMonths } = this.state;
    return (
      <div className="filter-search-by-months">
        <label className="align-checkbox">
          <input
            type="checkbox"
            value="filter-by-months"
            checked={doFiltering}
            onChange={this.handleFilterCheckboxChange}
          />{' '}
          &nbsp;
          {t`filter by months`}
        </label>
        <div className="months">
          {doFiltering &&
            range(12).map(monthIndex => (
              <label key={monthIndex} className="align-checkbox">
                <input
                  type="checkbox"
                  value={monthIndex}
                  checked={selectedMonths.has(monthIndex)}
                  onChange={() => this.toggleMonth(monthIndex)}
                />
                {getShortMonth(monthIndex, this.props.locale)}
              </label>
            ))}
        </div>
      </div>
    );
  }
}
