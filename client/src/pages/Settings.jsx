import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User, Shield, Bell, Key, Check, Image as ImageIcon, Upload, Trash2, Copy, Plus, Terminal, Code, Clock } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { apiKeyService, API_URL } from '../services/api';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Real API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || 'Admin');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || 'User');
  const [email, setEmail] = useState(user?.email || 'admin@ricozlake.com');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  
  useEffect(() => {
    if (user) {
      if (user.name) {
        setFirstName(user.name.split(' ')[0] || '');
        setLastName(user.name.split(' ').slice(1).join(' ') || '');
      }
      if (user.email) setEmail(user.email);
      if (user.phone !== undefined) setPhone(user.phone || '');
      if (user.avatar) setAvatarUrl(user.avatar);
    }
  }, [user]);

  // Fetch real API keys when navigating to 'api' tab
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const data = await apiKeyService.getKeys();
      setApiKeys(data || []);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'api') {
      fetchApiKeys();
    }
  }, [activeTab]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEnable2FA = (e) => {
    e.preventDefault();
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    toast.success('Two-Factor Authentication enabled successfully!');
  };

  const callUpdateApi = async (data) => {
    try {
      let actualUserId = user?.id || user?._id || user?.userId;
      
      // Fallback: extract from token if missing from user object
      if (!actualUserId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          actualUserId = payload.userId || payload.id;
        } catch (e) {
          console.error('Failed to parse token', e);
        }
      }
      
      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: actualUserId, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update');
      updateUser(result.user);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSaveProfile = async () => {
    if (phone && phone.trim() !== '') {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        toast.error('Contact number must be exactly 10 digits starting with 6, 7, 8, or 9.');
        return;
      }
    }
    const success = await callUpdateApi({ name: `${firstName} ${lastName}`.trim(), email, phone });
    if (success) toast.success('Profile updated successfully!');
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarUrl) {
      toast.error('Please select an avatar or provide a URL.');
      return;
    }
    const success = await callUpdateApi({ avatar: avatarUrl });
    if (success) {
      setIsAvatarModalOpen(false);
      toast.success('Avatar updated successfully!');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSecurity = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match or are empty');
      return;
    }
    const success = await callUpdateApi({ password: newPassword });
    if (success) {
      toast.success('Security settings updated!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!');
  };

  // API Key handlers
  const handleOpenCreateKeyModal = () => {
    setNewKeyName('');
    setNewlyCreatedKey(null);
    setIsCreateKeyModalOpen(true);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    setIsCreatingKey(true);
    try {
      const response = await apiKeyService.createKey(newKeyName.trim() || 'Python Data Pipeline');
      if (response && response.apiKey) {
        setNewlyCreatedKey(response.apiKey);
        toast.success('API Key generated successfully!');
        fetchApiKeys();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate API key');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke the API key "${name}"? Any external application or script using this key will immediately lose access.`)) {
      return;
    }
    try {
      await apiKeyService.revokeKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success(`API Key "${name}" revoked successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke API key');
    }
  };

  const handleCopyText = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <div className="page-animate">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Manage your account, platform security, and API access</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Settings Navigation Sidebar */}
        <Card style={{ width: '250px', padding: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'api', label: 'API Keys', icon: Key },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: activeTab === tab.id ? 'var(--bg-surface-hover)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Settings Content Area */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {activeTab === 'profile' && (
            <Card title="Profile Information" subtitle="Update your personal details">
              <div style={{ maxWidth: '500px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&size=80`} alt="Avatar" style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsAvatarModalOpen(true)}>Change Avatar</Button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Input label="Email Address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Input 
                    label="Contact Number" 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    placeholder="(+91) XXXXX XXXXX" 
                    type="tel"
                    maxLength={10} 
                  />
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title="Security" subtitle="Manage your password and 2FA">
              <div style={{ maxWidth: '500px', marginTop: '1rem' }}>
                <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem' }}>Two-Factor Authentication</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add an extra layer of security to your account.</p>
                    </div>
                    {is2FAEnabled ? (
                      <Button variant="secondary" size="sm" onClick={() => { setIs2FAEnabled(false); toast('2FA Disabled'); }}>Disable</Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIs2FAModalOpen(true)}>Enable</Button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={handleSaveSecurity}>Update Password</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card title="API Keys" subtitle="Generate and manage secret keys for programmatic REST API and pipeline access">
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                      API keys allow automated tools, data pipelines (e.g. Python, Apache Airflow, dbt), and external applications to securely interact with your RicozLake datasets and queries without a browser session.
                    </p>
                    <Button variant="primary" onClick={handleOpenCreateKeyModal}>
                      <Plus size={16} /> Generate New Key
                    </Button>
                  </div>

                  {isLoadingKeys ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Clock size={24} className="spin" style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                      <p style={{ margin: 0 }}>Loading API keys from database...</p>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
                      <Key size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.6 }} />
                      <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No API Keys Created</h4>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        You haven't generated any API keys yet. Click below to create a key for your scripts or external services.
                      </p>
                      <Button variant="secondary" size="sm" onClick={handleOpenCreateKeyModal}>
                        <Plus size={16} /> Create Your First API Key
                      </Button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Key Label</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Token Preview</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Created</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Last Used</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiKeys.map((k) => (
                            <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {k.name}
                              </td>
                              <td style={{ padding: '1rem 0.75rem' }}>
                                <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                  {k.keyPrefix}
                                </span>
                              </td>
                              <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {k.createdAt ? new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                              </td>
                              <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                              </td>
                              <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleRevokeApiKey(k.id, k.name)}
                                  title="Revoke API Key"
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: 'var(--status-error)',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Trash2 size={14} /> Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>

              {/* API Quickstart & Code Example Card */}
              <Card title="How to Authenticate with RicozLake API" subtitle="Authenticate REST requests from your terminal or custom code">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Pass your API key in the <code style={{ color: 'var(--accent-secondary)' }}>x-api-key</code> HTTP header or as a <code style={{ color: 'var(--accent-secondary)' }}>Bearer</code> token in the <code style={{ color: 'var(--accent-secondary)' }}>Authorization</code> header.
                  </p>

                  <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Terminal size={14} /> cURL Example</span>
                      <button 
                        onClick={() => handleCopyText(`curl -X GET "http://localhost:5000/api/datasets" \\\n  -H "x-api-key: YOUR_API_KEY"`)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <pre style={{ margin: 0, lineHeight: '1.4' }}>
{`curl -X GET "http://localhost:5000/api/datasets" \\
  -H "x-api-key: YOUR_API_KEY"`}
                    </pre>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Code size={14} /> Python (requests) Example</span>
                      <button 
                        onClick={() => handleCopyText(`import requests\n\nheaders = {'x-api-key': 'YOUR_API_KEY'}\nres = requests.get('http://localhost:5000/api/datasets', headers=headers)\nprint(res.json())`)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <pre style={{ margin: 0, lineHeight: '1.4' }}>
{`import requests

headers = { "x-api-key": "YOUR_API_KEY" }
response = requests.get("http://localhost:5000/api/datasets", headers=headers)
print(response.json())`}
                    </pre>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" subtitle="Control when and how you are alerted">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                {[
                  { title: 'Dataset Upload Completed', desc: 'Get notified when large files finish processing.' },
                  { title: 'Data Quality Alerts', desc: 'Alert me if a dataset drops below 90% quality score.' },
                  { title: 'Weekly Digest', desc: 'A summary of your lake\'s activity.' }
                ].map((pref, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>{pref.title}</p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{pref.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px' }} />
                  </div>
                ))}
                
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={handleSaveNotifications}>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={is2FAModalOpen} onClose={() => setIs2FAModalOpen(false)} title="Enable 2-Factor Authentication">
        <form onSubmit={handleEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <p style={{ textAlign: 'center', margin: 0, color: 'var(--text-secondary)' }}>
            Scan this QR code with your authenticator app (like Google Authenticator or Authy).
          </p>
          <div style={{ width: '200px', height: '200px', backgroundColor: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
            {/* QR code representation */}
            <div style={{ fontFamily: 'monospace', fontSize: '10px', lineHeight: '1', color: '#000', letterSpacing: '-1px' }}>
              ████████████████████████<br/>
              ██ ▄▄▄▄▄ ██▄▄▄  ██ ▄▄▄▄▄ ██<br/>
              ██ █   █ ████ ████ █   █ ██<br/>
              ██ █▄▄▄█ ██ ▄ █ ▄█ █▄▄▄█ ██<br/>
              ██▄▄▄▄▄▄▄██▄█▄█▄██▄▄▄▄▄▄▄██<br/>
              ██▄▄ ▄▄ ▄ ▄  ▄▄ ▄ ▄ ▄▄ ▄▄██<br/>
              ███ ▄▄▄█▄▄▄▄ █▄█▄▄ ▄███ ▄██<br/>
              ██▄▄▄▄▄▄▄██ █ █ ▄ ██ ▄ █ ██<br/>
              ██ ▄▄▄▄▄ ██▄ █ ▄ ▄█▄██  ▄██<br/>
              ██ █   █ ██ ██  ▄▄▄ ▄▄ ▄ ██<br/>
              ██ █▄▄▄█ ██ ▄██ █ █▄█ ▄  ██<br/>
              ██▄▄▄▄▄▄▄██▄▄▄████▄▄▄▄▄▄▄██<br/>
              ████████████████████████
            </div>
          </div>
          <Input label="Verification Code" placeholder="6-digit code" required />
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <Button variant="secondary" style={{ flex: 1 }} type="button" onClick={() => setIs2FAModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} type="submit">Verify & Enable</Button>
          </div>
        </form>
      </Modal>

      {/* Real Generate New API Key Modal */}
      <Modal 
        isOpen={isCreateKeyModalOpen} 
        onClose={() => setIsCreateKeyModalOpen(false)} 
        title={newlyCreatedKey ? "New API Key Generated" : "Generate New API Key"}
      >
        {!newlyCreatedKey ? (
          <form onSubmit={handleCreateApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Provide a descriptive label for this API key so you remember where it is being used (e.g. "Data Pipeline", "Production ETL", "Jupyter Notebook").
            </p>
            <Input 
              label="Key Name / Description" 
              placeholder="e.g. Python ETL Script" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" type="button" onClick={() => setIsCreateKeyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isCreatingKey}>
                {isCreatingKey ? 'Generating...' : 'Generate API Key'}
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid var(--status-warning)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              <strong style={{ color: 'var(--status-warning)' }}>Important:</strong> Please copy this secret key immediately. For security reasons, it will not be displayed again.
            </div>
            
            <div style={{ position: 'relative' }}>
              <Input 
                label={`Your New API Key (${newlyCreatedKey.name})`} 
                value={newlyCreatedKey.key} 
                readOnly 
                style={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
              <button 
                type="button"
                onClick={() => handleCopyText(newlyCreatedKey.key, 'API Key copied to clipboard!')}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '35px', 
                  background: 'var(--accent-primary)', 
                  color: '#fff',
                  border: 'none', 
                  padding: '0.35rem 0.65rem', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                <Copy size={12} /> Copy
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="primary" onClick={() => { setIsCreateKeyModalOpen(false); setNewlyCreatedKey(null); }}>
                I Have Copied My Key
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} title="Change Profile Avatar">
        <form onSubmit={handleUpdateAvatar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>Choose a Default Avatar</span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Destiny'
              ].map((url, i) => (
                <img 
                  key={i}
                  src={url} 
                  alt="Default" 
                  onClick={() => setAvatarUrl(url)}
                  style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', 
                    border: avatarUrl === url ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    backgroundColor: 'var(--bg-secondary)',
                    transition: 'all 0.2s'
                  }} 
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR UPLOAD FILE</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          <div>
            <label style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '8px',
              cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', transition: 'all 0.2s'
            }}>
              <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>Click to upload an image</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG or GIF (max. 2MB)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR USE URL</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          <Input 
            label="Avatar Image URL" 
            placeholder="https://example.com/my-photo.jpg" 
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            icon={ImageIcon} 
          />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" style={{ flex: 1 }} type="button" onClick={() => setIsAvatarModalOpen(false)}>Cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} type="submit">Update Avatar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

