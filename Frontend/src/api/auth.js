import api from './client';

export const loginApi = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMeApi = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateProfileApi = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  return data;
};
