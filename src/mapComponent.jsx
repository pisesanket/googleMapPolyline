import React, { useRef, useEffect } from "react";
import { GoogleMap, LoadScript, Polyline ,Marker} from "@react-google-maps/api";

const MapWithPolyline = ( {coordinates} ) => {
    console.log(coordinates);
  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = {
    lat: coordinates.length > 0 ? coordinates[0].lat : 0,
    lng: coordinates.length > 0 ? coordinates[0].lng : 0,
  };

  const mapOptions = {
    zoom: 50,
    center: center,
  };

  const polylineOptions = {
    path: coordinates,
    strokeColor: "#000000",
    strokeOpacity: 10,
    strokeWeight: 20,
  };
//   console.log({ lat: coordinates[0].lat, lng: coordinates[0].lng })
  return (
    coordinates&&
    <LoadScript googleMapsApiKey="AIzaSyDMvHTvx8oVrT5NDIXLck6aqLacu3tIHU8">
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={10} center={center} options={mapOptions}>
        {/* <Marker position={{ lat: coordinates.length > 0 ? coordinates[0].lat : 0, lng: coordinates.length > 0 ? coordinates[0].lng : 0 }} /> */}
        <Polyline options={polylineOptions} />
      </GoogleMap>
    </LoadScript>
  );
};

export default MapWithPolyline;
