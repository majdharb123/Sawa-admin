import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { io } from 'socket.io-client';
import { ADMIN_API_URL } from '../config';

import AdminMap from './AdminMaps'; 
import AdminVerification from './AdminVerification'; 
import UsersList from './Users';
import CreateTrips from './CreateTrips';
import RequestTrip from './RequestTrip'; 
import Reports from './Reports'; 

import {
  Users, DollarSign, Bus, Map as MapIcon,
  CheckCircle, ShieldCheck, UserCheck, LayoutDashboard,
  ArrowUp, ArrowDown, Activity, Route,
  X, Menu, RefreshCw, FileText
} from 'lucide-react';

import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#185FA5', '#94A3B8'];

const DashboardHome = ({ data, onNavigateToRequests }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard icon={<Users className="text-blue-600" />} label="Total Users" value={data.totalUsers} change="+16.2%" isUp={true} />
      <MetricCard icon={<Bus className="text-emerald-600" />} label="Live Trips" value={data.liveTrips} change="Normal" isUp={true} />
      <MetricCard icon={<DollarSign className="text-violet-600" />} label="Total Revenue" value={`$${data.totalRevenue}`} change="+22.8%" isUp={true} />
      <MetricCard icon={<Activity className="text-orange-600" />} label="System Health" value={data.systemHealth} change="Stable" isUp={true} />
    </div>

    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-800">
        <CheckCircle className="text-emerald-500" size={24} /> Admin Pending Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div onClick={onNavigateToRequests} className="cursor-pointer">
          <ActionBox label="Withdrawal Requests" value={data.pendingPayouts} sub="Pending Pay via Whish" color="text-[#185FA5]" />
        </div>

        <ActionBox label="New Captain Apps" value={data.pendingVerifications} sub="Review Documents" color="text-emerald-600" />
        <ActionBox label="Reported Issues" value={data.reportedIssues} sub="High Severity" color="text-red-500" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-8">User Growth Analytics</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
              <Line type="monotone" dataKey="users" stroke="#185FA5" strokeWidth={4} dot={{ r: 6, fill: '#185FA5', stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
        <h2 className="text-xl font-black text-slate-900 mb-2">Revenue Breakdown</h2>
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.revenueMix} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                {data.revenueMix.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 space-y-3">
          {data.revenueMix.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <p className="text-sm font-bold text-slate-700">{item.name}</p>
              </div>
              <p className="text-sm font-black text-slate-900">${item.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
      <h2 className="text-xl font-black text-slate-900 mb-8 italic">Top Performing Captains</h2>
      <div className="space-y-4">
        {data.captains.map((captain, index) => (
          <div key={captain.id} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group">
            <div className="w-8 text-lg font-black text-slate-300 group-hover:text-[#185FA5]">{index + 1}</div>
            <img src={captain.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{captain.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: #{captain.id}</p>
            </div>
            <div className="hidden sm:flex items-center gap-12 text-right">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Trips</p><p className="font-bold text-slate-900">{captain.trips}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Revenue</p><p className="font-bold text-slate-900">${captain.revenue.toLocaleString()}</p></div>
              <div className={`flex items-center gap-1 font-black text-sm ${captain.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {captain.change > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />} {Math.abs(captain.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AdminPanel() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [refreshKey, setRefreshKey] = useState(0); 
  
  const [dashboardData, setDashboardData] = useState({
    totalUsers: '0', liveTrips: '0', totalRevenue: '0', systemHealth: '0%',
    pendingPayouts: '0', pendingVerifications: '0', reportedIssues: '0',
    userGrowth: [], revenueMix: [], captains: []
  });

  useEffect(() => {
    const adminSocket = io(ADMIN_API_URL, {
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      console.log('✅ Admin Panel Connected to Socket.io');
      adminSocket.emit('join-admin-room'); 
    });

    const eventsToListen = [
      'admin_accounts_updated',      
      'admin_users_list_updated',    
      'trip_request_rejected',       
      'trip_request_approved',       
      'new_trip_available',          
      'report_status_updated'        
    ];

    eventsToListen.forEach((event) => {
      adminSocket.on(event, (data) => {
        console.log(`🔔 Event received: ${event}`, data);
        setRefreshKey((prev) => prev + 1);
      });
    });

    return () => {
      adminSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching data from Node.js...");
        const response = await axios.get(`${ADMIN_API_URL}/api/admin/dashboard-stats`);
        
        if (response.data && response.data.success) {
          setDashboardData(response.data.stats);
          console.log("✅ Dashboard data updated successfully!");
        }
      } catch (error) {
        console.error("❌ Error fetching admin data:", error);
      }
    };
    fetchStats();
  }, [refreshKey]); 

  const navigationItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'Live Map', label: 'Sawa Radar', icon: <MapIcon size={20} /> },
    { id: 'Verifications', label: 'Security Unit', icon: <UserCheck size={20} /> },
    { id: 'Create Recurrent Trips', label: 'Create Recurrent Trips', icon: <Route size={20} /> },
    { id: 'Users', label: 'Users Directory', icon: <Users size={20} /> },
    { id: 'Reports', label: 'Reports & Support', icon: <FileText size={20} /> }, 
  ];

  const renderActivePage = () => {
    switch (activePage) {
      case 'Dashboard': 
        return <DashboardHome key={refreshKey} data={dashboardData} onNavigateToRequests={() => setActivePage('Trip Requests')} />;
      case 'Live Map': return <AdminMap key={refreshKey} />;
      case 'Verifications': return <AdminVerification key={refreshKey} />;
      case 'Create Recurrent Trips': 
        return <CreateTrips key={refreshKey} goToRequestPage={() => setActivePage('Trip Requests')} />;
      case 'Trip Requests': 
        return <RequestTrip key={refreshKey} />;
      case 'Users': return <UsersList key={refreshKey} />;
      case 'Reports': return <Reports key={refreshKey} />; 
      default: return <DashboardHome key={refreshKey} data={dashboardData} onNavigateToRequests={() => setActivePage('Trip Requests')} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 flex overflow-x-hidden relative">
      
      <div 
        className={`fixed inset-y-0 left-0 w-[280px] bg-[#1E293B] text-white z-[110] transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-10 text-[#185FA5]">
            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Sawa Admin</h2>
            <button onClick={() => setIsNavOpen(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer p-1">
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => { setActivePage(item.id); setIsNavOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activePage === item.id ? 'bg-[#185FA5] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)} 
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 cursor-pointer"
              title={isNavOpen ? "Close Menu" : "Open Menu"}
            >
              {isNavOpen ? (
                <X size={24} className="text-red-500 animate-in spin-in duration-200" />
              ) : (
                <Menu size={24} className="text-slate-600 animate-in fade-in duration-200" />
              )}
            </button>

            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800 italic">
                {navigationItems.find(i => i.id === activePage)?.label || (activePage === 'Trip Requests' ? 'Trip Requests' : activePage)}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 text-[#185FA5] font-black text-xs uppercase">
                <ShieldCheck size={18} /> Admin Mode Connected
            </div>
            <button onClick={() => setRefreshKey(prev => prev + 1)} className="p-2.5 text-slate-400 hover:text-[#185FA5] hover:rotate-180 transition-all duration-300 bg-slate-50 rounded-xl cursor-pointer">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-8 py-8 w-full">
            {renderActivePage()}
        </div>
      </div>

      {isNavOpen && <div onClick={() => setIsNavOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] cursor-pointer" />}
    </div>
  );
}

function MetricCard({ icon, label, value, change, isUp }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.2rem] p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">{icon}</div>
        <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 uppercase'}`}>{change}</div>
      </div>
      <p className="text-3xl font-black text-slate-900 mb-1 leading-tight">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function ActionBox({ label, value, sub, color }) {
  return (
    <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:border-blue-200 transition-all cursor-pointer">
      <p className="text-slate-400 font-bold uppercase text-[10px] mb-2 tracking-widest group-hover:text-[#185FA5] transition-colors">{label}</p>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-[11px] font-bold text-slate-500 mb-1">{sub}</p>
      </div>
    </div>
  );
}