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
          id: generateUID(),
          name: 'Erfurt',
          features: [],
          isValid: false,
        }
      ],
      border: {
        name: '',
        features: [],
        isValid: false,
        isLimit: false,
      },
      borderlimit: false,
      isLoading: false,
      updateTrigger: false,
    };
  }

  getGeoData() {
    const places = this.state.places.filter(place =>
      !place.isValid &&
      (place.name && !place.name.includes('[') && !place.name.includes(']'))
    );
    const border = this.state.border;
    let query_limit  = '';
    let query_border = '';
    let query_places = '';

    if (border.name) {
      if (border.isLimit) {
        query_limit = '(area[name="' + border.name + '"];)->.search;';
      }

      if (!border.isValid) {
        query_border = '(rel[name="' + border.name + '"][boundary=administrative];)->.border; \
                        (way(r.border);)->.border;';
      }
    }

    places.some(place => {
      query_places = query_places + 'node[name="' + place.name + ((query_limit) ? '"](area.search);' : '"];');
    });

    if (!query_border && !query_places) {
      return;
    }

    this.setState({isLoading: true});

    const query = '[out:json][timeout:60]; \
                   ' + query_limit + ' \
                   ' + query_border + ' \
                   (' + query_places + ')->.a; \
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
    if (error) {
      console.log(error);
      this.setState({isLoading: false});
      return;
    }

    if (osmData.features == undefined) {
      this.setState({isLoading: false});
      return;
    }

    let places = this.state.places.slice();
    places.some(place => {
      if (!place.isValid) {
        place.features = osmData.features.filter(osm => osm.properties.name === place.name);
        place.isValid = true;
      }
    });

    let border = this.state.border;
    if (!border.isValid) {
      border.features = osmData.features.filter(osm => osm.properties.boundary === 'administrative');
      border.isValid = true;
    }

    this.setState({
      places: places,
      border: border,
      isLoading: false,
      updateTrigger: !this.state.updateTrigger,
    });
  };

  handlePlacesChanged(e) {
    const placesplain = e.target.value.split('\n');
    let places = this.state.places.filter(f => e.target.value.split('\n').includes(f.name));
    for (let i = 0; i < placesplain.length; i++) {
      if (places.some(f => f.name === placesplain[i])) {
        continue;
      }

      places.push({
        id: generateUID(),
        name: placesplain[i],
        features: [],
        isValid: false
      });
    }

    this.setState({places: places});
  }

  handleBorderChanged(e) {
    let places = this.state.places.slice();
    if (this.state.border.isLimit) {
      places.some(f => f.isValid = false);
    }
    this.setState({
      places: places,
      border: {
        name: e.target.value,
        features: [],
        isValid: false,
        isLimit: this.state.border.isLimit
      }
    });
  }

  //TODO Revalidate if limit is toggled in sucsession? Maybe in getData
  handleBorderlimitChanged(e) {
    let places = this.state.places.slice();
    places.some(f => f.isValid = false);

    this.setState({
      places: places,
      border: {
        name: this.state.border.name,
        features: this.state.border.features,
        isValid: this.state.border.isValid,
        isLimit: e.target.checked
      }
    });
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
    let places = [];
    let geoData = {features: this.state.border.features, type: "FeatureCollection"};
    this.state.places.some(place => {
      geoData.features = geoData.features.concat(place.features);
      places.push(place.name);
    });
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
                      value={this.state.border.name} onChange={(e) => this.handleBorderChanged(e)}
                      placeholder="Enter border (optional)"
                      width="100%" />
            <Checkbox className="Borderlimit"
                      checked={this.state.border.isLimit} onChange={(e) => this.handleBorderlimitChanged(e)}
                      label="Limit search to area" />
            <Button appearance="minimal" height={48} iconBefore="search"
                    isLoading={this.state.isLoading}
                    margin={-5}
                    onClick={() => this.getGeoData()}>
              Search
            </Button>
          </div>
          <div className="Map">
            <MapThingy firstPlace={this.state.places[0].name} updateTrigger={this.state.updateTrigger} geoData={geoData} />
          </div>
        </div>
      </div>
    );
  }
}

function generateUID() {
  let fp = (Math.random() * 46656) | 0;
  let sp = (Math.random() * 46656) | 0;
  fp = ("000" + fp.toString(36)).slice(-3);
  sp = ("000" + sp.toString(36)).slice(-3);
  return fp + sp;
}

ReactDOM.render(<App />, document.getElementById('root'));
