import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import Rodal from 'rodal'
import togeojson from './toGeoJson'
import styled from 'styled-components'
import JSZip from 'jszip'

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
`

export default class UploadKML extends Component {
  state = {
    error: null
  }
  onDrop = (ok, noOk) => {
    this.setState({ error: null })
    if (ok.length > 0) {
      this.setState({ allowedFiles: ok }, () => {
        const file = ok[0]
        if (file.name.includes('.kmz')) {
          JSZip.loadAsync(file).then(zip => {
            zip
              .file(Object.keys(zip.files).find(f => f.includes('.kml')))
              .async('string')
              .then(data => {
                this.parseKml(data, true)
              })
          })
        } else if (file.name.includes('.kml')) {
          const reader = new FileReader()
          reader.onload = e => this.parseKml(e)
          reader.readAsText(file)
        }
      })
    }
  }

  parseKml = (event, isString = false) => {
    try {
      const doc = new DOMParser().parseFromString(
        isString ? event : event.target.result,
        'text/xml'
      )
      const area = togeojson.kml(doc)
      this.props.onUpload(area)
    } catch (e) {
      this.setState({ error: `Error parsing KML file: ${e.message}` })
    }
  }

  render() {
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={280}
        onClose={this.props.onClose}
      >
        <Style>
          <h3>KML/KMZ upload</h3>
          <p>
            Upload KML/KMZ file to create area of interest. Area will be used
            for clipping when exporting an image.
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
            Drop KML/KMZ file or search your computer
          </Dropzone>
        </Style>
      </Rodal>
    )
  }
}
