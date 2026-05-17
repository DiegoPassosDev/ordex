import { api } from "@/lib/api";
import type { Table } from "@/types";

export const sessionsService = {
  async open(tableId: string, restaurantId: string, guestId?: string) {
    const { data } = await api.post("/sessions", {
      tableId,
      restaurantId,
      guestId,
    });
    return data;
  },

  async getOne(sessionId: string) {
    const { data } = await api.get(`/sessions/${sessionId}`);
    return data;
  },

  async getTable(tableId: string): Promise<Table> {
    const { data } = await api.get(`/tables/${tableId}`);
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

  async requestBill(
    sessionId: string,
    body: {
      preferredPaymentMethod: string;
      serviceChargeAccepted: boolean;
    },
  ) {
    const { data } = await api.patch(
      `/sessions/${sessionId}/request-bill`,
      body,
    );
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
