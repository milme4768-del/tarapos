import api from './client';

export const getCustomersApi = async (params = {}) => {
  const { data } = await api.get('/customers', { params });
  return data;
};

export const lookupCustomerApi = async (mobile) => {
  const { data } = await api.get('/customers/lookup', { params: { mobile } });
  return data;
};

export const getCustomerByIdApi = async (id) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};
