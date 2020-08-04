import React from 'react';
import { storiesOf } from '@storybook/react';
import moment from 'moment';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
import { Provider } from 'react-redux';

import store from '../../../../store';
import EOBDatePicker from '../EOBDatePicker';

const stories = storiesOf('EOB - Datepicker', module);

stories.add('Datepicker', ({ state, setState }) => {
  const selectedDate = state.selectedDate || moment.utc('2019-11-11');
  return (
    <Provider store={store}>
      <div style={{ background: '#3b3d4d' }}>
        <EOBDatePicker
          onSelect={v => setState({ selectedDate: v })}
          selectedDay={selectedDate}
          alignment={'lt'}
          searchAvailableDays={false}
          minDate={new Date('1984-01-01')}
          maxDate={new Date('2019-12-31')}
        />
      </div>
    </Provider>
  );
});

stories.add('Datepicker custom dates', ({ state, setState }) => {
  const selectedDate = state.selectedDate || moment.utc('2019-11-11');
  return (
    <Provider store={store}>
      <div style={{ background: '#3b3d4d' }}>
        <EOBDatePicker
          onSelect={v => setState({ selectedDate: v })}
          selectedDay={selectedDate}
          showNextPrev={false}
          minDate={new Date('1984-01-01')}
          maxDate={new Date('2019-12-31')}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
      </div>
    </Provider>
  );
});

stories.add('Datepicker prev/next buttons', ({ state, setState }) => {
  const onGetAndSetNextPrev = direction => {
    const currentDate = state.selectedDate
      ? moment.utc(state.selectedDate.format('YYYY-MM-DD'))
      : moment.utc();
    const newDate = direction === 'prev' ? currentDate.subtract(1, 'day') : currentDate.add(1, 'day');
    return new Promise(resolve => {
      resolve(newDate.format('YYYY-MM-DD'));
    });
  };
  const selectedDate = state.selectedDate || moment.utc('2019-11-11');
  return (
    <Provider store={store}>
      <div style={{ background: '#3b3d4d' }}>
        <EOBDatePicker
          onSelect={date => setState({ selectedDate: date })}
          selectedDay={selectedDate}
          showNextPrev={true}
          minDate={new Date('1984-01-01')}
          maxDate={new Date('2019-12-31')}
          onGetAndSetNextPrev={onGetAndSetNextPrev}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
      </div>
    </Provider>
  );
});

stories.add('Datepicker prev/next buttons err', ({ state, setState }) => {
  const onGetAndSetNextPrev = direction => {
    return new Promise((resolve, reject) => {
      reject('No  available dates');
    });
  };
  const selectedDate = state.selectedDate || moment.utc('2019-11-11');
  return (
    <Provider store={store}>
      <div style={{ background: '#3b3d4d' }}>
        <EOBDatePicker
          onSelect={date => setState({ selectedDate: date })}
          selectedDay={selectedDate}
          showNextPrev={true}
          minDate={new Date('1984-01-01')}
          maxDate={new Date('2019-12-31')}
          onGetAndSetNextPrev={onGetAndSetNextPrev}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
      </div>
    </Provider>
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
