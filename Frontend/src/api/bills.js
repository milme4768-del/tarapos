import api from './client';

export const createBillApi = async (billData) => {
  const { data } = await api.post('/bills', billData);
  return data;
};

export const getBillsApi = async (params = {}) => {
  const { data } = await api.get('/bills', { params });
  return data;
};

export const getBillByIdApi = async (id) => {
  const { data } = await api.get(`/bills/${id}`);
  return data;
};

export const updateBillApi = async (id, billData) => {
  const { data } = await api.put(`/bills/${id}`, billData);
  return data;
};

export const cancelBillApi = async (id, reason) => {
  const { data } = await api.post(`/bills/${id}/cancel`, { reason });
  return data;
};

export const deleteBillApi = async (id) => {
  const { data } = await api.delete(`/bills/${id}`);
  return data;
};
