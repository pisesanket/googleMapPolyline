import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth,signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, push, child,get } from "firebase/database";
import MapWithPolyline from "./mapComponent";

const MapContainer = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [user, setUser] = useState(null); // Track user's sign-in status
  const [placeName, setPlaceName] = useState("");
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [coordinates,setCoordinates] = useState([]);
  const MOVEMENT_THRESHOLD = 3;
  const cords = [
    { lat: 17.6362421, lng: 74.7852711 }, 
    { lat: 17.631812, lng: 74.7852711 },   
  ]

  useEffect(() => {
    const firebaseConfig = {
      // Your Firebase configuration
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

      const watchId = navigator.geolocation.watchPosition(
        position => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
              console.log(newPosition);
              pushUserLocation("6", newPosition);
          setUserLocation(prevLocation => {
            // Calculate distance between previous and new position
            const distance = calculateDistance(prevLocation, newPosition);
            fetchPlaceData(position.coords.latitude, position.coords.longitude);
            // Update location only if distance exceeds threshold
            if (distance >= MOVEMENT_THRESHOLD) {
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
  
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [userLocation,user]);

  const calculateDistance = (pos1, pos2) => {
    if (!pos1 || !pos2) return 0;
  
    const rad = (x) => {
      return (x * Math.PI) / 180;
    };
  
    const R = 6378137; // Earth’s mean radius in meters
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
  
    return distance; // returns the distance in meters
  };

  const fetchPlaceData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAqyb0h3z5qGnRTqm5UOFtQ9j4Pm2iwOTo`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const place = data.results[0].formatted_address;
        setPlaceName(place);
      }
    } catch (error) {
      console.error("Error fetching place data:", error);
    }
  };

  const fetchUserLocations = (userId) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations/${userId}`);
  
    // Listen for changes in the user's location node
    onValue(locationRef, (snapshot) => {
      const userLocations = []; // Array to store user's locations
      snapshot.forEach((childSnapshot) => {
        // Iterate through each child node (entries) under the user's node
        const location = childSnapshot.val(); // Get the location data
        userLocations.push(location); // Push location data into the array
      });
      // Now userLocations array contains all entries for the user
      console.log("User Locations:", userLocations);
    }, {
      // Set error callback to handle any potential errors
      errorCallback: (error) => {
        console.error("Error fetching user locations:", error);
      }
    });
  };
  
  const fetchUserLocationsOnce = (userId) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations/${userId}`);
  
    // Fetch data once from the user's location node
    get(locationRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userLocations = snapshot.val();
          const coordinate = Object.values(userLocations).map(location => ({
            lat: location.lat,
            lng: location.lng
          }));
          console.log("User Locations:", coordinate);
          setCoordinates(coordinate);
        } else {
          console.log("No data available for the user");
        }
      })
      .catch((error) => {
        console.error("Error fetching user locations:", error);
      });
  };
  

  // useEffect(() => {
  //   const db = getDatabase();
  //   const locationRef = ref(db, "locations");
  //   if (userLocation && user) {
  //     const userLocationRef = child(locationRef, user.uid);
  //     push(userLocationRef, userLocation);
  //   }
  // }, [userLocation, user]);
  
  // useEffect(() => {
  //   if (navigator.geolocation && user) {
  //     const interval = setInterval(() => {
  //       let newPosition;
  //       const watchId = navigator.geolocation.watchPosition(
  //         position => {
  //           newPosition = {
  //             lat: position.coords.latitude,
  //             lng: position.coords.longitude
  //           };
  //           console.log(newPosition);
  //         }
  //       )
  //       pushUserLocation(user.uid, newPosition);
  //       navigator.geolocation.clearWatch(watchId);
        
  //     }, 5000);

  //     return () => clearInterval(interval);
  //   }
  // }, [user, userLocation]);

  const pushUserLocation = (userId, location) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations`);
    console.log(location);
    const userLocationRef = child(locationRef, userId);
    push(userLocationRef, location);
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
          <p onClick={()=>{fetchUserLocationsOnce('6');}}>Request Count: {requestCount}</p>
        </div>
        
      )}
      <div>
        {coordinates&&<MapWithPolyline coordinates={coordinates} />}
        
      </div>
    </div>
  );
};

export default MapContainer;
// const watchId = navigator.geolocation.watchPosition(
//   position => {
//     const newPosition = {
//       lat: position.coords.latitude,
//       lng: position.coords.longitude
//     };
//     console.log(newPosition);
//   }
// );

// return () => {
//   navigator.geolocation.clearWatch(watchId);
// };
