import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Rodal from 'rodal';
import toGeoJSON from '@mapbox/togeojson';
import { getType } from '@turf/invariant';
import { coordEach, featureReduce } from '@turf/meta';
import styled from 'styled-components';
import JSZip from 'jszip';

const Style = styled.div`
  color: #fff;

  .fileUploadPanel {
    border: 2px dashed #aaa;
    cursor: pointer;
    text-align: center;
    padding: 20px;
  }
  .ok {
    box-shadow: 0 0 3px #0c0;
  }
  .false {
    box-shadow: 0 0 3px #c00;
  }
  .error {
    color: #c14444;
  }
`;

export default class UploadGeoFile extends Component {
  state = {
    error: null,
  };

  onDrop = (ok, noOk) => {
    this.setState({ error: null });
    if (ok.length > 0) {
      this.setState({ allowedFiles: ok }, () => {
        const file = ok[0];
        const format = this.getFileExtension(file.name);
        const supportedFormats = ['kmz', 'kml', 'gpx', 'geojson'];
        try {
          if (!supportedFormats.includes(format)) {
            throw new Error('File type not supported');
          }
          if (format === 'kmz') {
            JSZip.loadAsync(file).then(zip => {
              zip
                .file(Object.keys(zip.files).find(f => f.includes('.kml')))
                .async('string')
                .then(data => {
                  this.parseFile(data, 'kml');
                });
            });
          } else {
            const reader = new FileReader();
            reader.onload = e => this.parseFile(e.target.result, format);
            reader.readAsText(file);
          }
        } catch (e) {
          this.setState({ error: e.message });
        }
      });
    }
  };

  parseFile = (fileContents, format) => {
    try {
      let area;
      switch (format) {
        case 'kml':
        case 'gpx':
          const dom = new DOMParser().parseFromString(fileContents, 'text/xml');
          if (format === 'kml') {
            area = toGeoJSON.kml(dom);
          } else {
            area = toGeoJSON.gpx(dom);
          }
          break;
        case 'geojson':
          area = JSON.parse(fileContents);
          break;
        default:
          throw new Error('not supported');
      }

      if (!area) {
        throw new Error('There was a problem parsing the file');
      }
      area = this.onlyGetPolygons(area);
      if (area.features.length === 0) {
        throw new Error('No Polygons or MultiPolygons found');
      }

      this.props.onUpload(area);
    } catch (e) {
      this.setState({ error: `Error parsing file: ${e.message}` });
    }
  };

  flattenCoordsTo2D = feature => {
    coordEach(feature, (coord, index) => {
      if (coord.length > 2) {
        feature.geometry.coordinates[0][index] = [coord[0], coord[1]];
      }
    });
    return feature;
  };

  onlyGetPolygons = geojson => {
    return featureReduce(
      geojson,
      (previousValue, currentFeature) => {
        if (getType(currentFeature) === 'Polygon' || getType(currentFeature) === 'MultiPolygon') {
          previousValue.features.push(this.flattenCoordsTo2D(currentFeature));
        }
        return previousValue;
      },
      { type: 'FeatureCollection', features: [] },
    );
  };

  getFileExtension = filename =>
    filename
      .toLowerCase()
      .split('.')
      .pop();

  render() {
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={280}
        onClose={this.props.onClose}
        closeOnEsc={true}
      >
        <Style>
          <h3>File upload</h3>
          <p>
            Upload a KML/KMZ, GPX or GEOJSON file to create area of interest. Area will be used for clipping
            when exporting an image.
          </p>
          <Dropzone
            acceptClassName="ok"
            rejectClassName="false"
            className="fileUploadPanel"
            multiple={false}
            onDrop={this.onDrop}
            // accept={['application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz']}
            // accept={['application/vnd.google-earth.kml+xml']}
          >
            Drop KML/KMZ, GPX, GEOJSON file or search your computer
          </Dropzone>
          {this.state.error && <p className="error">{this.state.error}</p>}
        </Style>
      </Rodal>
    );
  }
}
