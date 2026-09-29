import api from './client';

export const getActiveCatalogApi = async () => {
  const { data } = await api.get('/products?catalog=active');
  return data;
};

export const getProductsAdminApi = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductByIdApi = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProductApi = async (productData) => {
  const { data } = await api.post('/products', productData);
  return data;
};

export const updateProductApi = async (id, productData) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
};

export const deleteProductApi = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Categories
export const getCategoriesApi = async (all = false) => {
  const { data } = await api.get('/categories', { params: { all } });
  return data;
};

export const createCategoryApi = async (categoryData) => {
  const { data } = await api.post('/categories', categoryData);
  return data;
};

export const updateCategoryApi = async (id, categoryData) => {
  const { data } = await api.put(`/categories/${id}`, categoryData);
  return data;
};

export const deleteCategoryApi = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};
