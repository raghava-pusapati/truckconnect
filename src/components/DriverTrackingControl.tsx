import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Play, Square, MapPin } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, API_URL } from '../config';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface DriverTrackingControlProps {
  loadId: string;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
}

const DriverTrackingControl: React.FC<DriverTrackingControlProps> = ({
  loadId,
  onTrackingStart,
  onTrackingStop,
}) => {
  const { t } = useTranslation();
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if tracking is already active for this load
    checkTrackingStatus();

    // 🚨 CRITICAL: Handle browser close/refresh while tracking is active
    const handleBeforeUnload = () => {
      if (isTracking && loadId) {
        // Use sendBeacon for reliable request even during page unload
        const token = localStorage.getItem('token');
        const blob = new Blob(
          [JSON.stringify({})],
          { type: 'application/json' }
        );
        
        // sendBeacon is more reliable than fetch during unload
        navigator.sendBeacon(
          `${API_BASE_URL}/tracking/stop/${loadId}?token=${token}`,
          blob
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup: stop watching location
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loadId, isTracking]);

  const checkTrackingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/tracking/${loadId}`, {
        headers: { 'x-auth-token': token },
      });

      if (response.data.tracking?.isActive) {
        setIsTracking(true);
        // Resume tracking if it was active
        startLocationTracking(false); // Don't start tracking on backend again
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const startLocationTracking = async (startOnBackend: boolean = true) => {
    try {
      // Get initial position
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      setCurrentLocation({ latitude, longitude });

      // Start tracking on backend
      if (startOnBackend) {
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/tracking/start/${loadId}`,
          { latitude, longitude },
          { headers: { 'x-auth-token': token } }
        );
      }

      // Initialize Socket.IO connection
      const socketUrl = API_URL.replace('/api', '');
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      // Join tracking room
      socketRef.current.emit('join-tracking', loadId);

      // Watch position changes
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // Send location update to backend
          updateLocation(latitude, longitude);

          // Emit real-time update via Socket.IO
          if (socketRef.current) {
            socketRef.current.emit('update-location', {
              loadId,
              latitude,
              longitude,
            });
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          toast.error('Failed to get location. Please check your GPS settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error: any) {
      console.error('Start tracking error:', error);
      throw error;
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/tracking/update/${loadId}`,
        { latitude, longitude },
        { headers: { 'x-auth-token': token } }
      );
    } catch (error) {
      console.error('Update location error:', error);
    }
  };

  const handleStartTracking = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);

    try {
      await startLocationTracking(true);
      setIsTracking(true);
      toast.success('Tracking started successfully!');
      
      if (onTrackingStart) {
        onTrackingStart();
      }
    } catch (error: any) {
      console.error('Error starting tracking:', error);
      toast.error(error.response?.data?.msg || 'Failed to start tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTracking = async () => {
    setIsLoading(true);

    try {
      // Stop watching location
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave-tracking', loadId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Stop tracking on backend
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/tracking/stop/${loadId}`,
        {},
        { headers: { 'x-auth-token': token } }
      );

      setIsTracking(false);
      setCurrentLocation(null);
      toast.success('Tracking stopped');

      if (onTrackingStop) {
        onTrackingStop();
      }
    } catch (error: any) {
      console.error('Error stopping tracking:', error);
      toast.error(error.response?.data?.msg || 'Failed to stop tracking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Tracking</h3>
        </div>
        {isTracking && (
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-semibold">Active</span>
          </div>
        )}
      </div>

      {currentLocation && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>
              Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        {!isTracking ? (
          <button
            onClick={handleStartTracking}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Drive</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleStopTracking}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Stopping...</span>
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                <span>Stop Drive</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500 text-center">
        {isTracking
          ? 'Your location is being shared with the customer'
          : 'Click "Start Drive" to begin sharing your location'}
      </p>
    </div>
  );
};

export default DriverTrackingControl;
