import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Database, Link2, Plus, RefreshCw, Server, Type, Globe, Lock, Search } from 'lucide-react';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export const DataSources = () => {
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSources, setDataSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [connectionType, setConnectionType] = useState('Relational DB');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });

  const fetchDataSources = async () => {
    try {
      const res = await fetch(`${API_URL}/data-sources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDataSources(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data sources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [token]);

  const filteredDataSources = dataSources.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ds.host && ds.host.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Testing connection and saving configuration...');
    try {
      const res = await fetch(`${API_URL}/data-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...formData, 
          type: connectionType,
          host: formData.host || 'https://api.external.com'
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      
      toast.success(`${connectionType} connection saved successfully!`, { id: loadingToast });
      setIsModalOpen(false);
      setFormData({ name: '', host: '', port: '', database: '', username: '', password: '' });
      fetchDataSources(); // Refresh list
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleSync = async (id, name) => {
    const syncToast = toast.loading(`Syncing ${name}...`);
    try {
      const res = await fetch(`${API_URL}/data-sources/${id}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Sync failed');
      
      toast.success(`${name} synced successfully`, { id: syncToast });
      fetchDataSources();
    } catch (err) {
      toast.error(err.message, { id: syncToast });
    }
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Data Sources</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Connect and manage external databases and REST API integrations</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus size={18} /> New Connection</Button>
      </div>

      <div style={{ marginBottom: '1.5rem', width: '300px' }}>
        <Input 
          placeholder="Search data sources..." 
          icon={Search} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading data sources...</p>
      ) : filteredDataSources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>{searchQuery ? 'No data sources matched your search' : 'No data sources connected yet'}</p>
          {!searchQuery && (
            <Button variant="secondary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
              Connect your first database or REST API
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))', gap: '1.5rem' }}>
          {filteredDataSources.map(ds => {
            const isConnected = ds.status === 'Connected';
            const isRestApi = ds.type === 'REST API';
            return (
              <Card key={ds.id} style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{ padding: '0.75rem', background: isRestApi ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: isRestApi ? 'var(--status-success)' : 'var(--accent-primary)', flexShrink: 0 }}>
                      {isRestApi ? <Globe size={24} /> : <Server size={24} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', wordBreak: 'break-word', lineHeight: 1.3 }}>{ds.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: isConnected ? 'var(--status-success)' : 'var(--status-warning)', display: 'inline-block', marginTop: '0.25rem' }}>
                        ● {ds.status} ({ds.type || 'DB'})
                      </span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" style={{ padding: '0.35rem 0.6rem', flexShrink: 0 }} onClick={() => handleSync(ds.id, ds.name)} title="Sync data source">
                    <RefreshCw size={14} />
                  </Button>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ flexShrink: 0, fontWeight: 500 }}>{isRestApi ? 'API Endpoint' : 'Host / URL'}</span>
                    <span style={{ color: 'var(--text-primary)', maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }} title={ds.host}>{ds.host}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ flexShrink: 0, fontWeight: 500 }}>Last Sync</span>
                    <span style={{ color: 'var(--text-primary)' }}>{ds.lastSync ? `${formatDistanceToNow(new Date(ds.lastSync))} ago` : 'Never'}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Data Connection">
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div 
              onClick={() => setConnectionType('Relational DB')}
              style={{ 
                border: connectionType === 'Relational DB' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                textAlign: 'center', 
                cursor: 'pointer', 
                background: connectionType === 'Relational DB' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)' 
              }}
            >
              <Database size={32} style={{ color: connectionType === 'Relational DB' ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Relational DB</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>PostgreSQL, MySQL, etc.</p>
            </div>

            <div 
              onClick={() => setConnectionType('REST API')}
              style={{ 
                border: connectionType === 'REST API' ? '2px solid var(--status-success)' : '1px solid var(--border-color)', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                textAlign: 'center', 
                cursor: 'pointer', 
                background: connectionType === 'REST API' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)' 
              }}
            >
              <Globe size={32} style={{ color: connectionType === 'REST API' ? 'var(--status-success)' : 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
              <h4 style={{ margin: '0 0 0.5rem 0' }}>REST API</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>JSON APIs & SaaS Services</p>
            </div>
          </div>
          
          {connectionType === 'Relational DB' ? (
            /* Relational Database Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Connection Name</label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Production Analytics DB" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Host</label>
                  <Input name="host" value={formData.host} onChange={handleInputChange} icon={Server} placeholder="db.internal.network" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Port</label>
                  <Input name="port" value={formData.port} onChange={handleInputChange} placeholder="5432" type="number" />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Database Name</label>
                <Input name="database" value={formData.database} onChange={handleInputChange} icon={Database} placeholder="analytics_prod" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
                  <Input name="username" value={formData.username} onChange={handleInputChange} icon={Type} placeholder="admin_user" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                  <Input name="password" value={formData.password} onChange={handleInputChange} icon={Lock} type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>
          ) : (
            /* REST API Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>API Service Name</label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Stripe Payments API or JSONPlaceholder" required />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>API Endpoint URL</label>
                <Input name="host" value={formData.host} onChange={handleInputChange} icon={Globe} placeholder="https://jsonplaceholder.typicode.com/posts" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>HTTP Method</label>
                  <select 
                    name="database" 
                    value={formData.database || 'GET'} 
                    onChange={handleInputChange}
                    style={{ width: '100%', height: '38px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '0 0.75rem' }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Auth Token / API Key (Optional)</label>
                  <Input name="password" value={formData.password} onChange={handleInputChange} icon={Lock} type="password" placeholder="Bearer secret_token_abc123" />
                </div>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }}>Cancel</Button>
            <Button variant="primary" type="submit">Save & Connect</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
