import React, { useState } from 'react';
import axios from 'axios';
import { 
  MapPin, Clock, DollarSign, Route, 
  Plus, Trash2, CheckCircle2, Timer, 
  Navigation, CalendarRange, Users, Banknote, UserCheck,
  FileText
} from 'lucide-react';

const EXCHANGE_RATE = 89500; 

export default function CreateRecTrip({ goToRequestPage }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    startDate: '', 
    endDate: '',   
    time: '',
    duration: '',
    priceLBP: '',  
    priceUSD: '',  
    minPassengers: '', 
    maxPassengers: ''  
  });

  const weekDays = [
    { id: 'Mon', label: 'Monday' }, { id: 'Tue', label: 'Tuesday' },
    { id: 'Wed', label: 'Wednesday' }, { id: 'Thu', label: 'Thursday' },
    { id: 'Fri', label: 'Friday' }, { id: 'Sat', label: 'Saturday' },
    { id: 'Sun', label: 'Sunday' }
  ];
  const [selectedDays, setSelectedDays] = useState([]);
  const [stops, setStops] = useState(['', '']);

  const handleResetForm = () => {
    setFormData({
      from: '', to: '', startDate: '', endDate: '', 
      time: '', duration: '', priceLBP: '', priceUSD: '', 
      minPassengers: '', maxPassengers: '' 
    });
    setSelectedDays([]);
    setStops(['', '']);
    setSuccessMsg('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'priceLBP') {
      const usdValue = value ? (parseFloat(value) / EXCHANGE_RATE).toFixed(2) : '';
      setFormData({ ...formData, priceLBP: value, priceUSD: usdValue });
    } 
    else if (name === 'priceUSD') {
      const lbpValue = value ? Math.round(parseFloat(value) * EXCHANGE_RATE) : '';
      setFormData({ ...formData, priceUSD: value, priceLBP: lbpValue });
    } 
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const addStop = () => setStops([...stops, '']);
  
  const removeStop = (index) => {
    if (stops.length > 2) {
      const newStops = stops.filter((_, i) => i !== index);
      setStops(newStops);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) return alert("Please select at least one operational day!");
    if (stops.some(stop => stop.trim() === '')) return alert("Please fill all stop fields or remove empty ones.");
    if (Number(formData.minPassengers) > Number(formData.maxPassengers)) {
      return alert("Minimum passengers cannot be greater than maximum passengers!");
    }

    setLoading(true);
    try {
      const googleApiKey = "AIzaSyAyw0YsaMPZnp1-PJs7HqWcac-gofup67Y"; 
      let startLat = null, startLng = null, destLat = null, destLng = null;

      const startQuery = `${stops[0]}, ${formData.from}, Lebanon`;
      const destQuery = `${stops[stops.length - 1]}, ${formData.to}, Lebanon`;

      try {
        const startRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(startQuery)}&key=${googleApiKey}`);
        if (startRes.data.status === 'OK' && startRes.data.results.length > 0) {
          startLat = startRes.data.results[0].geometry.location.lat;
          startLng = startRes.data.results[0].geometry.location.lng;
        }

        const destRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destQuery)}&key=${googleApiKey}`);
        if (destRes.data.status === 'OK' && destRes.data.results.length > 0) {
          destLat = destRes.data.results[0].geometry.location.lat;
          destLng = destRes.data.results[0].geometry.location.lng;
        }

        if (!startLat || !destLat) {
          console.warn("Warning: Could not fetch exact coordinates from Google Maps for some locations.");
        }
      } catch (geoError) {
        console.error("Geocoding API error:", geoError);
      }

      const tripData = {
        from_city: formData.from,
        to_city: formData.to,
        start_date: formData.startDate,
        end_date: formData.endDate,
        departure_time: formData.time,
        estimated_duration: formData.duration,
        price_lbp: formData.priceLBP,
        price_usd: formData.priceUSD,
        min_passengers: formData.minPassengers,
        max_passengers: formData.maxPassengers,
        operational_days: selectedDays, 
        stops: stops,
        start_lat: startLat,
        start_lng: startLng,
        dest_lat: destLat,
        dest_lng: destLng
      };

      const response = await axios.post('http://localhost:5001/api/admin/recurrent-routes/create', tripData);
      
      if (response.data.success) {
        setSuccessMsg('Recurrent Trip Created Successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        handleResetForm(); 
      }
    } catch (error) {
      console.error("Error creating trip", error);
      alert(error.response?.data?.message || "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-[#185FA5] rounded-2xl shadow-inner">
            <Route size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Create Master Schedule</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Setup recurrent routes, dates, and pricing for captains.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if(goToRequestPage) goToRequestPage();
              else alert('This will navigate to RequestTrip page.'); 
            }}
            className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
          >
            <FileText size={16} /> Trip Requests
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 size={20} className="text-emerald-500" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <Navigation size={14} /> Route Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">From City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="text" name="from" value={formData.from} onChange={handleInputChange} placeholder="e.g. Tripoli" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">To City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="text" name="to" value={formData.to} onChange={handleInputChange} placeholder="e.g. Beirut" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
              <CalendarRange size={14} /> Schedule & Dates
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Starts From</label>
                <input required type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] text-slate-700 outline-none transition-all cursor-pointer" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Ends On (Opt)</label>
                <input type="date" name="endDate" min={formData.startDate} value={formData.endDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] text-slate-700 outline-none transition-all cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Departure Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input required type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] text-slate-700 outline-none transition-all cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Est. Duration</label>
                <div className="relative">
                  <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="text" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g. 1h 30m" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Operational Days</label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                      selectedDays.includes(day.id) 
                      ? 'bg-[#185FA5] text-white border-[#185FA5] shadow-md shadow-blue-100' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {day.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
              <Banknote size={14} /> Economics & Limits (Auto-Convert: {EXCHANGE_RATE.toLocaleString()} L.L)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Price Per Seat (LBP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">ل.ل</span>
                  <input required type="number" name="priceLBP" value={formData.priceLBP} onChange={handleInputChange} placeholder="895000" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Price Per Seat (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" step="0.01" name="priceUSD" value={formData.priceUSD} onChange={handleInputChange} placeholder="10.00" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Min Passengers</label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" name="minPassengers" value={formData.minPassengers} onChange={handleInputChange} placeholder="5" min="1" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Max Passengers</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="number" name="maxPassengers" value={formData.maxPassengers} onChange={handleInputChange} placeholder="14" min="1" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
              <MapPin size={14} /> Route Sequence
            </h4>
            
            <div className="space-y-3 relative max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 z-0"></div>

              {stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2 relative z-10 bg-white py-1">
                  <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm flex-shrink-0 ${index === 0 || index === stops.length - 1 ? 'bg-[#185FA5]' : 'bg-slate-400'}`}></div>
                  <input 
                    required 
                    type="text" 
                    value={stop} 
                    onChange={(e) => handleStopChange(index, e.target.value)} 
                    placeholder={index === 0 ? "Start (e.g. Al Nour Sq)" : index === stops.length - 1 ? "End Destination" : `Stop ${index + 1}`}
                    className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#185FA5] outline-none transition-all" 
                  />
                  {stops.length > 2 && (
                    <button type="button" onClick={() => removeStop(index)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addStop} className="mt-4 flex justify-center items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#185FA5] hover:text-blue-700 bg-blue-50 w-full py-3.5 rounded-xl transition-all hover:bg-blue-100">
              <Plus size={16} /> Add Waypoint
            </button>
          </div>
        </div>

        <div className="lg:col-span-12 flex justify-end mt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-slate-300 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? <span className="animate-pulse">Saving Route...</span> : <><CheckCircle2 size={20} className="text-emerald-400" /> Publish Route Schedule</>}
          </button>
        </div>

      </form>
    </div>
  );
  
}