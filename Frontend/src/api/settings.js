import api from './client';

export const getSettingsApi = async () => {
  const { data } = await api.get('/settings');
  return data;
};

export const updateSettingsApi = async (settingsData) => {
  const { data } = await api.put('/settings', settingsData);
  return data;
};
