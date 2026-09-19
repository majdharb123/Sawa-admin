import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ADMIN_API_URL } from '../config';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/reports/all`);
      const data = await response.json();
      setReports(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);

    const adminSocket = io(ADMIN_API_URL, {
      transports: ['websocket'],
    });

    adminSocket.on('connect', () => {
      console.log('保护 Connected to Admin Socket.io from Reports Unit');
      adminSocket.emit('join-admin-room');
    });

    adminSocket.on('new_report_submitted', () => {
      console.log('🔔 New report submitted from mobile client -> Refreshing grid.');
      fetchReports(false); 
    });

    adminSocket.on('report_status_updated', () => {
      console.log('🔔 Report status updated by another admin session.');
      fetchReports(false);
    });

    return () => {
      adminSocket.disconnect();
    };
  }, []);

  const handleEmailReply = async (report) => {
    const subject = encodeURIComponent(`SAWA Admin: Reply to your report (${report.category})`);
    const body = encodeURIComponent(
      `Hello ${report.name},\n\nWe received your report regarding:\n"${report.details}"\n\n[Write your reply here...]\n\nBest regards,\nSAWA Admin Team`
    );
    window.location.href = `mailto:${report.email}?subject=${subject}&body=${body}`;

    if (report.status === 'Resolved') return;

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/reports/resolve/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setReports(prevReports => 
          prevReports.map(r => r.id === report.id ? { ...r, status: 'Resolved' } : r)
        );
      }
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  return (
    <div className="reports-dashboard">
      <style>
        {`
          .reports-dashboard {
            padding: 30px;
            background-color: #f4f7f6;
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .reports-card {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            padding: 25px;
            max-width: 1300px;
            margin: 0 auto;
          }

          .header-title {
            color: #2c3e50;
            font-size: 26px;
            margin-bottom: 20px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .custom-table {
            width: 100%;
            border-collapse: collapse;
          }

          .custom-table th {
            background-color: #f8f9fa;
            color: #6c757d;
            font-size: 14px;
            text-transform: uppercase;
            padding: 16px;
            border-bottom: 2px solid #dee2e6;
            text-align: left;
          }

          .custom-table td {
            padding: 16px;
            vertical-align: top;
            border-bottom: 1px solid #e9ecef;
            color: #495057;
            font-size: 15px;
          }

          .custom-table tr:hover {
            background-color: #f8f9fa;
            transition: 0.2s;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .user-name {
            font-weight: bold;
            color: #212529;
            font-size: 16px;
          }
          .user-contact {
            font-size: 13px;
            color: #6c757d;
          }

          .role-badge {
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
          }
          .role-zamil { background-color: #e0f2fe; color: #0284c7; }
          .role-captain { background-color: #fef08a; color: #a16207; }

          .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
          }
          .status-pending { background-color: #ffebee; color: #c62828; }
          .status-resolved { background-color: #e8f5e9; color: #2e7d32; }

          .btn-reply {
            background-color: #4f46e5;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.3s;
          }
          .btn-reply:hover {
            background-color: #4338ca;
          }
        `}
      </style>

      <div className="reports-card">
        <div className="header-title">
          <span>🛡️</span> System Reports & Support
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Loading data... ⏳</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No reports submitted yet. ✨</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Category</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    
                    <td>
                      <div className="user-info">
                        <span className="user-name">{report.name}</span>
                        <span className="user-contact">📞 {report.phone}</span>
                        <span className="user-contact">📧 {report.email}</span>
                        <span className="user-contact" style={{ fontSize: '11px', color: '#adb5bd', marginTop: '4px' }}>
                          📅 {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`role-badge ${report.role === 'Zamil' ? 'role-zamil' : 'role-captain'}`}>
                        {report.role}
                      </span>
                    </td>

                    <td style={{ fontWeight: '500', color: '#343a40' }}>{report.category}</td>

                    <td style={{ maxWidth: '300px', lineHeight: '1.5' }}>
                      {report.details}
                    </td>

                    <td>
                      <span className={`status-badge ${report.status === 'Pending' ? 'status-pending' : 'status-resolved'}`}>
                        {report.status}
                      </span>
                    </td>

                    <td>
                      <button 
                        className="btn-reply" 
                        onClick={() => handleEmailReply(report)}
                        title="Reply via Email"
                      >
                        ✉️ Reply
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;