import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { io } from 'socket.io-client';
import { ADMIN_API_URL, MAIN_BACKEND_URL } from '../config';
import { 
  CheckCircle, XCircle, Shield, ZoomIn, Car, MapPin, 
  Calendar, Phone, Mail, MessageSquare, Globe,
  ShieldAlert
} from 'lucide-react';

export default function AdminVerification() {
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/600x400?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${MAIN_BACKEND_URL}/${path.replace(/\\/g, '/')}`;
  };

  const fetchApplicants = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/api/admin/requests/pending-accounts`);
      if (res.data.success) {
        setApplicants(res.data.accountRequests);
        
        if (selected) {
          const stillExists = res.data.accountRequests.find(app => app.id === selected.id);
          if (!stillExists) {
            setSelected(null);
          }
        }
      } else {
        setApplicants([]);
        setSelected(null);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants(true);

    const adminSocket = io(ADMIN_API_URL, {
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      console.log('✅ Connected to Admin Socket.io from Security Unit');
      adminSocket.emit('join-admin-room');
    });

    const eventsToListen = [
      'new_account_registration', 
      'admin_accounts_updated'    
    ];

    eventsToListen.forEach((event) => {
      adminSocket.on(event, () => {
        console.log(`🔔 Event received: ${event} -> Refreshing list implicitly.`);
        fetchApplicants(false); 
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
      const numericId = selected.id.toString().replace(/\D/g, ''); 
      const endpoint = selected.role === 'Captain' ? 'approve-captain' : 'approve-zamil';

      await axios.put(`${ADMIN_API_URL}/api/admin/${endpoint}/${numericId}`, {
        adminNote: adminNote 
      });

      alert(`${selected.role} Account Approved Successfully!`);
      setSelected(null);
      setAdminNote('');
      fetchApplicants(false); 
    } catch (error) {
      console.error("Error approving applicant:", error);
      alert("Error approving applicant");
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return alert("Please select a reason");
    try {
      const numericId = selected.id.toString().replace(/\D/g, ''); 
      const endpoint = selected.role === 'Captain' ? 'reject-captain' : 'reject-zamil';

      await axios.put(`${ADMIN_API_URL}/api/admin/${endpoint}/${numericId}`, { 
        reason: rejectReason, 
        adminNote: adminNote 
      });

      alert(`${selected.role} Account Rejected: ${rejectReason}`);
      setShowRejectModal(false);
      setSelected(null);
      setRejectReason('');
      setAdminNote('');
      fetchApplicants(false); 
    } catch (error) {
      console.error("Error rejecting applicant:", error);
      alert("Error rejecting applicant");
    }
  };

  return (
    <div className="h-[85vh] w-full bg-[#F9F9F9] flex font-sans overflow-hidden border border-slate-100 rounded-[2.5rem] shadow-sm animate-in fade-in duration-500">
      
      <div className="w-[350px] bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
            <Shield size={22} className="text-[#185FA5]" /> Security Unit
          </h1>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Pending Applications</p>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/30">
          {loading ? (
            <div className="text-center py-10 text-xs font-black text-slate-300 animate-pulse uppercase">Searching for incoming apps...</div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-10 text-xs font-bold text-slate-400">No pending accounts found.</div>
          ) : (
            applicants.map(app => (
              <div 
                key={app.id} 
                onClick={() => { setSelected(app); setAdminNote(''); }} 
                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                  selected?.id === app.id 
                    ? 'border-[#185FA5] bg-blue-50/40 shadow-inner' 
                    : 'border-transparent bg-white shadow-sm hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={getImageUrl(app.photo)} className="w-11 h-11 rounded-xl shadow-inner object-cover" alt="Profile" />
                    <div>
                      <h3 className="font-black text-sm text-slate-800">{app.fullName}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{app.id}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${app.role === 'Captain' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {app.role}
                  </span>
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
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900 tracking-tighter">{selected.fullName}</h2>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${selected.role === 'Captain' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {selected.role} Account Profile
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Phone size={14} className="text-slate-500"/> +961 {selected.phone}</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Mail size={14} className="text-slate-500"/> {selected.email}</span>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => setShowRejectModal(true)} className="flex-1 sm:flex-none px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-2 hover:bg-red-100 transition-all tracking-widest"><XCircle size={16}/> Decline App</button>
                <button onClick={handleApprove} className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all tracking-widest"><CheckCircle size={16}/> Verify Account</button>
              </div>
            </div>

            {selected.currentCountry && selected.currentCountry.toLowerCase() !== 'lebanon' && selected.currentCountry !== 'Unknown' && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
                <ShieldAlert size={26} className="text-red-600 flex-shrink-0 animate-pulse" />
                <div>
                  <h5 className="font-black uppercase tracking-tight text-sm text-red-700">Security Warning: Registration Outside Lebanon Detected!</h5>
                  <p className="text-xs font-bold text-red-500 mt-0.5">This client filled the application form from country: <span className="underline font-black">{selected.currentCountry}</span> ({selected.currentCity || 'Unknown'}). Protocol requires rejection unless verified by management.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              <div className="xl:col-span-6 space-y-6">
                
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar size={14}/> Profile Form Meta</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date of Birth</p>
                      <p className="text-xs font-black text-slate-700 mt-1 flex items-center gap-1.5">{selected.dob || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Selected Governorate</p>
                      <p className="text-xs font-black text-slate-700 mt-1 flex items-center gap-1.5"><MapPin size={13} className="text-blue-600"/> {selected.governorate || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Address Details</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed mt-1">{selected.address || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Live Country Location</p>
                      <p className={`text-xs font-black mt-1 flex items-center gap-1.5 ${selected.currentCountry?.toLowerCase() === 'lebanon' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        <Globe size={13}/> {selected.currentCountry || 'Not Detected'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Detected City</p>
                      <p className="text-xs font-black text-slate-700 mt-1">{selected.currentCity || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {selected.role === 'Captain' && selected.busInfo && (
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Car size={14}/> Bus Registration Sheet</h4>
                    <div className="p-4 bg-slate-900 text-white rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bus Name & Make</p>
                      <p className="font-black text-lg text-white mt-1 italic">{selected.busInfo.name}</p>
                      <p className="text-[10px] font-bold text-blue-400 mt-0.5">{selected.busInfo.type}</p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Selected Fleet Amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.busInfo.features && selected.busInfo.features.length > 0 ? selected.busInfo.features.map(feat => (
                          <span key={feat} className="bg-blue-50 text-[#185FA5] text-[10px] font-black px-2.5 py-1 rounded-lg border border-blue-100/50 uppercase">
                            {feat}
                          </span>
                        )) : <span className="text-xs text-slate-400 italic">No special features listed</span>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50/60 p-6 rounded-[2.5rem] border border-amber-100">
                  <h4 className="text-[10px] font-black text-amber-700 uppercase mb-3 flex items-center gap-2 tracking-widest"><MessageSquare size={16}/> Internal Audit Note</h4>
                  <textarea 
                    value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Type secure administrative observations regarding logs..." 
                    className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none h-24 shadow-sm" 
                  />
                </div>

              </div>

              <div className="xl:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ZoomIn size={14}/> Identity Verification Files</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                      <p className="p-2 text-center text-[9px] font-black uppercase text-slate-500 bg-slate-100">National ID / Passport</p>
                      <img src={getImageUrl(selected.documents?.idCard)} className="w-full h-40 object-cover" alt="ID Document" />
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                      <p className="p-2 text-center text-[9px] font-black uppercase text-slate-500 bg-slate-100">Verification Selfie</p>
                      <img src={getImageUrl(selected.documents?.selfie)} className="w-full h-40 object-cover" alt="Selfie Check" />
                    </div>
                    
                    {selected.role === 'Captain' && selected.documents?.busPapers && (
                      <>
                        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                          <p className="p-2 text-center text-[9px] font-black uppercase text-slate-500 bg-slate-100">Bus Legal Papers</p>
                          <img src={getImageUrl(selected.documents.busPapers)} className="w-full h-40 object-cover" alt="Bus Papers" />
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                          <p className="p-2 text-center text-[9px] font-black uppercase text-slate-500 bg-slate-100">Fleet Interior View</p>
                          <img src={getImageUrl(selected.documents.busInterior)} className="w-full h-40 object-cover" alt="Bus Interior" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {showRejectModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black mb-1 uppercase italic tracking-tighter">Decline Compliance Protocol</h3>
                <p className="text-slate-400 text-xs mb-6 font-bold">Select the primary rejection log error code to pass down back to Flutter client.</p>
                
                <div className="space-y-2">
                  {[
                    'Photo not clear / Blurry image', 
                    'ID Card Expired or Fake', 
                    'Invalid Bus Papers / Missing Stamps', 
                    'Identity Mismatch with Selfie', 
                    'Registered Outside Lebanon Boundaries'
                  ].map(reason => (
                    <button 
                      key={reason} type="button" onClick={() => setRejectReason(reason)} 
                      className={`w-full p-4 text-left rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${rejectReason === reason ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 font-black text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                  <button onClick={handleReject} className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-md">Confirm Decline</button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
          <Shield size={70} className="mb-3 opacity-20 text-slate-400" />
          <p className="font-black uppercase tracking-[0.3em] text-xs italic text-slate-400">Security Gate Dormant</p>
        </div>
      )}

    </div>
  );
}