import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import './MainPage.css';

const MainPage = () => {
  const centerPosition = [53.195873, 50.100193]; // Самара

  return (
    <MapContainer center={centerPosition} zoom={13} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={centerPosition}>
        <Popup>Вы здесь. Это пример.</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MainPage;