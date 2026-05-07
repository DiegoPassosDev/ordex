import { api } from '@/lib/api';

export const sessionsService = {
  async open(tableId: string, restaurantId: string) {
    const { data } = await api.post('/sessions', { tableId, restaurantId });
    return data;
  },

  async getOne(sessionId: string) {
    const { data } = await api.get(`/sessions/${sessionId}`);
    return data;
  },

  async getActiveByRestaurant(restaurantId: string) {
    const { data } = await api.get(
      `/sessions/restaurant/${restaurantId}/active`,
    );
    return data;
  },

  async assignWaiter(sessionId: string, waiterId: string) {
    const { data } = await api.patch(`/sessions/${sessionId}/assign-waiter`, {
      waiterId,
    });
    return data;
  },

  async requestBill(sessionId: string) {
    const { data } = await api.patch(`/sessions/${sessionId}/request-bill`);
    return data;
  },

  async callWaiter(sessionId: string, reason: string) {
    const { data } = await api.post(`/sessions/${sessionId}/call-waiter`, {
      reason,
    });
    return data;
  },

  async getTotal(sessionId: string) {
    const { data } = await api.get(`/sessions/${sessionId}/total`);
    return data;
  },

  async close(sessionId: string) {
    const { data } = await api.patch(`/sessions/${sessionId}/close`);
    return data;
  },
};