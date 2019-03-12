import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Textarea, TextInput, Checkbox } from 'evergreen-ui';
import query_overpass from 'query-overpass';
import MapThingy from './MapThingy';
import './index.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      places: [
        {
          id: 0,
          name: 'Erfurt',
          data: null,
          isValid: false,
        },
        {
          id: 1,
          name: 'Jena',
          data: null,
          isValid: false,
        },
        {
          id: 2,
          name: 'Bad Langensalza',
          data: null,
          isValid: false,
        }
      ],
      border: {
        name: '',
        data: null,
        isValid: false,
      },
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
    if (this.state.border.name) {
      if (this.state.borderlimit) {
        borderquery = '(area[name="' + this.state.border.name + '"];)->.search;';
      }
      borderquery = borderquery + '(rel[name="' + this.state.border.name + '"][boundary=administrative];)->.border; \
                                   (way(r.border);)->.border;';

    }

    const places = this.state.places.slice();
    let placesquery = '';
    for (var i = 0; i < places.length; i++) {
      if (places[i].name && (!places[i].name.includes('[') || !places[i].name.includes(']'))) {
        if (borderquery && this.state.borderlimit) {
          placesquery = placesquery + 'node[name="' + places[i].name + '"](area.search);';
        } else {
          placesquery = placesquery + 'node[name="' + places[i].name + '"];';
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
      flatProperties: true,
      overpassUrl: 'https://overpass-api.de/api/interpreter'
    };
    query_overpass(query, this.handleDataReceived, options);
  }

  handleDataReceived = (error, osmData) => {
    if (!error && osmData.features !== undefined) {
      this.setState({
        geojson: osmData,
        geojsonid: this.state.geojsonid + 1
      });
    } else if (error) {
      console.log(error);
    }
    this.setState({isLoading: false});
  };

  handlePlacesChanged(e) {
    const places = e.target.value.split('\n');
    let newPlaces = [];
    for (var i = 0; i < places.length; i++) {
      newPlaces[i] = {
        name: places[i],
        data: null,
        isValid: false
      }
    }
    this.setState({places: newPlaces});
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
    const placesRaw = this.state.places.slice();
    let places = [];
    for (var i = 0; i < placesRaw.length; i++) {
      places[i] = placesRaw[i].name;
    }
    const textvalue = places.join('\n');

    //TODO Replace Textarea with a custom element to satisfy the next two Todos
    //TODO Mark places not found
    //TODO Mark places which already exist in list
    return (
      <div className="App">
        <div className="TopBar">
          <div className="Nav-Left" >
            MapPins
          </div>
          <div className="Nav-Right" >
            <a className="Link" href="https://https://github.com/Robinhuett/mappins"
               target="_blank" rel="noopener noreferrer">
               <span className="Icon">
                 <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 40" width="100%" height="100%"><g><path d="m20 0c-11 0-20 9-20 20 0 8.8 5.7 16.3 13.7 19 1 0.2 1.3-0.5 1.3-1 0-0.5 0-2 0-3.7-5.5 1.2-6.7-2.4-6.7-2.4-0.9-2.3-2.2-2.9-2.2-2.9-1.9-1.2 0.1-1.2 0.1-1.2 2 0.1 3.1 2.1 3.1 2.1 1.7 3 4.6 2.1 5.8 1.6 0.2-1.3 0.7-2.2 1.3-2.7-4.5-0.5-9.2-2.2-9.2-9.8 0-2.2 0.8-4 2.1-5.4-0.2-0.5-0.9-2.6 0.2-5.3 0 0 1.7-0.5 5.5 2 1.6-0.4 3.3-0.6 5-0.6 1.7 0 3.4 0.2 5 0.7 3.8-2.6 5.5-2.1 5.5-2.1 1.1 2.8 0.4 4.8 0.2 5.3 1.3 1.4 2.1 3.2 2.1 5.4 0 7.6-4.7 9.3-9.2 9.8 0.7 0.6 1.4 1.9 1.4 3.7 0 2.7 0 4.9 0 5.5 0 0.6 0.3 1.2 1.3 1 8-2.7 13.7-10.2 13.7-19 0-11-9-20-20-20z"></path></g></svg></span>
               <span className="Title">GitHub</span>
            </a>
          </div>
        </div>
        <div className="Content">
          <div className="Search">
            <Textarea className="Places"
                      value={textvalue} onChange={(e) => this.handlePlacesChanged(e)}
                      placeholder="Enter one place per row" wrap="off" />
            <TextInput className="Border"
                      value={this.state.border.name} onChange={(e) => this.setState({border: {name: e.target.value, data: null, isValid: false}})}
                      placeholder="Enter border (optional)"
                      width="100%" />
            <Checkbox className="Borderlimit"
                      checked={this.state.borderlimit} onChange={(e) => this.setState({borderlimit: e.target.checked})}
                      label="Limit search to area" />
            <Button appearance="minimal" height={48} iconBefore="search"
                    isLoading={this.state.isLoading}
                    margin={-5}
                    onClick={() => this.getGeoData()}>
              Search
            </Button>
          </div>
          <div className="Map">
            <MapThingy firstPlace={this.state.places[0].name} geojsonid={this.state.geojsonid} geojson={this.state.geojson} />
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
