import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { X, Navigation, MapPin, Clock, User, Phone } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom truck icon
const truckIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface LiveTrackingProps {
  loadId: string;
  onClose: () => void;
}

interface TrackingData {
  tracking: {
    isActive: boolean;
    startedAt: string | null;
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: string;
    } | null;
    locationHistory: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
    }>;
  } | null;
  source: string;
  destination: string;
  driverName: string;
  driverMobile: string;
}

// Component to update map center when location changes
const MapUpdater: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

const LiveTracking: React.FC<LiveTrackingProps> = ({ loadId, onClose }) => {
  const { t } = useTranslation();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]); // Default: India center

  useEffect(() => {
    fetchTrackingData();

    // Initialize Socket.IO connection
    const socketUrl = API_URL.replace('/api', '');
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    // Join tracking room
    socketRef.current.emit('join-tracking', loadId);

    // Listen for location updates
    socketRef.current.on('location-updated', (data: { latitude: number; longitude: number; timestamp: Date }) => {
      console.log('Received location update:', data);
      setTrackingData((prev) => {
        if (!prev || !prev.tracking) return prev;

        return {
          ...prev,
          tracking: {
            ...prev.tracking,
            currentLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: data.timestamp.toString(),
            },
            locationHistory: [
              ...(prev.tracking.locationHistory || []),
              {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp.toString(),
              },
            ],
          },
        };
      });

      // Update map center to follow driver
      setMapCenter([data.latitude, data.longitude]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-tracking', loadId);
        socketRef.current.disconnect();
      }
    };
  }, [loadId]);

  const fetchTrackingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/tracking/${loadId}`, {
        headers: { 'x-auth-token': token },
      });

      setTrackingData(response.data);

      // Set initial map center
      if (response.data.tracking?.currentLocation) {
        setMapCenter([
          response.data.tracking.currentLocation.latitude,
          response.data.tracking.currentLocation.longitude,
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-red-600">Error</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600">{error || 'Failed to load tracking data'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData.tracking || !trackingData.tracking.isActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Tracking Not Started</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            The driver has not started the journey yet. Tracking will begin once the driver starts the trip.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentLocation = trackingData.tracking.currentLocation;
  const locationHistory = trackingData.tracking.locationHistory || [];
  
  // Create polyline from location history
  const pathCoordinates: LatLngExpression[] = locationHistory.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 sm:p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 sm:h-6 sm:w-6" />
              <h2 className="text-lg sm:text-xl font-bold">Live Tracking</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="bg-gray-50 p-3 sm:p-4 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="font-semibold text-gray-700">Driver:</span>
              <span className="text-gray-900 truncate">{trackingData.driverName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="font-semibold text-gray-700">Phone:</span>
              <span className="text-gray-900">{trackingData.driverMobile}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-gray-700">From:</span>
              <span className="text-gray-900 truncate">{trackingData.source}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="font-semibold text-gray-700">To:</span>
              <span className="text-gray-900 truncate">{trackingData.destination}</span>
            </div>
          </div>
          {trackingData.tracking.startedAt && (
            <div className="mt-2 flex items-center space-x-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-gray-700">Started:</span>
              <span className="text-gray-900">
                {new Date(trackingData.tracking.startedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {currentLocation ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
            >
              <MapUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Path traveled */}
              {pathCoordinates.length > 1 && (
                <Polyline positions={pathCoordinates} color="#f97316" weight={4} opacity={0.7} />
              )}

              {/* Current location marker */}
              <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={truckIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-orange-600">{trackingData.driverName}</p>
                    <p className="text-gray-600">Current Location</p>
                    <p className="text-xs text-gray-500">
                      {new Date(currentLocation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Waiting for location data...</p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Tracking Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
