import { api } from '@/lib/api';

export const ordersService = {
  async create(sessionId: string, guestId: string, items: any[]) {
    const body: any = { sessionId, items };
    if (guestId) body.guestId = guestId;
    const { data } = await api.post('/orders', body);
    return data;
  },

  async getBySession(sessionId: string) {
    const { data } = await api.get(`/orders/session/${sessionId}`);
    return data;
  },

  async getByRestaurant(restaurantId: string) {
    const { data } = await api.get(`/orders/restaurant/${restaurantId}`);
    return data;
  },

  async updateStatus(orderId: string, status: string) {
    const { data } = await api.patch(`/orders/${orderId}/status`, { status });
    return data;
  },

  async cancel(orderId: string) {
    const { data } = await api.delete(`/orders/${orderId}/cancel`);
    return data;
  },

  async updateItemStatus(orderId: string, itemId: string, status: string) {
    const { data } = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
    return data;
  },
};