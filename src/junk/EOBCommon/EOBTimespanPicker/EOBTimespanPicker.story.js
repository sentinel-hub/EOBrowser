import React from 'react';
import moment from 'moment';
import { storiesOf } from '@storybook/react';
import { EOBTimespanPicker } from './EOBTimespanPicker';
import { Provider } from 'react-redux';

import store from '../../../store';
const stories = storiesOf('EOB - TimespanPicker', module);

stories.add('Timespan', ({ state, setState }) => {
  return (
    <Provider store={store}>
      <div style={{ background: '#3b3d4d' }}>
        <EOBTimespanPicker
          initialTimespan="2020-01-22/2020-01-23"
          applyTimespan={timespan => setState({ timespan: timespan })}
          minDate={new Date('1984-01-01')}
          maxDate={new Date('2020-02-29')}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
      </div>
    </Provider>
  );
});

function onQueryDatesForActiveMonth(date) {
  return new Promise(resolve => {
    resolve([
      moment(date)
        .startOf('month')
        .format('YYYY-MM-DD'),
    ]);
  });
}
