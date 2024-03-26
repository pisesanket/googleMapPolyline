import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, push, child, get } from "firebase/database";
import MapWithPolyline from "./mapComponent";

const MapContainer = () => {
  const [userLocation, setUserLocation] = useState({ lat: 17.631812, lng: 74.7852711 });
  const [user, setUser] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [coordinates, setCoordinates] = useState([]);
  const MOVEMENT_THRESHOLD = 3;
  const cords = [
    { lat: 17.63625309630944, lng: 74.78525635698061 },
    { lat: 17.636148, lng: 74.785394 },
    { lat: 17.635991, lng: 74.785491 },
    { lat: 17.635758, lng: 74.785560 },
    { lat: 17.635651, lng: 74.785593 },
    { lat: 17.635544, lng: 74.785386 },
    { lat: 17.635389, lng: 74.785166 },
    { lat: 17.635243, lng: 74.784955 },
    { lat: 17.635073, lng: 74.784700 },
    { lat: 17.635187, lng: 74.785077 },
    { lat: 17.635373, lng: 74.785388 }
  ];

  useEffect(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyAqyb0h3z5qGnRTqm5UOFtQ9j4Pm2iwOTo",
      authDomain: "transport-management-sys-9ec8e.firebaseapp.com",
      databaseURL: "https://transport-management-sys-9ec8e-default-rtdb.firebaseio.com",
      projectId: "transport-management-sys-9ec8e",
      storageBucket: "transport-management-sys-9ec8e.appspot.com",
      messagingSenderId: "246541959354",
      appId: "1:246541959354:web:8c5e280a24fc6231720283",
      measurementId: "G-CP31XDL6M6"
    };
    initializeApp(firebaseConfig);
  }, []);

  const handleSignInWithEmailAndPassword = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);
    } catch (error) {
      console.error("Email/password sign-in error:", error);
    }
  };

  const handleSignUpWithEmailAndPassword = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);
    } catch (error) {
      console.error("Email/password sign-up error:", error);
    }
  };

  useEffect(() => {
    if (navigator.geolocation && user) {
      let watchId;
      const interval = setInterval(() => {
        watchId = navigator.geolocation.getCurrentPosition(
          position => {
            const newPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(prevLocation => {
              const smoothedLocation = applyKalmanFilter(prevLocation, newPosition);
              const distance = calculateDistance(prevLocation, smoothedLocation);
              console.log(distance);
              if (distance >= MOVEMENT_THRESHOLD) {
                pushUserLocation('9', newPosition);
                setSpeed(position.coords.speed);
                setAccuracy(position.coords.accuracy);
                setHeading(position.coords.heading);
                setRequestCount(prevCount => prevCount + 1);
                return newPosition;
              } else {
                return prevLocation;
              }
            });
          },
          error => {
            console.error("Error getting user location:", error);
          }
        );
      }, 5000);

      return () => {
        clearInterval(interval);
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [ user]);

  const calculateDistance = (pos1, pos2) => {
    if (!pos1 || !pos2) return 0;

    const rad = (x) => {
      return (x * Math.PI) / 180;
    };

    const R = 6378137;
    const dLat = rad(pos2.lat - pos1.lat);
    const dLong = rad(pos2.lng - pos1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(pos1.lat)) *
        Math.cos(rad(pos2.lat)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const pushUserLocation = (userId, location) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations`);
    const userLocationRef = child(locationRef, userId);
    push(userLocationRef, location);
  };

  const applyKalmanFilter = (prevLocation, newPosition) => {
    // Initialize variables
    const dt = 1; // Time step
    const processNoise = 0.1; // Process noise
    const measurementNoise = 10; // Measurement noise
  
    // Predict step: Predict the next state
    const predictedLocation = {
      lat: prevLocation.lat,
      lng: prevLocation.lng,
    };
  
    // Update step: Update the state based on the measurement
    const kalmanGain = processNoise / (processNoise + measurementNoise);
    const updatedLocation = {
      lat: prevLocation.lat + kalmanGain * (newPosition.lat - prevLocation.lat),
      lng: prevLocation.lng + kalmanGain * (newPosition.lng - prevLocation.lng),
    };
  
    return updatedLocation;
  };
  

  const fetchUserLocationsOnce = (userId) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations/${userId}`);

    get(locationRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userLocations = snapshot.val();
          const coordinate = Object.values(userLocations).map(location => ({
            lat: location.lat,
            lng: location.lng
          }));
          setCoordinates(coordinate);
        } else {
          console.log("No data available for the user");
        }
      })
      .catch((error) => {
        console.error("Error fetching user locations:", error);
      });
  };

  return (
    <div>
      {!user && (
        <>
          <input type="email" placeholder="Email" id="email" />
          <input type="password" placeholder="Password" id="password" />
          <button
            onClick={() => {
              const email = document.getElementById("email").value;
              const password = document.getElementById("password").value;
              handleSignInWithEmailAndPassword(email, password);
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => {
              const email = document.getElementById("email").value;
              const password = document.getElementById("password").value;
              handleSignUpWithEmailAndPassword(email, password);
            }}
          >
            Sign up
          </button>
        </>
      )}
      {user && (
        <div>
          <p>Place Name: {placeName}</p>
          <p>Speed: {speed}</p>
          <p>Accuracy: {accuracy}</p>
          <p>Heading: {heading}</p>
          <p onClick={() => { fetchUserLocationsOnce('9'); }}>Request Count: {requestCount}</p>
        </div>
      )}
      <div>
        {coordinates && <MapWithPolyline coordinates={coordinates} />}
        
        </div>
      </div>
    );
  };
  
  export default MapContainer;
