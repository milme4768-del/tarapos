import api from './client';

export const getOutletsApi = async (activeOnly = false) => {
  const { data } = await api.get('/outlets', { params: { activeOnly } });
  return data;
};

export const getOutletByIdApi = async (id) => {
  const { data } = await api.get(`/outlets/${id}`);
  return data;
};

export const createOutletApi = async (outletData) => {
  const { data } = await api.post('/outlets', outletData);
  return data;
};

export const updateOutletApi = async (id, outletData) => {
  const { data } = await api.put(`/outlets/${id}`, outletData);
  return data;
};

export const toggleOutletStatusApi = async (id) => {
  const { data } = await api.patch(`/outlets/${id}/status`);
  return data;
};

export const getPublicOutletsApi = async () => {
  const { data } = await api.get('/outlets/public');
  return data;
};

