// create tile layers for the background of the map
var map = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
});

var nationalGeo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
  maxZoom: 16
});

var topography = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make basemap objects
let basemaps = {
  Default: map,
  " Gray Scale": grayscale,
  "National Geographic": nationalGeo,
  Topography: topography
};

// make a map object
var myMap = L.map("map", {
  center: [39.0119, -98.4842],
  zoom: 5,
  layers: [map, grayscale, nationalGeo, topography]
});

// add the map to the map
map.addTo(myMap);

// add layer control 
L.control.layers(basemaps).addTo(myMap);

// get data for the tectonic plates
// variable to hold tectonic plate layer
let tectonicPlates = new L.layerGroup();

// call API
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plateData) {
  //console.log(plateData);

  // load data using geoJSON and add to tectonic plates layer
  L.geoJson(plateData, {
    // add styling
    color: "blue",
    weight: 1
  }).addTo(tectonicPlates);
});

// add tectonic plates to the map
tectonicPlates.addTo(myMap);

// variable to create the information for the overlay of earthquakes
let earthquakes = new L.layerGroup();

// get data for earthquakes and populate the layer group
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(
  function (earthquakeData) {
    //console.log(earthquakeData);
    // plot all applicable information using circles and the intervals

    // chose the colors of the data representation
    function dataColor(depth){
      if (depth > 90)
        return "#fc0303";
      else if (depth > 70)
        return "#fc6f03";
      else if (depth > 50)
        return "#fc9d03";
      else if (depth > 30)
        return "#fce703";
      else if (depth > 10)
        return "#a1fc03";
      else
        return "#03fc62";
    }

    // make a function that determines size of the radius
    function radius(mag){
      if (mag == 0)
        return 1;
      else 
        return mag * 3;
    }

    // add to the style for each data
    function datastyle(feature){
      return {
        opacity: 1,
        fillOpacity: .5,
        fillColor: dataColor(feature.geometry.coordinates[2]),
        color: "000000",
        radius: radius(feature.properties.mag),
        weight: 0.5
      }
    }
    // add the geoJSON to the earthquake layer group
    L.geoJson(earthquakeData, {
      // make each feature a marker (circle)
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng);
      },
      // set the style for each marker
      style: datastyle,
      // add popups
      onEachFeature: function(feature, layer){
        layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                        Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                        Location: <b>${feature.properties.place}</b>`);
      }
    }).addTo(earthquakes);
    
    // add the earthquake layer to the map
    earthquakes.addTo(myMap);
  });

// add overlays
let overlays = {
  "Tectonic Plates": tectonicPlates,
  "Earthquake Data": earthquakes
};

// add layer control
L.control.layers(basemaps, overlays).addTo(myMap);

// add legend to map
let legend = L.control({
  position: "bottomright"
});

// add properties for legend
legend.onAdd = function() {
  // div for legend to appear
  var div = L.DomUtil.create("div", "info legend");
  console.log(div);

  // set up intervals
  var intervals = [-10, 10, 30, 50, 70, 90];
  // set colors for the intervals
  var colors = ["#03fc62", "#a1fc03", "#fce703", "#fc9d03", "#fc6f03", "#fc0303"];

  // loop through intervals and colors and generate a label
  for(var i = 0; i < intervals.length; i++)
  {
    // inner HTML that sets the squares
    div.innerHTML += "<i style = 'background: " + colors[i] + "'></i>" + intervals[i]
      + (intervals[i+1] ? " km &ndash; " + intervals[i+1] + " km<br>" : "+");
  }
  
  return div;
};

// add legend to the map
legend.addTo(myMap);