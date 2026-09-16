import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { io } from 'socket.io-client'; 
import { 
  Bus, Users, AlertTriangle, MapPin, 
  ShieldAlert, Gauge, Route, PhoneCall, CheckCircle2, Search
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';

const createCustomIcon = (status, isSelected) => {
  let bgColor = 'bg-[#185FA5]'; 
  if (status === 'off-route') bgColor = 'bg-red-500';
  if (status === 'delayed') bgColor = 'bg-orange-500';

  const iconMarkup = renderToStaticMarkup(
    <div className={`p-1.5 rounded-full text-white shadow-md border-2 border-white transition-all ${bgColor} ${isSelected ? 'scale-125 ring-4 ring-blue-200' : 'scale-100'}`}>
      <Bus size={isSelected ? 18 : 14} />
    </div>
  );
  return L.divIcon({ html: iconMarkup, className: 'custom-leaflet-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
};

function MapUpdater({ selectedTrip }) {
  const map = useMap();
  useEffect(() => {
    if (selectedTrip && selectedTrip.lat && selectedTrip.lng) {
      map.flyTo([selectedTrip.lat, selectedTrip.lng], 14, { duration: 1.5 });
    }
  }, [selectedTrip, map]);
  return null;
}

export default function AdminMap() {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [routeFilter, setRouteFilter] = useState('All');
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialTrips = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/admin/radar/live-trips');
        if (response.data && response.data.success) {
          setTrips(response.data.trips);
        }
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching initial radar data:", error);
        setLoading(false);
      }
    };

    fetchInitialTrips();

    const socket = io('http://localhost:5000'); 

    socket.on('admin-radar-update', (data) => {
      console.log("📍 Live Update Received:", data);
      
      setTrips(prevTrips => prevTrips.map(trip => {
        const currentTripId = trip.id.replace('TRP-', ''); 
        
        if (currentTripId == data.trip_id) {
          return { ...trip, lat: data.lat, lng: data.lng }; 
        }
        return trip;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredTrips = trips.filter(trip => {
    if (routeFilter === 'All') return true;
    return trip.route && trip.route.toLowerCase().includes(routeFilter.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 font-sans text-slate-800 overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm">
      
      <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black tracking-tight text-[#185FA5]">SAWA <span className="text-slate-900">RADAR</span></h1>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              onChange={(e) => setRouteFilter(e.target.value)}
              value={routeFilter}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#185FA5]"
            >
              <option value="All">All Active Routes (Lebanon)</option>
              <option value="Tripoli">Tripoli - Beirut</option>
              <option value="Sidon">Beirut - Sidon</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Connecting to Sawa GPS...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-10 font-bold text-slate-400 uppercase tracking-widest text-xs">No Active Trips in {routeFilter === 'All' ? 'Lebanon' : routeFilter}</div>
          ) : (
            filteredTrips.map((trip) => (
              <div 
                key={trip.id} 
                onClick={() => setSelectedTrip(trip)} 
                className={`rounded-2xl border-2 transition-all cursor-pointer ${selectedTrip?.id === trip.id ? 'border-[#185FA5] bg-white shadow-lg' : 'border-slate-100 bg-white hover:border-slate-300'}`}
              >
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${trip.status === 'off-route' ? 'bg-red-500' : 'bg-[#185FA5]'}`}><Bus size={18} /></div>
                    <div>
                      <h3 className="font-bold text-sm">{trip.captain}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trip.route}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${trip.status === 'on-time' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{trip.status}</span>
                </div>

                {selectedTrip?.id === trip.id && (
                  <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Seats Available</p>
                        <p className="text-sm font-black text-[#185FA5]">{trip.totalSeats}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Live Speed</p>
                        <p className="text-sm font-black text-slate-800">{trip.speed}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                        <PhoneCall size={12}/> Call Captain
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <MapContainer center={[33.8938, 35.5018]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
          {filteredTrips.map(trip => (
            <Marker 
              key={trip.id} 
              position={[trip.lat, trip.lng]} 
              icon={createCustomIcon(trip.status, selectedTrip?.id === trip.id)} 
              eventHandlers={{ click: () => setSelectedTrip(trip) }} 
            />
          ))}
          {selectedTrip && selectedTrip.path && selectedTrip.path.length > 0 && (
            <Polyline positions={selectedTrip.path} color="#185FA5" weight={5} opacity={0.6} />
          )}
          <MapUpdater selectedTrip={selectedTrip} />
        </MapContainer>
      </div>
    </div>
  );
}