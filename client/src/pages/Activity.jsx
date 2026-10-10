import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Clock, Upload, Edit, Trash2, Server, Globe, Bookmark, RefreshCw, Activity as ActivityIcon, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { API_URL } from '../services/api';

export const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getIconAndColor = (type, status) => {
    if (status === 'error') {
      return { Icon: XCircle, color: 'var(--status-error)' };
    }
    switch (type) {
      case 'upload':
        return { Icon: Upload, color: 'var(--status-success)' };
      case 'connect':
        return { Icon: Globe, color: 'var(--status-success)' };
      case 'sync':
        return { Icon: RefreshCw, color: 'var(--accent-primary)' };
      case 'query':
        return { Icon: Bookmark, color: 'var(--accent-secondary)' };
      case 'delete':
        return { Icon: Trash2, color: 'var(--status-error)' };
      case 'edit':
        return { Icon: Edit, color: 'var(--status-warning)' };
      default:
        return { Icon: ActivityIcon, color: 'var(--accent-primary)' };
    }
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Activity Center</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Real-time system event log and audit trail</p>
        </div>
        <Button variant="secondary" onClick={fetchActivities} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> Refresh Logs
        </Button>
      </div>

      <Card style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader size={28} className="spin" style={{ marginBottom: '0.5rem' }} />
            <p>Loading real activity logs...</p>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ActivityIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No activity logs recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.map((item, idx) => {
              const { Icon, color } = getIconAndColor(item.type, item.status);
              const formattedTime = item.createdAt ? `${formatDistanceToNow(new Date(item.createdAt))} ago` : 'Just now';

              return (
                <div key={item.id || idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  borderBottom: idx !== activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: item.status === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: color,
                      flexShrink: 0
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{item.message}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.user ? `${item.user.name} (${item.user.email})` : 'System'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formattedTime}</span>
                    {item.status === 'success' && <CheckCircle size={16} color="var(--status-success)" />}
                    {item.status === 'error' && <XCircle size={16} color="var(--status-error)" />}
                    {item.status === 'pending' && <Clock size={16} color="var(--status-warning)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
