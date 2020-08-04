import React from 'react';
import { storiesOf } from '@storybook/react';
import moment from 'moment';

import { EOBVisualizationTimeSelect } from '../EOBVisualizationTimeSelect';

const stories = storiesOf('EOB - Visualization time select', module);

stories.add('Default', ({ state, setState }) => {
  const time = state.time || '2019-11-11';

  const onGetAndSetNextPrev = direction => {
    const currentDate = state.time ? moment.utc(state.time) : moment.utc();
    const newDate = direction === 'prev' ? currentDate.subtract(1, 'day') : currentDate.add(1, 'day');
    return new Promise(resolve => {
      resolve(newDate.format('YYYY-MM-DD'));
    });
  };

  return (
    <div style={{ background: '#3b3d4d', height: '50vh' }}>
      <EOBVisualizationTimeSelect
        minDate={new Date('1984-01-01')}
        maxDate={new Date()}
        onGetAndSetNextPrev={onGetAndSetNextPrev}
        onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        searchAvailableDays={false}
        showNextPrev={true}
        time={time}
        updateSelectedTime={t => setState({ time: t })}
      />
    </div>
  );
});

stories.add('Timespan disabled', ({ state, setState }) => {
  const time = state.time || '2019-11-11';

  const onGetAndSetNextPrev = direction => {
    const currentDate = state.time ? moment.utc(state.time) : moment.utc();
    const newDate = direction === 'prev' ? currentDate.subtract(1, 'day') : currentDate.add(1, 'day');
    return new Promise(resolve => {
      resolve(newDate.format('YYYY-MM-DD'));
    });
  };

  return (
    <div style={{ background: '#3b3d4d', height: '50vh' }}>
      <EOBVisualizationTimeSelect
        minDate={new Date('1984-01-01')}
        maxDate={new Date()}
        onGetAndSetNextPrev={onGetAndSetNextPrev}
        onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        searchAvailableDays={false}
        showNextPrev={true}
        time={time}
        timespanSupported={false}
        updateSelectedTime={t => setState({ time: t })}
      />
    </div>
  );
});

stories.add('Timespan disabled with interval as input', ({ state, setState }) => {
  const time = state.time || '2019-11-11 00:00:00.000Z/2019-11-11 23:59:59.999Z';

  const onGetAndSetNextPrev = direction => {
    const currentDate = state.time ? moment.utc(state.time) : moment.utc();
    const newDate = direction === 'prev' ? currentDate.subtract(1, 'day') : currentDate.add(1, 'day');
    return new Promise(resolve => {
      resolve(newDate.format('YYYY-MM-DD'));
    });
  };

  return (
    <div style={{ background: '#3b3d4d', height: '50vh' }}>
      <EOBVisualizationTimeSelect
        minDate={new Date('1984-01-01')}
        maxDate={new Date()}
        onGetAndSetNextPrev={onGetAndSetNextPrev}
        onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        searchAvailableDays={false}
        showNextPrev={true}
        time={time}
        timespanSupported={false}
        updateSelectedTime={t => setState({ time: t })}
      />
    </div>
  );
});

function onQueryDatesForActiveMonth(date) {
  return new Promise(resolve => {
    resolve([
      moment
        .utc(date)
        .startOf('month')
        .format('YYYY-MM-DD'),
    ]);
  });
}
