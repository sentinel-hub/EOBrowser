import React, { Component } from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import moment from 'moment';
import Store from '../../store';
import onClickOutside from 'react-onclickoutside';
import AlertContainer from 'react-alert';
import { queryDatesForActiveMonth, getAndSetNextPrev } from '../../utils/datesHelper';
import 'react-day-picker/lib/style.css';
import './DayPicker.scss';
import { formatDate } from 'react-day-picker/moment';

const maxToDate = new Date();
const minFromDate = new Date('1984-01-01');

class MyDatePicker extends Component {
  static defaultProps = {
    showNextPrev: false,
    searchAvailableDays: true,
    alignment: 'lb',
  };
  constructor(props) {
    super(props);
    this.state = {
      availableDays: [],
      dateInput: this.props.selectedDay,
      expanded: false,
      month: new Date(this.props.selectedDay),
    };
    this.setTextInputRef = element => {
      this.textInput = element;
    };
  }
  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 2000,
    transition: 'scale',
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedDay !== this.props.selectedDay)
      this.setState({
        dateInput: nextProps.selectedDay,
        month: new Date(nextProps.selectedDay),
      });
  }

  showAlert = msg => {
    this.alertContainer.show(msg, {
      type: 'info',
    });
  };

  updateAvailableDaysInMonth = date => {
    if (!this.props.searchAvailableDays) return;
    queryDatesForActiveMonth(date, this.props.datasource || null).then(res => {
      this.setState({
        availableDays: res,
      });
    });
  };

  handleDayClick = (day, modifiers, e) => {
    this.props.onSelect(moment(day).format(Store.current.dateFormat));
    this.setState({
      selectedDay: formatDate(new Date(day), 'YYYY-MM-DD'),
      month: day,
      expanded: false,
    });
    this.textInput.blur();
  };

  onMonthChange = day => {
    this.updateAvailableDaysInMonth(day);
  };

  showDatePicker = e => {
    this.setState(oldState => {
      const willExpand = !oldState.expanded;
      if (willExpand) {
        this.updateAvailableDaysInMonth(oldState.selectedDay);
      }
      return {
        expanded: true,
      };
    });
  };

  handleYearMonthChange = month => {
    this.setState({ month });
    this.onMonthChange(month);
  };

  onNextOrPrev = direction => {
    getAndSetNextPrev(direction)
      .then(res => {
        this.handleDayClick(res);
      })
      .catch(err => {
        this.showAlert(err);
      });
  };

  onFocusHandler = e => {
    this.updateAvailableDaysInMonth(e.target.value);
    this.setState({
      expanded: true,
    });
  };

  inputChange = e => {
    if (DateUtils.isDate(new Date(e.target.value))) {
      this.setState({ selectedDay: e.target.value });
    }
    this.setState({ dateInput: e.target.value });
  };

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      if (DateUtils.isDate(new Date(e.target.value))) {
        this.handleDayClick(e.target.value);
      }
    }
  };

  handleClickOutside = () => {
    this.setState({ expanded: false });
  };

  renderDatePicker = () => {
    const modifiers = {
      available: this.state.availableDays.map(day => new Date(day)),
      selected: new Date(this.props.selectedDay),
    };

    const isTop = this.props.alignment.includes('t');
    const isLeft = this.props.alignment.includes('l');
    let style;

    if (isTop) {
      if (isLeft) {
        style = { bottom: 30, left: 20 };
      } else {
        style = { bottom: 30, left: -80 };
      }
    } else {
      if (isLeft) {
        style = { top: 10, left: 20 };
      } else {
        style = { top: 10, left: -80 };
      }
    }

    return (
      <div style={{ position: 'relative' }}>
        <div className="YearNavigation day-overlay" style={style}>
          <DayPicker
            showOutsideDays
            onMonthChange={month => this.onMonthChange(month)}
            modifiers={modifiers}
            month={new Date(this.state.month) || new Date(this.props.selectedDay)}
            minFromDate={minFromDate}
            maxToDate={maxToDate}
            onDayClick={this.handleDayClick}
            disabledDays={[{ after: new Date() }]}
            captionElement={({ date, localeUtils }) => (
              <YearMonthForm date={date} localeUtils={localeUtils} onChange={this.handleYearMonthChange} />
            )}
            navbarElement={<Navbar />}
          />
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  };

  render() {
    const { expanded, dateInput } = this.state;
    const { showNextPrev } = this.props;
    return (
      <div className="inlineDatepicker">
        <AlertContainer ref={a => (this.alertContainer = a)} {...this.alertOptions} />
        {showNextPrev && (
          <i
            className={'fa fa-caret-left cal-icon-left'}
            title={''}
            onClick={() => this.onNextOrPrev('prev')}
          />
        )}
        <i onClick={this.onFocusHandler} className={`fa fa-calendar cal-icon-cal`} />

        {showNextPrev && (
          <i
            className={'fa fa-caret-right cal-icon-right'}
            title={''}
            onClick={() => this.onNextOrPrev('next')}
          />
        )}
        <span>
          <div className="react-flex inline-flex">
            <input
              className="react-date-field__input"
              ref={this.setTextInputRef}
              value={dateInput}
              onChange={this.inputChange}
              onKeyPress={this.handleKeyPress}
              onClick={this.onFocusHandler}
              onBlur={this.handleInputBlur}
            />
          </div>
        </span>

        {expanded && this.renderDatePicker()}
      </div>
    );
  }
}

const YearMonthForm = ({ date, localeUtils, onChange }) => {
  const months = localeUtils.getMonths();

  const years = [];
  for (let i = minFromDate.getFullYear(); i <= maxToDate.getFullYear(); i += 1) {
    years.push(i);
  }

  const handleChange = function handleChange(e) {
    const { year, month } = e.target.form;
    onChange(new Date(year.value, month.value));
  };

  return (
    <form className="DayPicker-Caption">
      <select name="month" onChange={handleChange} value={date.getMonth()}>
        {months.map((month, i) => (
          <option key={month} value={i}>
            {month}
          </option>
        ))}
      </select>
      <select name="year" onChange={handleChange} value={date.getFullYear()}>
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </form>
  );
};

const Navbar = ({ nextMonth, previousMonth, onPreviousClick, onNextClick, className, localeUtils }) => {
  return (
    <div className={className}>
      <a
        style={{ float: 'left', position: 'relative' }}
        className="date-nav-button"
        onClick={() => onPreviousClick()}
      >
        <span style={{ display: 'inline-block' }}>
          <LeftArrowSvg />
        </span>
      </a>
      <a
        style={{ float: 'right', position: 'relative' }}
        className="date-nav-button"
        onClick={() => onNextClick()}
      >
        <span style={{ display: 'inline-block' }}>
          <RightArrowSvg />
        </span>
      </a>
    </div>
  );
};

const LeftArrowSvg = () => (
  <svg height="24" viewBox="0 0 24 24" width="24">
    <path stroke="white" fill="white" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const RightArrowSvg = () => (
  <svg height="24" viewBox="0 0 24 24" width="24">
    <path stroke="white" fill="white" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

export default onClickOutside(MyDatePicker);
