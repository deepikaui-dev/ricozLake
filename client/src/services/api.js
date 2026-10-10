import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;
export const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const datasetService = {
  getAllDatasets: async () => {
    const response = await api.get('/datasets');
    return response.data;
  },
  
  getDatasetById: async (id) => {
    const response = await api.get(`/datasets/${id}`);
    return response.data;
  },

  getDatasetPreview: async (id, limit = 500) => {
    try {
      const response = await api.get(`/datasets/${id}/preview?limit=${limit}`);
      return response.data?.preview || response.data || [];
    } catch {
      return [];
    }
  },
  
  uploadDataset: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.zone) formData.append('zone', metadata.zone);
    if (metadata.partitionKey) formData.append('partitionKey', metadata.partitionKey);

    const response = await api.post('/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateDatasetZone: async (id, zone) => {
    const response = await api.patch(`/datasets/${id}/zone`, { zone });
    return response.data;
  },

  updateDatasetPartition: async (id, partitionKey) => {
    const response = await api.patch(`/datasets/${id}/partition`, { partitionKey });
    return response.data;
  },

  getDownloadUrl: (id, format = 'csv') => {
    return `${API_URL}/datasets/${id}/download?format=${format}`;
  },

  deleteDataset: async (id) => {
    const response = await api.delete(`/datasets/${id}`);
    return response.data;
  }
};

export const queryService = {
  getQueries: async () => {
    const response = await api.get('/queries');
    return response.data;
  },
  createQuery: async (data) => {
    const response = await api.post('/queries', data);
    return response.data;
  },
  updateQuery: async (id, data) => {
    const response = await api.put(`/queries/${id}`, data);
    return response.data;
  },
  deleteQuery: async (id) => {
    const response = await api.delete(`/queries/${id}`);
    return response.data;
  }
};

export const dataSourceService = {
  getDataSources: async () => {
    const response = await api.get('/data-sources');
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export const apiKeyService = {
  getKeys: async () => {
    const response = await api.get('/keys');
    return response.data;
  },
  createKey: async (name) => {
    const response = await api.post('/keys', { name });
    return response.data;
  },
  revokeKey: async (id) => {
    const response = await api.delete(`/keys/${id}`);
    return response.data;
  }
};

export default api;

