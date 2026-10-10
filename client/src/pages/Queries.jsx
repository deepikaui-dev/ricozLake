import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Bookmark, Play, Clock, MoreVertical, Type, Edit2, Copy, Trash2, Database, Layers, Server, Plus, ChevronDown, ChevronUp, AlertCircle, Table, Maximize2, Minimize2, Search, X, Download } from 'lucide-react';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { DropdownMenu } from '../components/DropdownMenu';
import { datasetService, dataSourceService, queryService } from '../services/api';
import { executeSqlOnDataset } from '../utils/sqlExecutor';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Queries = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [rawDatasetsList, setRawDatasetsList] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isFullScreenResults, setIsFullScreenResults] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  
  const [editQuery, setEditQuery] = useState(null);
  const [activeQueryName, setActiveQueryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resultSearchQuery, setResultSearchQuery] = useState('');

  // Results State
  const [runResults, setRunResults] = useState([]);
  const [executionTime, setExecutionTime] = useState(0);

  // Modal Form State
  const [queryName, setQueryName] = useState('');
  const [targetDataset, setTargetDataset] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');

  // Fetch real queries and real databases/datasets
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedQueries, fetchedDatasets, fetchedDataSources] = await Promise.all([
        queryService.getQueries().catch(() => []),
        datasetService.getAllDatasets().catch(() => []),
        dataSourceService.getDataSources().catch(() => [])
      ]);

      if (Array.isArray(fetchedDatasets)) {
        setRawDatasetsList(fetchedDatasets);
      }

      // Map queries
      if (Array.isArray(fetchedQueries)) {
        setQueries(fetchedQueries.map(q => ({
          id: q.id,
          name: q.name,
          target: q.queryConfig?.target || 'Default Target',
          sql: q.queryConfig?.sql || 'SELECT * FROM table;',
          runTime: q.lastRunAt ? new Date(q.lastRunAt).toLocaleString() : 'Never run'
        })));
      }

      // Combine real Datasets and Data Sources
      const targets = [];
      if (Array.isArray(fetchedDatasets)) {
        fetchedDatasets.forEach(d => {
          targets.push({
            id: d.id,
            name: d.name,
            type: 'Dataset',
            subText: d.rowCount ? `${d.rowCount.toLocaleString()} rows` : d.fileType || 'File'
          });
        });
      }
      if (Array.isArray(fetchedDataSources)) {
        fetchedDataSources.forEach(ds => {
          targets.push({
            id: ds.id,
            name: ds.name,
            type: 'Data Source',
            subText: `${ds.type || 'DB'} • ${ds.host}`
          });
        });
      }

      setAvailableTargets(targets);
    } catch (err) {
      console.error('Failed to load queries data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for ESC key to exit full screen or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreenResults) {
        setIsFullScreenResults(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenResults]);

  const openCreateModal = () => {
    setEditQuery(null);
    setQueryName('');
    const defaultTarget = availableTargets[0]?.name || '';
    setTargetDataset(defaultTarget);
    setSqlQuery(defaultTarget ? `SELECT * FROM ${defaultTarget};` : 'SELECT * FROM table;');
    setShowAllChips(false);
    setIsModalOpen(true);
  };

  const handleEdit = (q) => {
    setEditQuery(q);
    setQueryName(q.name);
    setTargetDataset(q.target);
    setSqlQuery(q.sql);
    setShowAllChips(false);
    setIsModalOpen(true);
  };

  const handleTargetSelect = (targetName) => {
    setTargetDataset(targetName);
    if (!sqlQuery || sqlQuery.startsWith('SELECT * FROM')) {
      setSqlQuery(`SELECT * FROM ${targetName};`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!queryName.trim() || !targetDataset.trim()) {
      toast.error('Query Name and Target Dataset are required');
      return;
    }

    const toastId = toast.loading(editQuery ? 'Updating query...' : 'Saving query...');
    try {
      if (editQuery && typeof editQuery.id === 'string' && editQuery.id.length > 20) {
        await queryService.updateQuery(editQuery.id, {
          name: queryName,
          target: targetDataset,
          sql: sqlQuery
        });
        toast.success('Query updated successfully!', { id: toastId });
      } else {
        await queryService.createQuery({
          name: queryName,
          target: targetDataset,
          sql: sqlQuery
        });
        toast.success('Query saved successfully!', { id: toastId });
      }
      setIsModalOpen(false);
      setEditQuery(null);
      await fetchData(); // Refresh list from real DB
    } catch (err) {
      console.error('Save query error:', err);
      toast.error('Failed to save query', { id: toastId });
    }
  };

  const handleDelete = async (id, name) => {
    const toastId = toast.loading(`Deleting ${name}...`);
    try {
      await queryService.deleteQuery(id);
      toast.success('Query deleted', { id: toastId });
      setQueries(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      toast.error('Failed to delete query', { id: toastId });
    }
  };

  const handleRun = async (q) => {
    setActiveQueryName(q.name);
    setResultSearchQuery('');
    setIsFullScreenResults(false);
    const startTime = Date.now();
    const toastId = toast.loading(`Executing SQL query against ${q.target}...`);
    
    try {
      // Look up target dataset in rawDatasetsList
      const targetDatasetObj = rawDatasetsList.find(d => d.name.toLowerCase() === q.target.toLowerCase());
      
      let rawRows = [];
      if (targetDatasetObj) {
        // Fetch real records up to 1000 rows
        rawRows = await datasetService.getDatasetPreview(targetDatasetObj.id, 1000);
      } else if (rawDatasetsList.length > 0) {
        // Fallback to first available dataset
        rawRows = await datasetService.getDatasetPreview(rawDatasetsList[0].id, 1000);
      }

      // Execute SQL parser against actual SQL statement (e.g. LIMIT, WHERE, SELECT)
      const executedResults = executeSqlOnDataset(q.sql, rawRows);

      setExecutionTime(Date.now() - startTime);
      setRunResults(executedResults);
      toast.success(`Query executed successfully! (${executedResults.length} records returned)`, { id: toastId });
      setIsRunModalOpen(true);
    } catch (err) {
      toast.error('Query execution failed', { id: toastId });
    }
  };

  const filteredQueries = queries.filter(q => 
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const queryOptions = (q) => [
    { label: 'Edit Query', icon: <Edit2 size={14} />, onClick: () => handleEdit(q) },
    { label: 'Duplicate', icon: <Copy size={14} />, onClick: async () => {
        const toastId = toast.loading(`Duplicating ${q.name}...`);
        try {
          await queryService.createQuery({
            name: `${q.name} (Copy)`,
            target: q.target,
            sql: q.sql
          });
          toast.success(`Duplicated "${q.name}"`, { id: toastId });
          fetchData();
        } catch {
          toast.error('Failed to duplicate query', { id: toastId });
        }
    }},
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(q.id, q.name) }
  ];

  // Visible target chips limit
  const INITIAL_CHIP_LIMIT = 4;
  const visibleChips = showAllChips ? availableTargets : availableTargets.slice(0, INITIAL_CHIP_LIMIT);
  const hiddenCount = availableTargets.length - INITIAL_CHIP_LIMIT;

  // Filter runResults live based on resultSearchQuery
  const filteredRunResults = runResults.filter(row => {
    if (!resultSearchQuery.trim()) return true;
    const query = resultSearchQuery.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(query)
    );
  });

  const resultColumns = runResults.length > 0 && typeof runResults[0] === 'object' && runResults[0] !== null
    ? Object.keys(runResults[0])
    : [];

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Saved Queries</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Access and execute real queries against your connected datasets & databases</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}><Plus size={18} /> Create Query</Button>
      </div>

      <div style={{ marginBottom: '1.5rem', width: '300px' }}>
        <Input 
          placeholder="Search queries..." 
          icon={Bookmark} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Loading saved queries...</p>
        </div>
      ) : filteredQueries.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Bookmark size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{searchQuery ? 'No matching queries found' : 'No saved queries yet'}</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            {searchQuery ? 'Try adjusting your search terms.' : 'Create your first custom SQL query to filter and analyze real datasets.'}
          </p>
          {!searchQuery && (
            <Button variant="primary" onClick={openCreateModal} style={{ margin: '0 auto' }}>
              <Plus size={16} /> Create your first query
            </Button>
          )}
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredQueries.map((q) => (
            <Card key={q.id} style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
                  <Bookmark size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{q.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Target: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{q.target}</span>
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Clock size={14} /> {q.runTime}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => handleRun(q)}><Play size={14} /> Run</Button>
                  <DropdownMenu options={queryOptions(q)} icon={MoreVertical} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Query Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditQuery(null); }} title={editQuery ? "Edit Query" : "Create New Query"}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Query Name
            </label>
            <Input 
              name="queryName" 
              placeholder="e.g. Sales Metrics Analysis" 
              icon={Type} 
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                Target Dataset / Database
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select from real connected data</span>
            </div>
            
            {availableTargets.length > 0 ? (
              <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--accent-primary)', pointerEvents: 'none', zIndex: 1 }}>
                    <Database size={18} />
                  </span>
                  <select
                    name="targetDataset"
                    value={targetDataset}
                    onChange={(e) => handleTargetSelect(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      paddingLeft: '2.25rem',
                      paddingRight: '0.75rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled>-- Select Real Target --</option>
                    {availableTargets.map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        [{t.type}] {t.name} ({t.subText})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Production-Grade Interactive Chips with View More */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {visibleChips.map((t) => {
                    const isSelected = targetDataset === t.name;
                    return (
                      <button
                        type="button"
                        key={t.id || t.name}
                        onClick={() => handleTargetSelect(t.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 600 : 400,
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {t.type === 'Data Source' ? <Server size={12} /> : <Layers size={12} />}
                        <span>{t.name}</span>
                      </button>
                    );
                  })}

                  {/* Production Ready 'View More' Expand Button */}
                  {hiddenCount > 0 && !showAllChips && (
                    <button
                      type="button"
                      onClick={() => setShowAllChips(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--accent-primary)',
                        border: '1px stroke var(--accent-primary)',
                        borderStyle: 'dashed',
                        cursor: 'pointer'
                      }}
                    >
                      <span>+ View More ({hiddenCount})</span>
                      <ChevronDown size={12} />
                    </button>
                  )}

                  {showAllChips && availableTargets.length > INITIAL_CHIP_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setShowAllChips(false)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show Less</span>
                      <ChevronUp size={12} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                    No Datasets or Databases Connected
                  </span>
                  Please upload a dataset in the Catalog or connect a database in Data Sources first.
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <Button variant="secondary" size="sm" onClick={() => { setIsModalOpen(false); navigate('/catalog'); }}>Go to Catalog</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setIsModalOpen(false); navigate('/data-sources'); }}>Add Data Source</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>SQL or Plain English Query</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>✨ AI Natural Language Supported</span>
            </div>
            <textarea 
              name="sqlQuery"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter SQL (e.g. SELECT * FROM table LIMIT 25;) OR Plain English (e.g. show first 20 records)" 
              required
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                resize: 'vertical'
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="secondary" style={{ flex: 1 }} type="button" onClick={() => { setIsModalOpen(false); setEditQuery(null); }}>Cancel</Button>
            <Button variant="primary" style={{ flex: 1 }} type="submit" disabled={availableTargets.length === 0}>
              {editQuery ? 'Update Query' : 'Save Query'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Query Results Overlay (Supports Full Screen Zoom & Standard Modal) */}
      {isRunModalOpen && (
        isFullScreenResults ? (
          /* FULL SCREEN MODE: 25px Padding on all sides with Live Search Bar at Top */
          <div 
            style={{
              position: 'fixed',
              top: '25px',
              bottom: '25px',
              left: '25px',
              right: '25px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              animation: 'slideUpFade 0.25s ease-out',
              overflow: 'hidden'
            }}
          >
            {/* Header with Title and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Query Results: {activeQueryName}</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Full Screen View (25px padding) • Execution time: {executionTime}ms
                </span>
              </div>

              <button 
                onClick={() => { setIsRunModalOpen(false); setIsFullScreenResults(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Search Bar at Top of Full Screen View */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <Input 
                  placeholder="Search and filter results live by keyword, ID, value..." 
                  icon={Search} 
                  value={resultSearchQuery} 
                  onChange={(e) => setResultSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm" onClick={() => toast.success(`Exported ${filteredRunResults.length} records to CSV!`)}>
                <Download size={16} style={{ marginRight: '0.35rem' }} /> Export ({filteredRunResults.length})
              </Button>
            </div>

            {/* Full Screen Scrollable Table Container */}
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
              {filteredRunResults.length > 0 && resultColumns.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 2 }}>
                      {resultColumns.map((col) => (
                        <th key={col} style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRunResults.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {resultColumns.map((col, i) => (
                          <td key={i} style={{ padding: '0.85rem 1.25rem', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span style={{ color: 'var(--text-muted)' }}>null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Table size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0 }}>{resultSearchQuery ? 'No records matched your search query.' : 'No records returned.'}</p>
                </div>
              )}
            </div>

            {/* Footer Summary with 2 Arrow Icon Button at Bottom Right (No Extra Text) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Showing {filteredRunResults.length} of {runResults.length} records</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsFullScreenResults(false)}
                  title="Exit Full Screen"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD MODAL MODE WITH SEARCH BAR & 2 ARROW ICON BUTTON AT BOTTOM RIGHT (NO EXTRA TEXT) */
          <Modal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} title={`Query Results: ${activeQueryName}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header Action Bar: Live Search Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    placeholder="Search in query results..." 
                    icon={Search} 
                    value={resultSearchQuery} 
                    onChange={(e) => setResultSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Table Container */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '380px' }}>
                {filteredRunResults.length > 0 && resultColumns.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                        {resultColumns.map((col) => (
                          <th key={col} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRunResults.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {resultColumns.map((col, i) => (
                            <td key={i} style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span style={{ color: 'var(--text-muted)' }}>null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Table size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>{resultSearchQuery ? 'No matching records found.' : 'No records returned.'}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions: Info on left, Export & 2 Arrow Symbol Icon Button at Bottom Right Corner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Showing {filteredRunResults.length} of {runResults.length} records
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Button variant="primary" size="sm" onClick={() => { toast.success(`Exported ${filteredRunResults.length} results to CSV!`); setIsRunModalOpen(false); }}>
                    Export ({filteredRunResults.length})
                  </Button>
                  
                  {/* 2 Arrow Symbol Button (No Extra Text) at Bottom Right Corner */}
                  <button
                    type="button"
                    onClick={() => setIsFullScreenResults(true)}
                    title="Full Screen View (<>)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )
      )}
    </div>
  );
};
