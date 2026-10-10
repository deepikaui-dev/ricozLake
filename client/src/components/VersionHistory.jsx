import React from 'react';
import { Card } from './Card';
import { History, GitCommit } from 'lucide-react';
import './VersionHistory.css';

export const VersionHistory = ({ versions }) => {
  return (
    <Card title="Version History" subtitle="Track changes and lineage">
      <div className="timeline">
        {versions.map((v, i) => (
          <div className="timeline-item" key={v.version}>
            <div className="timeline-icon">
              <GitCommit size={16} />
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <h4>Version {v.version}</h4>
                <span className="timeline-date">{v.date}</span>
              </div>
              <p>{v.description}</p>
              {i === 0 && <span className="timeline-badge">Current</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
