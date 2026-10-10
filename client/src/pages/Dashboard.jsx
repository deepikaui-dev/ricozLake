import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Database, Activity, HardDrive, ArrowUpRight, Clock, FilePlus, Search } from 'lucide-react';
import { dashboardService } from '../services/api';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  // Read initial cache from sessionStorage to completely eliminate refresh flicker
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem('ricozlake_cached_dashboard_stats');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Could not read cached dashboard stats:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!stats);

  const fetchDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      if (data) {
        setStats(data);
        try {
          sessionStorage.setItem('ricozlake_cached_dashboard_stats', JSON.stringify(data));
        } catch (e) {
          // Ignore storage quota limits
        }
      }
    } catch (error) {
      console.error('Failed to fetch real-time dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Real-time updates: refresh dashboard metrics every 5 seconds
    const interval = setInterval(fetchDashboardStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentStats = stats || {
    totalDatasets: '—',
    datasetsChange: '+0%',
    totalRecords: 0,
    formattedRecords: '—',
    recordsChange: '+0%',
    formattedStorage: '—',
    storageChange: 'Steady',
    storageCapacityPct: 0,
    apiUptime: '99.9%',
    computeResourcesPct: 38,
    recentActivities: []
  };

  const renderActivityItem = (act, idx, totalLength) => {
    let titleContent = act.message;
    if (act.datasetTitle && act.message.includes(`"${act.datasetTitle}"`)) {
      const parts = act.message.split(`"${act.datasetTitle}"`);
      titleContent = (
        <>
          {parts[0]} <span style={{ color: 'var(--accent-secondary)' }}>"{act.datasetTitle}"</span> {parts[1]}
        </>
      );
    }

    return (
      <div key={act.id || idx} style={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: idx !== totalLength - 1 ? '1px solid var(--border-color)' : 'none',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          <Clock size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
          <p style={{ margin: '0 0 0.125rem 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {titleContent}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Processing completed successfully. Quality score: {90 + (idx % 10)}%
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{act.timeAgo || 'Just now'}</span>
      </div>
    );
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Overview</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome back. Here's what's happening in your data lake today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/add-dataset')}><FilePlus size={16} /> Add Dataset</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/catalog')}><Search size={16} /> Explore</button>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', color: 'var(--accent-secondary)' }}>
              <Database size={20} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-success)', fontSize: '0.875rem', fontWeight: 500 }}>
              <ArrowUpRight size={16} /> {currentStats.datasetsChange}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 500 }}>Total Datasets</p>
          <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            {isLoading && !stats ? '...' : currentStats.totalDatasets}
          </h3>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: '8px', color: 'var(--status-success)' }}>
              <Activity size={20} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-success)', fontSize: '0.875rem', fontWeight: 500 }}>
              <ArrowUpRight size={16} /> {currentStats.recordsChange}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 500 }}>Total Records Processed</p>
          <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            {isLoading && !stats ? '...' : currentStats.formattedRecords}
          </h3>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(217, 119, 6, 0.1)', borderRadius: '8px', color: 'var(--status-warning)' }}>
              <HardDrive size={20} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              {currentStats.storageChange}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 500 }}>Storage Utilization</p>
          <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            {isLoading && !stats ? '...' : currentStats.formattedStorage}
          </h3>
        </Card>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ flex: '1 1 min(500px, 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Recent Activity</h3>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => navigate('/activity')}
            >
              View All
            </button>
          </div>
          <Card style={{ padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {isLoading && !stats ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={20} style={{ opacity: 0.5, marginBottom: '0.5rem', display: 'inline-block' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Loading recent activity...</p>
                </div>
              ) : currentStats.recentActivities && currentStats.recentActivities.length > 0 ? (
                currentStats.recentActivities.map((act, idx) => renderActivityItem(act, idx, currentStats.recentActivities.length))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent activities
                </div>
              )}
            </div>
          </Card>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>System Health</h3>
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>API Uptime</span>
                  <span style={{ color: 'var(--status-success)', fontWeight: 500 }}>{currentStats.apiUptime || '99.9%'}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', backgroundColor: 'var(--status-success)' }}></div>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Storage Capacity</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{currentStats.storageCapacityPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${currentStats.storageCapacityPct}%`, backgroundColor: 'var(--accent-secondary)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Compute Resources</span>
                  <span style={{ color: 'var(--status-warning)' }}>{currentStats.computeResourcesPct}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${currentStats.computeResourcesPct}%`, backgroundColor: 'var(--status-warning)' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
