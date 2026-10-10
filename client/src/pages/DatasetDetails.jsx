import React, { useState, useEffect } from 'react';
// Force Vite HMR recompile
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataQualityCard } from '../components/DataQualityCard';
import { VersionHistory } from '../components/VersionHistory';
import { Database, Download, Table, Activity, Loader, FileJson, FileSpreadsheet } from 'lucide-react';
import { datasetService } from '../services/api';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

export const DatasetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataset, setDataset] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const [data, preview] = await Promise.all([
          datasetService.getDatasetById(id),
          datasetService.getDatasetPreview(id).catch(() => []) // Fallback to empty array if preview fails
        ]);
        setDataset(data);
        setPreviewData(preview);
      } catch (error) {
        toast.error('Failed to load dataset details');
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}><Loader size={32} className="spin" /></div>;
  }

  if (!dataset) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Dataset not found.</div>;
  }

  const displayedPreviewData = showAllRows ? previewData : previewData.slice(0, 5);

  const getDatasetZone = () => {
    const zoneTag = dataset.tags?.find(t => t.name.startsWith('zone:'));
    return zoneTag ? zoneTag.name.replace('zone:', '') : 'Bronze (Raw)';
  };

  const getDatasetPartition = () => {
    const partTag = dataset.tags?.find(t => t.name.startsWith('partition:'));
    return partTag ? partTag.name.replace('partition:', '') : 'None';
  };

  const handlePromoteZone = async (newZone) => {
    const loadingToast = toast.loading(`Promoting storage zone to ${newZone}...`);
    try {
      const res = await datasetService.updateDatasetZone(dataset.id, newZone);
      toast.success(res.message || `Promoted to ${newZone}`, { id: loadingToast });
      const updated = await datasetService.getDatasetById(dataset.id);
      setDataset(updated);
    } catch (err) {
      toast.error('Failed to update storage zone', { id: loadingToast });
    }
  };

  const handleUpdatePartition = async (newKey) => {
    const loadingToast = toast.loading(`Configuring partition strategy to [${newKey}]...`);
    try {
      const res = await datasetService.updateDatasetPartition(dataset.id, newKey);
      toast.success(res.message || 'Partition strategy updated', { id: loadingToast });
      const updated = await datasetService.getDatasetById(dataset.id);
      setDataset(updated);
    } catch (err) {
      toast.error('Failed to update partition strategy', { id: loadingToast });
    }
  };

  const currentZone = getDatasetZone();
  const currentPartition = getDatasetPartition();

  // Use real versions if available, else mock
  const versions = dataset.versions?.length > 0 ? dataset.versions.map(v => ({
    version: v.versionNumber.toString(),
    date: new Date(v.createdAt).toLocaleString(),
    description: v.description || 'Update'
  })) : [
    { version: '1', date: new Date(dataset.createdAt).toLocaleString(), description: 'Initial dataset import.' }
  ];

  const handleExport = () => {
    setIsExportModalOpen(false);
    toast.promise(
      new Promise((resolve) => {
        const downloadUrl = datasetService.getDownloadUrl(dataset.id, exportFormat);
        
        // Trigger actual browser download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${dataset.name}.${exportFormat}`; // Fallback suggestion
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(resolve, 800);
      }),
      {
        loading: `Preparing ${exportFormat.toUpperCase()} export...`,
        success: `${dataset.name}.${exportFormat} downloaded successfully!`,
        error: 'Export failed.'
      }
    );
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Database size={24} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, wordBreak: 'break-all' }}>{dataset.name}</h2>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.75rem',
              backgroundColor: dataset.status === 'Ready' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: dataset.status === 'Ready' ? 'var(--status-success)' : 'var(--status-warning)'
            }}>{dataset.status}</span>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: currentZone.includes('Gold') ? 'rgba(234, 179, 8, 0.15)' : currentZone.includes('Silver') ? 'rgba(148, 163, 184, 0.15)' : 'rgba(217, 119, 6, 0.15)',
              color: currentZone.includes('Gold') ? '#eab308' : currentZone.includes('Silver') ? 'var(--text-secondary)' : '#d97706',
              border: '1px solid var(--border-color)'
            }}>
              {currentZone}
            </span>
            {currentPartition !== 'None' && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                Partition: {currentPartition}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{dataset.description || 'No description provided.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}><Download size={18} /> Export</Button>
          <Button variant="primary" onClick={() => navigate('/queries')}><Table size={18} /> Query Data</Button>
        </div>
      </div>

      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title={`Export ${dataset.name}`}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Select the format you want to export your dataset as. Large datasets may take a few moments to process.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div 
            onClick={() => setExportFormat('csv')}
            style={{
              padding: '1rem',
              border: `1px solid ${exportFormat === 'csv' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              backgroundColor: exportFormat === 'csv' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <FileSpreadsheet size={32} color={exportFormat === 'csv' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 500, color: exportFormat === 'csv' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>CSV Format</span>
          </div>
          
          <div 
            onClick={() => setExportFormat('json')}
            style={{
              padding: '1rem',
              border: `1px solid ${exportFormat === 'json' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              backgroundColor: exportFormat === 'json' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <FileJson size={32} color={exportFormat === 'json' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 500, color: exportFormat === 'json' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>JSON Format</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleExport}><Download size={16} /> Download {exportFormat.toUpperCase()}</Button>
        </div>
      </Modal>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
        {['overview', 'zones', 'quality', 'query', 'history'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 1rem 0',
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 500,
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'history' ? 'Version History' : tab === 'quality' ? 'Data Quality' : tab === 'zones' ? 'Storage Zones & Partitions' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content" style={{ animation: 'slideUpFade 0.3s ease-out' }}>
        {activeTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Rows</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem' }}>{(dataset.rowCount || 0).toLocaleString()}</h3>
              </Card>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Columns</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem' }}>{(dataset.colCount || 0).toLocaleString()}</h3>
              </Card>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Lake Storage Tier</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', color: currentZone.includes('Gold') ? '#eab308' : currentZone.includes('Silver') ? 'var(--text-primary)' : '#d97706' }}>
                  {currentZone}
                </h3>
              </Card>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Partition Strategy</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', color: currentPartition !== 'None' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {currentPartition !== 'None' ? `By ${currentPartition}` : 'Unpartitioned'}
                </h3>
              </Card>
            </div>

            <Card 
              title="Data Preview" 
              subtitle={previewData.length > 5 ? (showAllRows ? `Showing all ${previewData.length} rows` : `Showing first 5 of ${previewData.length} rows`) : `Showing ${previewData.length} rows`} 
              footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {previewData.length > 5 ? (
                    <Button variant="secondary" size="sm" onClick={() => setShowAllRows(!showAllRows)}>
                      {showAllRows ? 'Show First 5 Rows' : `View All Rows (${previewData.length})`}
                    </Button>
                  ) : <div />}
                  <Button variant="outline" size="sm" onClick={() => navigate('/queries')}>Query Full Dataset</Button>
                </div>
              }
            >
              <div style={{ overflowX: 'auto', margin: '0 -1.5rem', padding: '0 1.5rem' }}>
                {previewData && previewData.length > 0 && typeof previewData[0] === 'object' && previewData[0] !== null ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPreviewData.map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {Object.values(row).map((val, i) => (
                            <td key={i} style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', whiteSpace: 'nowrap', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {val !== null && val !== undefined ? String(val) : <span style={{ color: 'var(--text-muted)' }}>null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <em>Preview not available for this file type or dataset is empty.</em>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'zones' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card title="Medallion Storage Zone" subtitle="Current governance and processing stage in the data lake">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {[
                  {
                    id: 'Bronze (Raw)',
                    title: '🥉 Bronze Zone (Raw Landing)',
                    desc: 'Original, append-only ingested data without alteration. Preserves data lineage and raw auditability.',
                    isCurrent: currentZone.includes('Bronze')
                  },
                  {
                    id: 'Silver (Cleaned)',
                    title: '🥈 Silver Zone (Cleaned & Structured)',
                    desc: 'Deduplicated, schema-validated, and standardized enterprise data ready for analysis.',
                    isCurrent: currentZone.includes('Silver')
                  },
                  {
                    id: 'Gold (Curated)',
                    title: '🥇 Gold Zone (Curated Business Data)',
                    desc: 'Aggregated, business-level curated models optimized for reporting, dashboards, and AI.',
                    isCurrent: currentZone.includes('Gold')
                  }
                ].map((tier) => (
                  <div
                    key={tier.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: tier.isCurrent ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      backgroundColor: tier.isCurrent ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{tier.title}</h4>
                      {tier.isCurrent ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                          Current Tier
                        </span>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handlePromoteZone(tier.id)}>
                          Move Here
                        </Button>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {tier.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Partition Key Management" subtitle="Optimize lake scan cost and query response times">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Partitioning divides massive datasets into physical subdirectories (e.g., <code style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>/partition=value/</code>) so queries skip irrelevant files.
                </p>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    Active Partition Key:
                  </label>
                  <select
                    value={currentPartition}
                    onChange={(e) => handleUpdatePartition(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="None">None (Single Partition)</option>
                    <option value="date">date (Time-series / Yearly / Monthly / Daily)</option>
                    <option value="region">region (Geographic partition)</option>
                    <option value="department">department (Organizational department)</option>
                    <option value="category">category (Domain category)</option>
                  </select>
                </div>

                <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Storage Path Format:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {currentPartition !== 'None' ? `lake://datasets/${dataset.id}/${currentPartition}={value}/*.${dataset.fileType.toLowerCase()}` : `lake://datasets/${dataset.id}/data.${dataset.fileType.toLowerCase()}`}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'quality' && (
          <div style={{ maxWidth: '600px' }}>
            {dataset.quality ? (
              <DataQualityCard 
                score={dataset.quality.score} 
                rows={dataset.rowCount} 
                columns={dataset.colCount} 
                missingValues={dataset.quality.missingValues} 
                duplicateRows={dataset.quality.duplicateRows} 
              />
            ) : (
              <p>No quality metrics available for this dataset yet.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ maxWidth: '600px' }}>
            <VersionHistory versions={versions} />
          </div>
        )}

        {activeTab === 'query' && (
          <Card>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Table size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Analyze your Data</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Open this dataset in the advanced SQL Editor to run custom queries, join with other tables, and generate insights.
              </p>
              <Button variant="primary" onClick={() => navigate('/queries')}>
                Open in SQL Editor
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
