import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/4e_crowdsource/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const apiService = {
  // Tables
  getTables: async () => {
    const response = await api.get('/tables');
    return response.data;
  },

  getTableStructure: async (tableName) => {
    const response = await api.get(`/tables/${tableName}/structure`);
    return response.data;
  },

  getTableStats: async (tableName) => {
    const response = await api.get(`/tables/${tableName}/stats`);
    return response.data;
  },

  // Records
  getRecords: async (tableName, params = {}) => {
    const response = await api.get(`/tables/${tableName}/records`, { params });
    return response.data;
  },

  getRecord: async (tableName, id) => {
    const response = await api.get(`/tables/${tableName}/records/${id}`);
    return response.data;
  },

  updateRecord: async (tableName, id, data) => {
    const response = await api.put(`/tables/${tableName}/records/${id}`, data);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
