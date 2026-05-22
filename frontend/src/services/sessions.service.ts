import { api } from "@/lib/api";
import type { Table } from "@/types";

export const sessionsService = {
  async open(
    tableId: string,
    restaurantId: string,
    guestId?: string,
    guestName?: string,
    waiterId?: string,
  ) {
    const { data } = await api.post("/sessions", {
      tableId,
      restaurantId,
      guestId,
      guestName,
      waiterId,
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

  async getTablesByRestaurant(
    restaurantId: string,
    available?: boolean,
  ): Promise<Table[]> {
    const params = available ? { available: "true" } : {};
    const { data } = await api.get(`/tables/restaurant/${restaurantId}`, {
      params,
    });
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

  async leaveSession(sessionId: string, guestId: string) {
    const { data } = await api.post(`/sessions/${sessionId}/leave`, {
      guestId,
    });
    return data;
  },

  async requestAccess(sessionId: string, guestId: string) {
    const { data } = await api.post(`/sessions/${sessionId}/request-access`, {
      guestId,
    });
    return data;
  },

  async respondAccess(requestId: string, approved: boolean) {
    const { data } = await api.patch(`/sessions/access/${requestId}/respond`, {
      approved,
    });
    return data;
  },

  async getActiveSession(tableId: string, guestId?: string) {
    try {
      const params = guestId ? { guestId } : {};
      const { data } = await api.get(`/sessions/table/${tableId}/active`, {
        params,
      });
      return data;
    } catch {
      return null; // sem sessão ativa
    }
  },

  async getPendingAccessRequests(sessionId: string) {
    const { data } = await api.get(
      `/sessions/${sessionId}/access-requests/pending`,
    );
    return data;
  },
};
