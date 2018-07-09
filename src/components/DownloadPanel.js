import React from 'react';
import Store from '../store';
import Toggle from 'react-toggle';
import './DownloadPanel.scss';
import Button from '../components/Button';

export default class DownloadPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      crsSerializationVisible: false,
      isAnalytical: false,
    };
  }

  render() {
    const { user, selectedResult } = Store.current;
    const { isAnalytical, loading } = this.props;
    const isTimelapseSupported = selectedResult.dateService !== undefined || selectedResult.getDates;
    return (
      <footer className="DownloadPanel">
        {user && (
          <div>
            <div title="Adjust image format, resolution and CRS for download">
              <label>Analytical [?]</label>
              <div className="pull-right">
                <Toggle
                  checked={isAnalytical}
                  icons={false}
                  onChange={() => this.props.onChangeAnalytical()}
                />
              </div>
            </div>
            <div className="item" style={{ display: 'flex' }}>
              <Button
                fluid
                disabled={loading}
                loading={loading}
                icon="image"
                text={isAnalytical ? 'Prepare download' : 'Download image'}
                onClick={this.props.onDownload}
              />
              <Button
                fluid
                icon="film"
                text={'Timelapse'}
                disabled={!isTimelapseSupported}
                title={isTimelapseSupported ? 'Create a timelapse' : 'This datasource is not supported'}
                onClick={this.props.showTimelapse}
              />
            </div>
          </div>
        )}

        {!user && (
          <div className="item" style={{ display: 'flex' }}>
            <Button
              fluid
              disabled={loading}
              loading={loading}
              icon="image"
              text={'Download image'}
              onClick={this.props.onDownload}
            />
          </div>
        )}
      </footer>
    );
  }
}
