import { api } from '@/lib/api';

export const authService = {
  async register(name: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async employeeLogin(email: string, password: string) {
    const { data } = await api.post('/employees/login', { email, password });
    return data;
  },
};