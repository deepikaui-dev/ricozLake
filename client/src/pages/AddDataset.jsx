import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import { datasetService } from '../services/api';
import toast from 'react-hot-toast';
import './AddDataset.css';

export const AddDataset = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('Bronze (Raw)');
  const [partitionKey, setPartitionKey] = useState('None');
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const metadata = { name, description, zone, partitionKey };
    
    toast.promise(
      datasetService.uploadDataset(file, metadata),
      {
        loading: 'Uploading, partitioning and processing dataset...',
        success: (data) => {
          setTimeout(() => navigate('/catalog'), 1000);
          return 'Dataset successfully ingested!';
        },
        error: 'Failed to upload dataset. Please try again.'
      }
    ).finally(() => setUploading(false));
  };

  return (
    <div className="page-animate add-dataset-page">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Add New Dataset</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Ingest raw or processed data into RicozLake with storage zone and partition configuration.
        </p>
      </div>

      <Card className="add-dataset-card" style={{ padding: 0 }}>
        <div style={{ padding: '2rem' }}>
          <div className="form-group">
            <Input 
              label="Dataset Name" 
              placeholder="e.g., Q3_Global_Sales_Extract" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="input-label" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Description (Optional)</label>
            <textarea 
              className="input-field" 
              placeholder="Provide context about what this data represents..." 
              rows={3} 
              style={{ resize: 'vertical', paddingTop: '0.75rem', paddingBottom: '0.75rem', height: 'auto' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Storage Zone & Partition Management Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Storage Zone (Medallion Architecture)
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="Bronze (Raw)">🥉 Bronze Zone (Raw / Landing)</option>
                <option value="Silver (Cleaned)">🥈 Silver Zone (Cleaned / Validated)</option>
                <option value="Gold (Curated)">🥇 Gold Zone (Curated / Aggregated)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.35rem' }}>
                Defines governance stage and data lake tier.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Partition Key Strategy
              </label>
              <select
                value={partitionKey}
                onChange={(e) => setPartitionKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="None">None (Single Partition)</option>
                <option value="date">date (Time-series / Periodic)</option>
                <option value="region">region (Geo / Distributed)</option>
                <option value="department">department (Organizational)</option>
                <option value="category">category (Domain)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.35rem' }}>
                Organizes lake storage paths for low-cost high-speed queries.
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Data Source File</label>
            
            {!file ? (
              <div 
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileUpload').click()}
              >
                <input type="file" id="fileUpload" style={{ display: 'none' }} accept=".csv,.json" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                }} />
                <div className="dropzone-icon">
                  <UploadCloud size={28} />
                </div>
                <h3>Click to upload or drag and drop</h3>
                <p>Support for CSV or JSON (up to 50MB)</p>
                
                <div className="dropzone-divider">
                  <span>or</span>
                </div>
                
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); document.getElementById('fileUpload').click(); }}>
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-preview-info">
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileSpreadsheet size={20} className="file-icon" />
                  </div>
                  <div>
                    <h4>{file.name}</h4>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={() => setFile(null)}>
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions" style={{ padding: '1rem 2rem', margin: 0, backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          <Button variant="outline" onClick={() => navigate('/catalog')}>Cancel</Button>
          <Button variant="primary" disabled={!file || uploading} onClick={handleUpload}>
            {uploading ? 'Processing...' : 'Upload & Process Dataset'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
