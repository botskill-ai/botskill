import axios from 'axios';

// 创建axios实例
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** OAuth 登录跳转 URL */
export const getOAuthUrl = (provider: 'google' | 'github') =>
  `${API_BASE_URL.replace(/\/api$/, '')}/api/auth/${provider}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Refresh token 逻辑：防止并发刷新
let refreshPromise: Promise<string> | null = null;

const doRefresh = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const data = res.data?.data || res.data;
  const newAccessToken = data.accessToken || data.token;
  const newRefreshToken = data.refreshToken;
  if (newAccessToken) {
    localStorage.setItem('token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    return newAccessToken;
  }
  throw new Error('Refresh failed');
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};

// 公开 API 列表（不需要认证，401 时不应该尝试刷新 token）
const publicAPIs = [
  '/skills',
  '/skills/search',
  '/skills/popular',
  '/skills/latest',
  '/blogs',
  '/site-settings',
  '/categories',
];

// 检查是否为公开 API
const isPublicAPI = (url: string) => {
  return publicAPIs.some(publicPath => url.includes(publicPath));
};

// 响应拦截器 - 401 时尝试 refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const isAuthRequest =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // 如果是公开 API，直接返回错误，不尝试刷新 token
    if (isPublicAPI(originalRequest?.url || '')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;
      originalRequest._retry = true;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearAuthAndRedirect();
      return Promise.reject(error);
    }
  }
);

// 验证码 API
export const captchaAPI = {
  generate: () => api.get('/captcha/generate'),
};

// 认证相关的API方法
export const authAPI = {
  // 用户注册
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    captchaId?: string;
    captcha?: string;
  }) => {
    return api.post('/auth/register', userData);
  },

  // 用户登录
  login: (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },

  // 用户登出
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/logout', refreshToken ? { refreshToken } : {}).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    });
  },

  // 刷新 access token
  refresh: (refreshToken: string) => {
    return api.post('/auth/refresh', { refreshToken });
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
};

// 管理员 Dashboard 统计 API
export const adminAPI = {
  getDashboardStats: (refresh?: boolean) =>
    api.get('/admin/dashboard', { params: refresh ? { refresh: '1' } : {} }),
};

// 公开站点设置（无需认证）
export const siteSettingsAPI = {
  get: () => api.get('/site-settings'),
};

// 系统设置 API（管理员）
export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: {
    siteTitle?: string;
    siteDescription?: string;
    require2FA?: boolean;
    enableEmailVerification?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string;
    maintenanceMode?: boolean;
  }) => api.put('/admin/settings', data),
};

// 用户管理相关的API方法
export const userAPI = {
  // 获取所有用户（管理员）
  getAllUsers: (params?: { page?: number; limit?: number }) => {
    return api.get('/admin/users', { params });
  },

  // 创建用户（管理员）
  createUser: (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }) => {
    return api.post('/admin/users', userData);
  },

  // 获取特定用户信息
  getUserById: (userId: string) => {
    return api.get(`/users/${userId}`);
  },

  // 更新用户信息
  updateUser: (userId: string, userData: {
    fullName?: string;
    bio?: string;
    avatar?: string;
  }) => {
    return api.put(`/users/${userId}`, userData);
  },

  // 管理员更新用户（可修改 username, email, fullName, bio）
  updateUserForAdmin: (userId: string, userData: {
    username?: string;
    email?: string;
    fullName?: string;
    bio?: string;
  }) => {
    return api.put(`/admin/users/${userId}`, userData);
  },

  // 管理员重置用户密码
  resetUserPassword: (userId: string, newPassword: string) => {
    return api.post(`/admin/users/${userId}/reset-password`, { newPassword });
  },

  // 管理员删除用户
  deleteUser: (userId: string) => {
    return api.delete(`/admin/users/${userId}`);
  },

  // 更新用户角色（管理员）
  updateUserRole: (userId: string, role: string) => {
    return api.put(`/admin/users/${userId}/role`, { role });
  },

  // 更新用户状态（管理员）
  updateUserStatus: (userId: string, isActive: boolean) => {
    return api.put(`/admin/users/${userId}/status`, { isActive });
  },

  // 我的收藏
  getFavorites: () => api.get('/users/me/favorites'),
  addFavorite: (skillId: string) => api.post(`/users/me/favorites/${skillId}`),
  removeFavorite: (skillId: string) => api.delete(`/users/me/favorites/${skillId}`),
};

// 权限管理 API（注意：实际路径为 /api/admin，baseURL 已包含 /api）
export const permissionAPI = {
  getAll: (params?: { page?: number; limit?: number; resource?: string; action?: string }) =>
    api.get('/admin/permissions', { params: params || {} }),
  create: (data: { name: string; description: string; resource: string; action: string }) =>
    api.post('/admin/permissions', data),
  update: (id: string, data: { description?: string; resource?: string; action?: string }) =>
    api.put(`/admin/permissions/${id}`, data),
  delete: (id: string) => api.delete(`/admin/permissions/${id}`),
};

// 前台技能库 API（公开，无需认证）
export const skillAPI = {
  // 分页获取已发布技能
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/skills', { params: params || {} }),
  // 搜索技能（支持关键词、分类、标签）
  search: (params?: { q?: string; category?: string; tags?: string; page?: number; limit?: number }) =>
    api.get('/skills/search', { params: params || {} }),
  // 获取单个技能详情
  getById: (id: string, incrementView?: boolean) =>
    api.get(`/skills/${id}`, { params: incrementView ? { incrementView: '1' } : {} }),
  // 获取技能指定版本详情（含 SKILL.md 正文内容）
  getVersion: (id: string, version: string) =>
    api.get(`/skills/${id}/versions/${encodeURIComponent(version)}`),
  // 热门技能
  getPopular: (limit?: number) => api.get('/skills/popular', { params: limit ? { limit } : {} }),
  // 最新技能
  getLatest: (limit?: number) => api.get('/skills/latest', { params: limit ? { limit } : {} }),
  // 当前用户自己的技能（需登录，publisher/admin）
  getMySkills: (params?: { page?: number; limit?: number; category?: string; status?: string; q?: string }) =>
    api.get('/skills/my', { params: params || {} }),
  // 获取下载链接（zip 文件）
  getDownloadUrl: (id: string, version?: string) => {
    const base = api.defaults.baseURL;
    const v = version ? `?version=${encodeURIComponent(version)}` : '';
    return `${base}/skills/${id}/download${v}`;
  },
  // 发布者删除自己的技能
  delete: (id: string) => api.delete(`/skills/${id}`),
};

// 技能管理 API（管理员）
export const skillAdminAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string; category?: string; author?: string; q?: string }) =>
    api.get('/skills/admin/all', { params: params || {} }),
  parseUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/skills/upload/parse', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  parseFromUrl: (url: string) =>
    api.post('/skills/upload/parse-url', { url }),
  create: (data: {
    name: string;
    description: string;
    version?: string;
    category: string;
    tags?: string[];
    repositoryUrl?: string;
    documentationUrl?: string;
    demoUrl?: string;
    license?: string;
    status?: string;
    authorId?: string;
    content?: string;
    compatibility?: string;
    allowedTools?: string[];
    overwrite?: boolean;
  }) => api.post('/skills/create-from-form', data),
  update: (id: string, data: {
    name?: string;
    description?: string;
    version?: string;
    category?: string;
    tags?: string[];
    repositoryUrl?: string;
    documentationUrl?: string;
    demoUrl?: string;
    license?: string;
    status?: string;
    authorId?: string;
    content?: string;
  }) => api.put(`/skills/update-from-form/${id}`, data),
  delete: (id: string) => api.delete(`/skills/admin/${id}`),
  deleteOwn: (id: string) => api.delete(`/skills/${id}`),
};

// 分类管理 API
export const categoryAPI = {
  // 公开 API：获取激活的分类（无需认证）
  getPublic: () => api.get('/categories'),
  // 管理员 API：获取所有分类（需要认证）
  getAll: (params?: { page?: number; limit?: number }) => 
    api.get('/admin/categories', { params: params || {} }),
  create: (data: {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    order?: number;
  }) => api.post('/admin/categories', data),
  update: (id: string, data: {
    displayName?: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

// 角色管理 API
export const roleAPI = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/admin/roles', { params }),
  getByName: (roleName: string) => api.get(`/admin/roles/${encodeURIComponent(roleName)}`),
  create: (data: { name: string; description?: string; permissionIds?: string[] }) =>
    api.post('/admin/roles', data),
  update: (roleName: string, data: { description?: string; permissionIds?: string[]; isActive?: boolean }) =>
    api.put(`/admin/roles/${encodeURIComponent(roleName)}`, data),
  delete: (roleName: string) => api.delete(`/admin/roles/${encodeURIComponent(roleName)}`),
  updatePermissions: (roleName: string, permissionIds: string[]) =>
    api.put(`/admin/roles/${encodeURIComponent(roleName)}/permissions`, { permissionIds }),
};

// 博客管理 API
export const blogAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; tag?: string; featured?: boolean }) =>
    api.get('/blogs', { params }),
  getBySlug: (slug: string) => api.get(`/blogs/slug/${slug}`),
  getById: (id: string) => api.get(`/blogs/${id}`),
  create: (data: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    contentType?: 'markdown' | 'html' | 'rich-text';
    coverImage?: string;
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) => api.post('/blogs', data),
  update: (id: string, data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    contentType?: 'markdown' | 'html' | 'rich-text';
    coverImage?: string;
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }) => api.put(`/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/${id}`),
  adminGetAll: (params?: { page?: number; limit?: number; status?: string; category?: string; author?: string }) =>
    api.get('/blogs/admin/all', { params }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/blogs/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;