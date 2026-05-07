import { api } from '@/lib/api';

export const menuService = {
  async getCategoriesByRestaurant(restaurantId: string) {
    const { data } = await api.get(
      `/menu/categories/restaurant/${restaurantId}`,
    );
    return data;
  },

  async toggleItemAvailability(itemId: string) {
    const { data } = await api.patch(`/menu/items/${itemId}/toggle`);
    return data;
  },
};