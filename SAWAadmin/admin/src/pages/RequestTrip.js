import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ADMIN_API_URL, MAIN_BACKEND_URL } from '../config';
import { 
  CheckCircle, XCircle, Shield, Car, MapPin, 
  Phone, Mail, Route, Clock 
} from 'lucide-react';

export default function RequestTrip() {
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [tripRequests, setTripRequests] = useState([]);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${MAIN_BACKEND_URL}/${path}`;
  };

  const fetchTripRequests = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const tripsRes = await axios.get(`${ADMIN_API_URL}/api/admin/requests/pending-trips`);
      if (tripsRes.data.success) {
        setTripRequests(tripsRes.data.tripRequests);

        if (selected) {
          const stillExists = tripsRes.data.tripRequests.find(req => req.id === selected.id);
          if (!stillExists) {
            setSelected(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching trip requests:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripRequests(true);

    const adminSocket = io(ADMIN_API_URL, {
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      console.log('✅ Connected to Admin Socket.io from Trip Requests');
      adminSocket.emit('join-admin-room');
    });

    const eventsToListen = [
      'new_trip_request',         
      'admin_requests_updated'    
    ];

    eventsToListen.forEach((event) => {
      adminSocket.on(event, () => {
        console.log(`🔔 Event received: ${event} -> Refreshing trip requests silently.`);
        fetchTripRequests(false); 
      });
    });

    return () => {
      adminSocket.disconnect();
    };

    // Subscribe once on mount; cleanup disconnects the socket on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleApprove = async () => {
    try {
      const numericId = selected.id.replace('REQ-', '');
      
      await axios.put(`${ADMIN_API_URL}/api/admin/requests/approve-trip`, {
        requestId: numericId
      });
      
      alert(`Trip Claim Approved Successfully!`);
      setSelected(null);
      fetchTripRequests(false); 
    } catch (error) {
      console.error(error);
      alert("Error approving trip request.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return alert("Please select a reason");
    try {
      const numericId = selected.id.replace('REQ-', '');
      
      await axios.put(`${ADMIN_API_URL}/api/admin/requests/reject-trip`, {
        requestId: numericId,
        reason: rejectReason
      });
      
      alert(`Trip Claim Rejected! Notification sent to Captain.`);
      
      setShowRejectModal(false);
      setSelected(null);
      setRejectReason('');
      fetchTripRequests(false); 
    } catch (error) {
      console.error(error);
      alert("Error rejecting trip request.");
    }
  };

  return (
    <div className="h-[85vh] w-full bg-[#F9F9F9] flex font-sans overflow-hidden border border-slate-100 rounded-[2.5rem] shadow-sm animate-in fade-in duration-500">
      
      <div className="w-[380px] bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-slate-100 bg-[#185FA5]">
          <h1 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
            <Route size={22} className="text-blue-200" /> Trip Requests
          </h1>
          <p className="text-[10px] font-bold text-blue-200 mt-1 uppercase tracking-widest">Manage Captain Claims</p>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/30">
          {loading ? (
            <div className="text-center py-10 text-xs font-black text-slate-300 animate-pulse uppercase">Fetching Trips...</div>
          ) : tripRequests.length === 0 ? (
            <div className="text-center py-10 text-xs font-bold text-slate-400">No pending trip requests.</div>
          ) : (
            tripRequests.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelected(item)} 
                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                  selected?.id === item.id 
                    ? 'border-[#185FA5] bg-blue-50/40 shadow-inner' 
                    : 'border-transparent bg-white shadow-sm hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={getImageUrl(item.photo)} className="w-11 h-11 rounded-xl shadow-inner object-cover" alt="Captain" />
                  <div>
                    <h3 className="font-black text-sm text-slate-800">
                      {item.captainName}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {item.id} • {item.routeId}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-8 bg-white flex flex-col">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
                  {selected.captainName}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Phone size={14} className="text-[#185FA5]"/> {selected.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Mail size={14} className="text-[#185FA5]"/> {selected.email}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => setShowRejectModal(true)} className="flex-1 sm:flex-none px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-2 hover:bg-red-100 transition-all tracking-widest">
                  <XCircle size={16}/> Reject
                </button>
                <button onClick={handleApprove} className="flex-1 sm:flex-none px-6 py-3.5 bg-[#185FA5] text-white rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-2 shadow-xl shadow-blue-100 hover:scale-105 transition-all tracking-widest">
                  <CheckCircle size={16}/> Approve
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Route size={14}/> Requested Route</h4>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/50">
                   <div className="flex items-center gap-3 mb-4">
                     <MapPin className="text-[#185FA5]" size={20}/>
                     <span className="text-xl font-bold">{selected.from} <span className="text-slate-300 mx-2">➔</span> {selected.to}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-6">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Time</p>
                       <p className="font-bold text-slate-700 flex items-center gap-1"><Clock size={14}/> {selected.time}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Proposed Price</p>
                       <p className="font-bold text-slate-700 text-emerald-600">{selected.pricePerSeat}</p>
                     </div>
                   </div>
                </div>
                
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-6"><MapPin size={14}/> Route Stops</h4>
                <div className="space-y-3">
                  {selected.stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${i === 0 || i === selected.stops.length-1 ? 'bg-[#185FA5]' : 'bg-slate-300 border-2 border-white shadow-sm'}`}></div>
                      <span className="text-sm font-bold text-slate-600">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#185FA5] p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group h-fit">
                  <Car className="mb-4 opacity-30" size={40} />
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-70 text-blue-100">Captain's Bus Details</h4>
                  <p className="font-black text-2xl mt-2 tracking-tighter italic">{selected.busInfo?.name || 'Bus Details Unavailable'}</p>
                  <p className="text-xs font-bold text-blue-200 mt-1 bg-white/10 px-3 py-1 rounded-full w-fit uppercase mb-4">{selected.busInfo?.type || 'N/A'}</p>
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-200 mb-2">Bus Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {(selected.busInfo?.features || []).length > 0 ? 
                        selected.busInfo.features.map((f, i) => <span key={i} className="bg-white text-[#185FA5] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{f}</span>)
                        : <span className="text-xs text-blue-200 italic">No special features listed</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {showRejectModal && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Decline Trip Request</h3>
                <p className="text-slate-400 text-sm mb-8 font-bold">Please select the official reason for declining.</p>
                
                <div className="space-y-3">
                  {['Bus criteria not met', 'Route fully booked', 'Price too high'].map(reason => (
                    <button 
                      key={reason} 
                      onClick={() => setRejectReason(reason)} 
                      className={`w-full p-5 text-left rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${rejectReason === reason ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-10">
                  <button onClick={() => {setShowRejectModal(false); setRejectReason('');}} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                  <button onClick={handleReject} className="flex-[2] py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 transition-colors">Confirm Reject</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
           <Shield size={80} className="mb-4 opacity-20" />
           <p className="font-black uppercase tracking-[0.4em] text-sm italic">Select a trip request to review</p>
        </div>
      )}
    </div>
  );
}