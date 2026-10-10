import React from 'react';
import { Card } from '../components/Card';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import './DataQualityCard.css';

export const DataQualityCard = ({ score, rows, columns, missingValues, duplicateRows }) => {
  const isGood = score >= 90;
  const isWarning = score >= 70 && score < 90;
  
  let statusClass = 'dq-good';
  if (isWarning) statusClass = 'dq-warning';
  if (!isGood && !isWarning) statusClass = 'dq-poor';

  return (
    <Card className={`dq-card ${statusClass}`} style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Data Quality</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Automated Assessment</p>
        </div>
        <div className="dq-score-pill">
          {score}%
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Rows</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{rows.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Columns</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{columns}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Missing Values</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: missingValues > 5 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
            {missingValues}%
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Duplicates</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: duplicateRows > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
            {duplicateRows}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: isGood ? 'var(--status-success)' : 'var(--status-warning)', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        {isGood ? (
          <><ShieldCheck size={16} /> Data is clean and ready for analysis.</>
        ) : (
          <><AlertCircle size={16} /> Attention required before processing.</>
        )}
      </div>
    </Card>
  );
};
