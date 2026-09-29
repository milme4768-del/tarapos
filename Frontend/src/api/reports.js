import api from './client';

export const getDashboardSummaryApi = async () => {
  const { data } = await api.get('/reports/dashboard');
  return data;
};

export const getOutletReportApi = async (id, params = {}) => {
  const { data } = await api.get(`/reports/outlet/${id}`, { params });
  return data;
};

export const getSalesReportApi = async (params = {}) => {
  const { data } = await api.get('/reports/sales', { params });
  return data;
};
