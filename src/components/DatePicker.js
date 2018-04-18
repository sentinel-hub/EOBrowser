import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { DateField, MonthView } from 'react-date-picker';

import Store from '../store';
import onClickOutside from 'react-onclickoutside';
import 'react-date-picker/index.css';
import moment from 'moment';
import { getAndSetNextPrev } from '../utils/datesHelper';
import AlertContainer from 'react-alert';

class MyDatePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateVisible: false,
      dateString: this.props.defaultValue,
      presumedSelectedDate: this.props.defaultValue,
      originalDate: this.props.defaultValue
    };
  }
  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 2000,
    transition: 'scale'
  };

  showAlert = () => {
    this.msg.show(this.state.err, {
      type: 'info'
    });
  };
  handleClickOutside() {
    this.setState({ isDateVisible: false });
  }

  onDay = props => {
    const { availableDays, dateFormat } = Store.current;
    if (this.props.noHighlight) {
      return props;
    }
    if (availableDays.includes(props.dateMoment.format(dateFormat))) {
      props.className += ' hasData';
    }
    return props;
  };

  onDayPicked = e => {
    this.setState({ isDateVisible: false });
    document.activeElement.blur(); //lose focus so you can pick datepicker again
    this.props.onSelect(e);
    this.setState({ dateString: e, originalDate: e });
    this._dateInput.setState({
      viewDate: e
    });
  };

  onBlur = () => {
    if (!this.state.dateString) return;
    if (this.state.dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)) {
      let date = moment(this.state.dateString);
      if (date.isValid()) {
        // this.onDayPicked(date);
        this.setState({
          isDateVisible: false,
          dateString: this.state.originalDate
        });
        // this.props.onSelect(date);
      }
    }
    this._dateInput.setState({
      viewDate: this.state.dateString
    });
  };

  onKeyDown = e => {
    this.setState({ dateString: e });
  };
  onChange = e => {
    this.setState({ presumedSelectedDate: e });
  };
  onTextChange = value => {
    this.setState({ dateString: value });
    this.props.onExpand();
    if (this.state.dateString !== this.state.presumedSelectedDate) {
      return;
    }
    this.setState({ dateString: value });
    this.props.onSelect(value);
  };

  onInputFocus = () => {
    this.setState({ isDateVisible: true }, () => {
      const wrap = ReactDOM.findDOMNode(this);
      const input = ReactDOM.findDOMNode(this._dateInput);
      const monthView = wrap.querySelector(
        '.react-date-picker__month-view'
      );
      if (monthView === null) return;
      const {left, top} = input.getClientRects()[0]
      monthView.style.left = left + 'px';
      monthView.style.top = (top + 30) + 'px';
    });
  };

  onNextorPrev = (direction, thisDate = false) => {
    const { dateFormat } = Store.current;
    getAndSetNextPrev(direction)
      .then(res => {
        this.props.onSelect(moment(res).format(dateFormat));
        this.setState({ dateString: moment(res).format(dateFormat) });
      })
      .catch(err => {
        this.setState({ err: err });
        this.showAlert();
      });
  };
  expand = () => {
    this.props.onExpand(this._dateInput.state.viewDate);
  };

  render() {
    const { showNextPrev } = this.props;
    return (
      <div
        id={this.props.id}
        className={
          this.props.className ||
          (this.state.isDateVisible && 'active') + ' floatItem'
        }
      >
        <AlertContainer ref={a => (this.msg = a)} {...this.alertOptions} />
        {showNextPrev ? (
          <i
            className={'fa fa-caret-left cal-icon-left'}
            title={''}
            onClick={() => this.onNextorPrev('prev')}
          />
        ) : null}

        <i className={`fa fa-calendar cal-icon-cal`} />
        {showNextPrev ? (
          <i
            className={'fa fa-caret-right cal-icon-right'}
            title={''}
            onClick={() => this.onNextorPrev('next')}
          />
        ) : null}
        <span>
          <DateField
            ref={e => (this._dateInput = e)}
            dateFormat="YYYY-MM-DD"
            onFocus={this.onInputFocus}
            onBlur={this.onBlur}
            onTextChange={this.onTextChange}
            onChange={this.onChange}
            updateOnDateClick={true}
            showClock={false}
            strict={false}
            clearIcon={false}
            onExpand={this.expand}
            expanded={this.state.isDateVisible}
            minDate={this.props.minDate || Store.current.minDate}
            maxDate={this.props.maxDate || Store.current.maxDate}
            // defaultValue={this.props.defaultValue || Store.current.dateTo}
            value={this.state.dateString || Store.current.dateTo}
          >
            <MonthView
              ref={e => (this._monthView = e)}
              onChange={this.onDayPicked}
              onNavClick={(dir, date) => {
                let newDateFrom, newDateTo;
                if ([-2, 2].includes(dir)) {
                  if (dir === -2) dir = -1;
                  if (dir === 2) dir = 1;
                  newDateFrom = moment(date)
                    .add(dir, 'years')
                    .startOf('month')
                    .format('YYYY-MM-DD');
                  newDateTo = moment(date)
                    .add(dir, 'years')
                    .endOf('month')
                    .format('YYYY-MM-DD');
                } else {
                  newDateFrom = moment(date)
                    .add(dir, 'months')
                    .startOf('month')
                    .format('YYYY-MM-DD');
                  newDateTo = moment(date)
                    .add(dir, 'months')
                    .endOf('month')
                    .format('YYYY-MM-DD');
                }
                this.props.onNavClick(newDateFrom, newDateTo);
              }}
              theme={null}
              onRenderDay={this.props.onDay || this.onDay}
              highlightWeekends={true}
              highlightToday={true}
              weekNumbers={false}
              highlightRangeOnMouseMove={false}
              weekStartDay={1}
              footer={false}
            />
          </DateField>
        </span>
      </div>
    );
  }
}
MyDatePicker.defaultProps = { showNextPrev: false };

MyDatePicker.PropTypes = {
  onSelect: PropTypes.func,
  onExpand: PropTypes.func.isRequired,
  onNavClick: PropTypes.func,
  noHighlight: PropTypes.bool,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};
export default onClickOutside(MyDatePicker);
