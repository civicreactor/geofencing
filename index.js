'use strict';

/* global mapboxgl */
window.mapboxgl = require('mapbox-gl');

/* eslint-disable no-loop-func */
mapboxgl.accessToken = 'pk.eyJ1IjoibW9sbHltZXJwIiwiYSI6ImNpazdqbGtiZTAxbGNocm0ybXJ3MnNzOHAifQ.5_kJrEENbBWtqTZEv7g1-w';

var bounds = [
  [-0.02300262451171875, 51.453792970504495], // Southwest coordinates
  [-0.26882171630859375, 51.55167238691343], // Northeast coordinates
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v8',
  center: [-0.15003204345703125, 51.50489601254001],
  zoom: 10.5,
  // hash: true,
  maxBounds: bounds
});

var fs = require('fs');
var path = require('path');
var turf = require('turf');
var d3 = require('d3');
var getPath = require('./getPath');


var zones = JSON.parse(fs.readFileSync(path.join(__dirname, 'zone.geojson'), 'utf8'));
var test_path = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample_path.json'), 'utf8'));





var start_point = [{ lng: test_path.features[0].geometry.coordinates[0][0], lat: test_path.features[0].geometry.coordinates[0][1] }] || [{ lng: -0.1764678955078125, lat: 51.53074643430678 }];

map.on('style.load', function() {
    var emptyGeojson = turf.featurecollection([]);
    // initialize the congestion zone data and layer
    map.addSource('zone', {
      type: 'geojson',
      data: zones
    });
    map.addSource('routes', {
      type: 'geojson',
      data: test_path //emptyGeojson
    });

    map.addLayer({
      id: 'zone-polygons',
      source: 'zone',
      type: 'fill',
      paint: {
        'fill-color': 'cyan',
        'fill-opacity': .2,
        'fill-outline-color': 'white'
      }
    })
    map.addLayer({
      'id': 'allroutes',
      'type': 'line',
      'source': 'routes',
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-width': {
          'base': 1.5,
          'stops': [
            [10, 1.5],
            [20, 20]
          ]
        },
        'line-color': 'rgba(10,186,245,1)',
        'line-opacity': 1,
      }
    })
    var car = d3.select('#overlay')
      .append('svg')
      .append('circle')
      .attr('r', 7)
      .attr('transform', function() {
        var pixelCoords = map.project([start_point[0].lng, start_point[0].lat]);
        return 'translate(' + pixelCoords.x +','+ pixelCoords.y+ ')';
      })

    // readjust marker position every time the map is moved
    map.on('move', function() {
      mapTrack(start_point)
    });

    map.on('click', function() {
      moveCar();
    })

    function mapTrack(start_point) {
      d3.selectAll('circle')
        .data(start_point)
        .attr('transform', function(d) {
          var pixelCoords = map.project([d.lng, d.lat]);
          return 'translate(' + pixelCoords.x + ',' + pixelCoords.y + ')';
        });
    }

    function moveCar() {
      car.transition()
        .duration(10000)
        .attrTween('transform', translateAlong(test_path));
    }

    function translateAlong(path) {
      var l = turf.lineDistance(path.features[0], 'kilometers');
      return function(d, i, a) {
        return function(t) {
          // t is time as as % of total transition duration
          var p = turf.along(path.features[0], t * l, 'kilometers');
          var pixelCoords = map.project([p.geometry.coordinates[0], p.geometry.coordinates[1]]);
          return 'translate(' + pixelCoords.x + ',' + pixelCoords.y + ')';
        };
      };
    }

  }) // closes on('style.load') event listener
