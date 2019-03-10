import React from "react";
import { Map, TileLayer, GeoJSON } from "react-leaflet";

export default class MyMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 9
    };
  }

  getFirstPoint() {
    if (!this.props.geojson || !this.props.firstPlace) {
      return;
    }

    //alert(this.props.geojson["features"].length);
    for (let i = 0; i < this.props.geojson["features"].length; i++) {
      if (this.props.geojson["features"][i]["properties"]["name"] === this.props.firstPlace) {
        return ([
          this.props.geojson["features"][i]["geometry"]["coordinates"][1],
          this.props.geojson["features"][i]["geometry"]["coordinates"][0]
        ]);
      }
    }
  }

  render() {
    const position = this.getFirstPoint();
    return (
      <Map center={position} zoom={this.state.zoom}>
        <TileLayer attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a>"
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerThingy geojsonid={this.props.geojsonid} geojson={this.props.geojson} />
      </Map>
    );
}
}

class MarkerThingy extends React.Component {
  showPopup(feature, layer) {
    layer.bindTooltip(feature["properties"]["name"]);
    //layer.bindPopup(feature["geometry"]["coordinates"][0]);
  }

  render() {
    return this.props.geojson ? <GeoJSON key={this.props.geojsonid}
                                         data={this.props.geojson}
                                         onEachFeature={(feature, layer) => this.showPopup(feature, layer)} /> : null;
  }
}