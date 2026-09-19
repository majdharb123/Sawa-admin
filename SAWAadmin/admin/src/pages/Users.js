import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ADMIN_API_URL } from '../config';
import {
  User, Bus, Search,
  MapPin, Phone, Ban, ShieldCheck, RefreshCw
} from 'lucide-react';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/api/admin/users`);
      setUsers(res.data);
    } catch (error) {
      console.error("❌ Error fetching Sawa users:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);

    const adminSocket = io(ADMIN_API_URL, {
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      console.log('✅ Connected to Admin Socket.io from Users Directory');
      adminSocket.emit('join-admin-room'); 
    });

    const eventsToListen = [
      'new_account_registration', 
      'admin_users_list_updated', 
      'account_status_changed'    
    ];

    eventsToListen.forEach((event) => {
      adminSocket.on(event, () => {
        console.log(`🔔 Event received: ${event} -> Refreshing users list silently.`);
        fetchUsers(false); 
      });
    });

    return () => {
      adminSocket.disconnect();
    };
  }, []); 

  const handleBanUser = async (userId, userName, userRole) => {
    if (window.confirm(`Are you sure you want to BAN ${userName}?`)) {
      try {
        await axios.patch(`${ADMIN_API_URL}/api/admin/users/ban`, {
          id: userId,
          role: userRole
        });
        alert(`User ${userName} has been banned and their status is now Rejected.`);
        
        fetchUsers(false); 
      } catch (error) {
        console.error("❌ Error banning user:", error);
        alert("Error banning user. Please check the console.");
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'All' || user.role === filter;
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) || user.phone?.includes(search);
    const isNotBanned = user.status !== 'Rejected'; 
    return matchesFilter && matchesSearch && isNotBanned;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {['All', 'Captain', 'Zamil'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${
                filter === type ? 'bg-[#185FA5] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {type === 'All' ? 'ALL USERS' : type.toUpperCase() + 'S'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or phone..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#185FA5] outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => fetchUsers(true)} className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:text-[#185FA5] transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-20 font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Sawa Community...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 font-bold text-slate-400 uppercase tracking-widest text-xs">No users found</div>
        ) : filteredUsers.map((user) => (
          <div key={`${user.role}-${user.id}`} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-100 transition-all p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 min-w-[250px]">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${
                  user.role === 'Captain' ? 'bg-blue-50 text-[#185FA5]' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {user.role === 'Captain' ? <Bus size={28} /> : <User size={28} />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2 italic">
                    {user.name} 
                    <ShieldCheck size={16} className="text-blue-500" />
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{user.role}</p>
                </div>
              </div>

              <div className="flex flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Region</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MapPin size={14} className="text-slate-400"/> {user.region}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Phone Number</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Phone size={14} className="text-slate-400"/> {user.phone}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase mb-1">
                    {user.role === 'Captain' ? 'Vehicle Info' : 'Total Trips'}
                  </span>
                  <div className="text-sm font-bold text-slate-700">
                    {user.role === 'Captain' ? user.vehicle : `${user.trips} Trips Done`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBanUser(user.id, user.name, user.role)}
                  title={`Ban ${user.name}`}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Ban size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}