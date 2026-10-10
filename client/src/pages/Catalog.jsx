import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, Filter, ArrowDown, Edit2, Share2, Download, Trash2, Database } from 'lucide-react';
import { DropdownMenu } from '../components/DropdownMenu';
import { datasetService } from '../services/api';
import toast from 'react-hot-toast';

export const Catalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [selectedZone, setSelectedZone] = useState('All');

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const data = await datasetService.getAllDatasets();
      setDatasets(data);
    } catch (error) {
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const getDatasetZone = (tags = []) => {
    const zoneTag = tags.find(t => t.name.startsWith('zone:'));
    return zoneTag ? zoneTag.name.replace('zone:', '') : 'Bronze (Raw)';
  };

  const getDatasetPartition = (tags = []) => {
    const partTag = tags.find(t => t.name.startsWith('partition:'));
    return partTag ? partTag.name.replace('partition:', '') : 'None';
  };

  const handleDelete = async (id) => {
    try {
      await datasetService.deleteDataset(id);
      toast.success('Dataset deleted successfully');
      setDatasets(datasets.filter(d => d.id !== id));
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  };

  const handleExport = (dataset) => {
    try {
      const format = (dataset.fileType || 'csv').toLowerCase();
      const downloadUrl = datasetService.getDownloadUrl(dataset.id, format);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${dataset.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Exporting ${dataset.name}...`);
    } catch {
      toast.error('Failed to export dataset');
    }
  };

  const handleShare = (dataset) => {
    try {
      const shareUrl = `${window.location.origin}/dataset/${dataset.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!', { icon: '🔗' });
    } catch {
      toast.error('Could not copy link');
    }
  };

  const datasetOptions = (dataset) => [
    { label: 'Edit Metadata & Zone', icon: <Edit2 size={14} />, onClick: () => navigate(`/dataset/${dataset.id}`) },
    { label: 'Share', icon: <Share2 size={14} />, onClick: () => handleShare(dataset) },
    { label: 'Export Data', icon: <Download size={14} />, onClick: () => handleExport(dataset) },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(dataset.id) }
  ];

  const filteredDatasets = useMemo(() => {
    return datasets.filter(d => {
      const matchesSearch = !searchQuery.trim() || 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.fileType && d.fileType.toLowerCase().includes(searchQuery.toLowerCase()));

      const zone = getDatasetZone(d.tags);
      const matchesZone = selectedZone === 'All' || zone.toLowerCase().includes(selectedZone.toLowerCase());

      return matchesSearch && matchesZone;
    });
  }, [datasets, searchQuery, selectedZone]);

  const zoneBadgeStyle = (zoneName) => {
    if (zoneName.includes('Gold')) {
      return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
    }
    if (zoneName.includes('Silver')) {
      return { bg: 'rgba(148, 163, 184, 0.15)', text: 'var(--text-secondary)', border: 'rgba(148, 163, 184, 0.3)' };
    }
    return { bg: 'rgba(217, 119, 6, 0.15)', text: '#d97706', border: 'rgba(217, 119, 6, 0.3)' };
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Dataset Catalog & Data Lake</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Browse, organize, govern storage zones, and query enterprise data assets.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/add-dataset')}>Add Dataset</Button>
      </div>

      {/* Storage Zone Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'All', label: 'All Lake Assets' },
          { id: 'Bronze', label: '🥉 Bronze (Raw Zone)' },
          { id: 'Silver', label: '🥈 Silver (Cleaned Zone)' },
          { id: 'Gold', label: '🥇 Gold (Curated Zone)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedZone(tab.id)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '20px',
              border: selectedZone === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              backgroundColor: selectedZone === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
              color: selectedZone === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <Input 
            placeholder="Search datasets by name, tag, or owner..." 
            icon={Search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading datasets...</div>
        ) : datasets.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Database size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)' }}>No datasets found</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)' }}>Ingest your first dataset into the lake to start querying and analyzing data.</p>
            <Button variant="primary" onClick={() => navigate('/add-dataset')}>Upload Dataset</Button>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No datasets found matching your current filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dataset Name</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Storage Zone</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Partition Key</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      Records <ArrowDown size={14} />
                    </div>
                  </th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last Updated</th>
                  <th style={{ padding: '1rem 1.5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((dataset, idx) => {
                  const zone = getDatasetZone(dataset.tags);
                  const partition = getDatasetPartition(dataset.tags);
                  const zoneStyle = zoneBadgeStyle(zone);

                  return (
                    <tr 
                      key={dataset.id} 
                      style={{ 
                        borderBottom: idx !== filteredDatasets.length - 1 ? '1px solid var(--border-color)' : 'none', 
                        transition: 'background 0.15s ease', 
                        cursor: 'pointer' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => navigate(`/dataset/${dataset.id}`)}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ margin: '0 0 0.125rem 0', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{dataset.name}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dataset.description || 'No description provided'}</p>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '3px 9px', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: zoneStyle.bg,
                          color: zoneStyle.text,
                          border: `1px solid ${zoneStyle.border}`
                        }}>{zone}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {partition !== 'None' ? (
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent-primary)',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            Partition: {partition}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            None
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>{dataset.fileType}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{(dataset.rowCount || 0).toLocaleString()}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px', 
                          borderRadius: '16px', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: dataset.status === 'Ready' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: dataset.status === 'Ready' ? 'var(--status-success)' : 'var(--status-warning)'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', marginRight: '6px' }}></span>
                          {dataset.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {new Date(dataset.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu options={datasetOptions(dataset)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
