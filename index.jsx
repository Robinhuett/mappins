import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Textarea, Pane, Spinner, TextInput, Checkbox } from 'evergreen-ui';
import query_overpass from 'query-overpass';
import MapThingy from './MapThingy';
import './index.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      places: ["Erfurt", "Jena", "Großromstedt", "Bad Langensalza"],
      border: "",
      borderlimit: false,
      isLoading: false,
      geojson: '',
      geojsonid: 0,
    };
  }

  //TODO Caching
  getGeoData() {
    this.setState({isLoading: true});

    let borderquery = '';
    if (this.state.border) {
      if (this.state.borderlimit) {
        borderquery = '(area[name="' + this.state.border + '"];)->.search;';
      }
      borderquery = borderquery + '(rel[name="' + this.state.border + '"][boundary=administrative];)->.border; \
                                   (way(r.border);)->.border;';

    }

    const places = this.state.places.slice();
    let placesquery = '';
    for (var i = 0; i < places.length; i++) {
      if (places[i] && (!places[i].includes('[') || !places[i].includes(']'))) {
        if (borderquery && this.state.borderlimit) {
          placesquery = placesquery + 'node[name="' + places[i] + '"](area.search);';
        } else {
          placesquery = placesquery + 'node[name="' + places[i] + '"];';
        }
      }
    }

    const query = '[out:json][timeout:60]; \
                   ' + borderquery + ' \
                   (' + placesquery + ')->.a; \
                   (node.a[place="village"];node.a[place="city"];node.a[place="town"];node.a[place="suburb"];)->.a; \
                   (.a; .border;); \
                   out geom;';

    const options = {
      flatProperties: true
    };
    query_overpass(query, this.handleDataReceived, options);
  }

  handleDataReceived = (error, osmData) => {
    if (!error && osmData.features !== undefined) {
      this.setState({
        geojson: osmData,
        geojsonid: this.state.geojsonid + 1
      });
    }
    this.setState({isLoading: false});
  };

  handlePlacesChanged(e) {
    this.setState({places: e.target.value.split('\n')});
  }

  handleBorderChanged(e) {
    this.setState({border: e.target.value});
  }

  handleBorderLimitChanged(e) {
    this.setState({borderlimit: e.target.checked});
  }

  componentDidMount() {
    if (this.state.isLoading) {
      return;
    }

    if (!this.state.places) {
      return;
    }

    this.getGeoData();
  }

  render() {
    const places = this.state.places.slice();
    const textvalue = places.join('\n');

    return (
      <div className="app">
        <div className="input">
          <Textarea className="inputplaces"
                    value={textvalue} onChange={(e) => this.handlePlacesChanged(e)}
                    placeholder="Enter one place per row" wrap="off" />
          <TextInput className="inputborder"
                     value={this.state.border} onChange={(e) => this.handleBorderChanged(e)}
                     placeholder="Enter border (optional)"
                     width="100%" />
          <Checkbox className="inputborderlimit"
                    checked={this.state.borderlimit} onChange={(e) => this.handleBorderLimitChanged(e)}
                    label="Limit search to area" />
          <Button appearance="minimal" height={48} iconBefore="search"
                  isLoading={this.state.isLoading}
                  margin={-5}
                  onClick={() => this.getGeoData()}>
            Search
          </Button>
        </div>
        <div className="content">
          <MapThingy className="map" firstPlace={this.state.places[0]} geojsonid={this.state.geojsonid} geojson={this.state.geojson} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
