import React from 'react';
import Toggle from 'react-toggle';
import HelpTooltip from '../../HelpTooltip';
import { isSearchGroup } from './isSearchGroup';
import NonEmptyCheckboxes from './NonEmptyCheckboxes';

import './Sentinel1SearchGroup.scss';

class Sentinel1SearchGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      advancedOpened: false,
      ...this.getDefaultSearchFilterValues(),
    };
    this.publishStateFiltersValuesToParent();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.advancedOpened !== this.state.advancedOpened ||
      prevState.dataLocations !== this.state.dataLocations ||
      prevState.acquisitionModes !== this.state.acquisitionModes ||
      prevState.polarizations !== this.state.polarizations ||
      prevState.orbitDirections !== this.state.orbitDirections
    ) {
      this.publishStateFiltersValuesToParent();
    }
  }

  getDefaultSearchFilterValues() {
    return {
      dataLocations: Object.keys(this.props.dataLocations).slice(1, 2), // only the second location (AWS) is selected by default
      acquisitionModes: Object.keys(this.props.acquisitionModes),
      polarizations: Object.keys(
        this.getPolarizationsForAcquisitionModes(Object.keys(this.props.acquisitionModes)),
      ),
      orbitDirections: Object.keys(this.props.orbitDirections),
    };
  }

  publishStateFiltersValuesToParent() {
    const { advancedOpened, dataLocations, acquisitionModes, polarizations, orbitDirections } = this.state;
    if (advancedOpened) {
      this.props.saveFiltersValues({
        dataLocations: dataLocations,
        acquisitionModes: acquisitionModes,
        polarizations: polarizations,
        orbitDirections: orbitDirections,
      });
    } else {
      this.props.saveFiltersValues(this.getDefaultSearchFilterValues());
    }
  }

  getPolarizationsForAcquisitionModes(acquisitionModes) {
    return [...acquisitionModes].reduce(
      (prevValue, am) => ({ ...prevValue, ...this.props.polarizations[am] }),
      {},
    );
  }

  toggleAdvancedOpened = () => {
    this.setState(oldState => ({
      advancedOpened: !oldState.advancedOpened,
    }));
  };

  render() {
    const { advancedOpened } = this.state;
    const availablePolarizations = this.getPolarizationsForAcquisitionModes(this.state.acquisitionModes);
    return (
      <div className="sentinel1-dsg">
        <div>
          <label>Advanced search:</label>
          <Toggle checked={advancedOpened} icons={false} onChange={this.toggleAdvancedOpened} />
        </div>

        {advancedOpened && (
          <div className="advanced">
            <div className="twoItemsPerLine">
              <label>Data location:</label>
              <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
                <div>
                  <b>Sentinel-1</b> services are available both on EOCloud and AWS. The capabilities of each
                  service differ, see{' '}
                  <a
                    href="https://www.sentinel-hub.com/develop/documentation/eo_products/Sentinel1EOproducts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sentinel Hub documentation
                  </a>{' '}
                  for more info.
                </div>
              </HelpTooltip>

              <NonEmptyCheckboxes
                choices={this.props.dataLocations}
                initiallyChecked={this.state.dataLocations}
                onChange={checked => this.setState({ dataLocations: checked })}
                warningEmpty="Please select at least one location!"
              />
            </div>

            <div className="breakLines">
              <label>Acquisition mode:</label>
              <NonEmptyCheckboxes
                choices={this.props.acquisitionModes}
                initiallyChecked={this.state.acquisitionModes}
                onChange={checked => this.setState({ acquisitionModes: checked })}
                warningEmpty="Please select at least one data acquisition mode!"
              />
            </div>

            {Object.keys(availablePolarizations).length > 0 && (
              <div className="twoItemsPerLine">
                <label>Polarization:</label>
                <NonEmptyCheckboxes
                  choices={availablePolarizations}
                  initiallyChecked={this.state.polarizations}
                  onChange={checked => this.setState({ polarizations: checked })}
                  warningEmpty="Please select at least one polarization!"
                />
              </div>
            )}

            <div className="twoItemsPerLine">
              <label>Orbit direction:</label>
              <NonEmptyCheckboxes
                choices={this.props.orbitDirections}
                initiallyChecked={this.state.orbitDirections}
                onChange={checked => this.setState({ orbitDirections: checked })}
                warningEmpty="Please select at least one orbit direction!"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default isSearchGroup(Sentinel1SearchGroup);
