import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr"; // React Hook to fetch data
import lookup from "country-code-lookup"; // nmp module to get iso code form countries

import "./App.scss";

// Mapbox css - needed to make tooltip work later
import "mapbox-gl/dist/mapbox-gl.css";


let token = process.env.REACT_APP_MAPBOX_KEY;

mapboxgl.accessToken = token;


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
      // style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
      style: "mapbox://styles/prateek-diwedi/ck8zimvie0fp41iqmz8zzjk1q",
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

      // create mapbox popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      // Variable to hold the active country/province on hover
      let lastId;

      //Mouse hover event
      map.on("mouseover", "circles", e => {
        //get id from properties
        const id = e.features[0].properties.id;

        // Only if the id are different we process the tooltip
        if (id !== lastId) {
          lastId = id;

          // Change the pointer type on move move
          map.getCanvas().style.cursor = "pointer";

          const { cases, deaths, country, province } = e.features[0].properties;
          const coordinates = e.features[0].geometry.coordinates.slice();

          // Get all data for the tooltip
          const countryISO =
            lookup.byCountry(country)?.iso2 || lookup.byInternet(country)?.iso2;

          const provinceHTML =
            province !== "null" ? `<p>Province: <b>${province}</b></p>` : "";

          const mortalityRate = ((deaths / cases) * 100).toFixed(2);

          const countryFlagHTML = Boolean(countryISO)
            ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
            : "";

          const HTML = `<p>Country: <b>${country}</b></p>
              ${provinceHTML}
              <p>Cases: <b>${cases}</b></p>
              <p>Deaths: <b>${deaths}</b></p>
              <p>Mortality Rate: <b>${mortalityRate}%</b></p>
              ${countryFlagHTML}`;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          popup
            .setLngLat(coordinates)
            .setHTML(HTML)
            .addTo(map);
        }
      });

      // Mouse leave event
      map.on("mouseleave", "circles", function () {
        // Reset the last Id
        lastId = undefined;
        map.getCanvas().style.cursor = "";
        popup.remove();
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