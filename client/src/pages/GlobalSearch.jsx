import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Database, Bookmark, Server, Search, FileText, AppWindow } from 'lucide-react';
import { API_URL } from '../services/api';

export const GlobalSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState({ pages: [], datasets: [], queries: [], dataSources: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      
      // Fetch Datasets
      let datasets = [];
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/datasets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          datasets = await res.json();
        }
      } catch (err) {
        console.error(err);
      }

      // Fetch Saved Queries
      let queriesList = [];
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/queries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const rawQueries = await res.json();
          queriesList = (rawQueries || []).map(q => ({
            id: q.id,
            name: q.name,
            target: q.queryConfig?.target || q.dataset?.name || 'Dataset'
          }));
        }
      } catch (err) {
        console.error(err);
      }

      let dataSources = [];
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/data-sources`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          dataSources = await res.json();
        }
      } catch (err) {
        console.error(err);
      }

      const appPages = [
        { id: 1, name: 'Dashboard', path: '/', description: 'Main application dashboard' },
        { id: 2, name: 'Settings', path: '/settings', description: 'Manage your account and platform preferences' },
        { id: 3, name: 'Activity Center', path: '/activity', description: 'Recent activity and logs' },
        { id: 4, name: 'Data Catalog', path: '/catalog', description: 'Browse all datasets' },
        { id: 5, name: 'Data Sources', path: '/data-sources', description: 'Manage external database connections' },
        { id: 6, name: 'Saved Queries', path: '/queries', description: 'Access saved SQL queries' },
        { id: 7, name: 'Add Dataset', path: '/add-dataset', description: 'Upload or connect a new dataset' }
      ];

      const q = query.toLowerCase();

      setResults({
        pages: appPages.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
        datasets: datasets.filter(d => d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q))),
        queries: queriesList.filter(sq => sq.name.toLowerCase().includes(q) || (sq.target && sq.target.toLowerCase().includes(q))),
        dataSources: dataSources.filter(ds => ds.name.toLowerCase().includes(q) || (ds.host && ds.host.toLowerCase().includes(q)))
      });
      
      setIsLoading(false);
    };

    if (query) {
      fetchResults();
    } else {
      setResults({ pages: [], datasets: [], queries: [], dataSources: [] });
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="page-animate">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={24} /> Global Search
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
          {query ? `Showing results for "${query}"` : 'Enter a search term in the top bar to find resources.'}
        </p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Searching...</p>
      ) : !query ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>Start searching using the bar above</p>
        </div>
      ) : (results.pages.length === 0 && results.datasets.length === 0 && results.queries.length === 0 && results.dataSources.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>No results found for "{query}"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Pages */}
          {results.pages.length > 0 && (
            <section>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <AppWindow size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Application Pages ({results.pages.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {results.pages.map(p => (
                  <Card key={p.id} style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => navigate(p.path)}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{p.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.description}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Datasets */}
          {results.datasets.length > 0 && (
            <section>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <Database size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Datasets ({results.datasets.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {results.datasets.map(d => (
                  <Card key={d.id} style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => navigate(`/dataset/${d.id}`)}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{d.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.description || 'No description'}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Queries */}
          {results.queries.length > 0 && (
            <section>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <Bookmark size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Saved Queries ({results.queries.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {results.queries.map(q => (
                  <Card key={q.id} style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => navigate('/queries')}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{q.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Target: {q.target}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Data Sources */}
          {results.dataSources.length > 0 && (
            <section>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <Server size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Data Sources ({results.dataSources.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {results.dataSources.map(ds => (
                  <Card key={ds.id} style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => navigate('/data-sources')}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{ds.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Host: {ds.host}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};
