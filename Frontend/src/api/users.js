import api from './client';

export const getUsersApi = async (params = {}) => {
  const { data } = await api.get('/users', { params });
  return data;
};

export const createUserApi = async (userData) => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const updateUserApi = async (id, userData) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

export const toggleUserStatusApi = async (id) => {
  const { data } = await api.patch(`/users/${id}/status`);
  return data;
};
