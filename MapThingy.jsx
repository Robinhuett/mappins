import React from "react";
import { Map, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";

export default class MapThingy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 9
    };
  }

  getFirstPoint() {
    if (!this.props.geoData || !this.props.firstPlace) {
      return;
    }

    for (let i = 0; i < this.props.geoData["features"].length; i++) {
      if (this.props.geoData["features"][i]["properties"]["name"] === this.props.firstPlace) {
        return ([
          this.props.geoData["features"][i]["geometry"]["coordinates"][1],
          this.props.geoData["features"][i]["geometry"]["coordinates"][0]
        ]);
      }
    }
  }

  render() {
    const position = this.getFirstPoint();
    return (
      <Map center={position} zoom={this.state.zoom} zoomControl={false}>
        <TileLayer attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a>"
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <MarkerThingy updateTrigger={this.props.updateTrigger} geoData={this.props.geoData} />
      </Map>
    );
  }
}

class MarkerThingy extends React.Component {
  showPopup(feature, layer) {
    if (feature["properties"]["name"] && feature["properties"]["postal_code"]) {
      layer.bindTooltip(feature["properties"]["name"] + ' (' + feature["properties"]["postal_code"] + ')');
    } else if (feature["properties"]["name"]) {
      layer.bindTooltip(feature["properties"]["name"]);
    }
  }

  render() {
    return this.props.geoData ? <GeoJSON key={this.props.updateTrigger}
                                         data={this.props.geoData}
                                         onEachFeature={(feature, layer) => this.showPopup(feature, layer)} /> : null;
  }
}