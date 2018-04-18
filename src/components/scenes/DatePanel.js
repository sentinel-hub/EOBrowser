import React, { Component } from 'react';
import { connect } from "react-redux";


export function sameDateDay(d1, d2) {
    return d1.toDateString() === d2.toDateString()
}

class DatePanel extends Component {

    backInTime = (isBackInTime) => {
        const { dateRange } = this.props
        !isBackInTime && !sameDateDay(new Date(), dateRange[1]) && this.props.onClick(isBackInTime)
        isBackInTime && this.props.onClick(isBackInTime)
    }

    render() {
        const { dates, dateRange, width } = this.props
        const lastDate = sameDateDay(new Date(), dateRange[1])
        const rightClassNames = lastDate ? "inlineRight date-changer-last" : "inlineRight date-changer"

        return (
            <div className="time-panel holder">
                <TimeChanger
                    classNames="inlineLeft date-changer"
                    onClick={() => this.backInTime(true)}
                    iconClass={"fa fa-angle-double-left vertical-align"}
                    left={true}/>
                {dates.map((date, i) => 
                    <DateHolder
                        key={i}
                        date={date}
                        width={width}
                        numDates={dates.length}/>)
                }
                <TimeChanger
                    classNames={rightClassNames}
                    onClick={() => this.backInTime(false)}
                    iconClass={"fa fa-angle-double-right vertical-align"}
                    left={false}/>
            </div>
        )
    }
}

const DateHolder = ({ width, date, numDates }) => {

    const dateSplit = date.split('-')
    return (<div className="inline" style={{ width : 96 / numDates + "%", height: "100%" }}>
                 <div className="dateDisplay">{dateSplit[1]}-{dateSplit[2]}<br></br>{dateSplit[0]}</div>
            </div>)
}


const TimeChanger = ({ classNames, left, onClick, iconClass }) => {
    return <div onClick={onClick} className={classNames}><i className={iconClass}></i></div>
}

export default connect(store => store)(DatePanel);
