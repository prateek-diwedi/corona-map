import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr"; // React Hook to fetch data
import lookup from "country-code-lookup"; // nmp module to get iso code form countries

import "./App.scss";

// Mapbox css - needed to make tooltip work later
import "mapbox-gl/dist/mapbox-gl.css";


// env file
require('dotenv').config();

let token = process.env.MAPBOX_KEY;
let mapboxToken = ;
mapboxgl.accessToken = mapboxToken;
console.log('mapbox token ---->>', token)

function App() {
  const mapboxElRef = useRef(null) //DOM element to render map

  const fetcher = url =>
    fetch(url)
      .then(r => r.json())
      .then(data =>
        data.map((point, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              point.coordinates.longitude,
              point.coordinates.latitude
            ]
          },
          properties: {
            id: index, // unique identifier in this case the index
            country: point.country,
            province: point.province,
            cases: point.stats.confirmed,
            deaths: point.stats.deaths
          }
        }))
      );

  // Fetching our data with swr package
  const { data } = useSWR("https://corona.lmao.ninja/v2/jhucsse", fetcher);

  //Initialize map
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
      center: [16, 27], // initial geo location,
      zoom: 2 // initial zoom
    });

    // add navigation to the top  right of map
    map.addControl(new mapboxgl.NavigationControl());

    // Call this method when the map is loaded
    map.once("load", function () {
      // Add our SOURCE
      // with id "points"
      map.addSource("points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data
        }
      });

      // Add our layer
      map.addLayer({
        id: "circles",
        source: "points", // this should be the id of the source
        type: "circle",
        // paint properties
        paint: {
          "circle-opacity": 0.75,
          "circle-stroke-width": [
                 "interpolate",
                 ["linear"],
                 ["get", "cases"],
                 1, 1,
                 500, 1.20,
                 10000, 1.35,
                 50000, 1.50,
                 100000, 1.75,
               ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            1, 4,
            50000, 25,
            100000, 50
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            1, '#ffffb2',
            5000, '#fed976',
            10000, '#feb24c',
            25000, '#fd8d3c',
            50000, '#fc4e2a',
            75000, '#e31a1c',
            100000, '#b10026'
          ],
        }
      });
    });

  }, [data]);



  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assign Map Box Container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  )
}

export default App;