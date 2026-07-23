import { notificationRepository } from "@/repositories/notification.repository";

const RECENT_NOTIFICATIONS_LIMIT = 8;

export const notificationService = {
  async getInboxSummary(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.listForUser(userId, RECENT_NOTIFICATIONS_LIMIT),
      notificationRepository.countUnread(userId),
    ]);

    return { notifications, unreadCount };
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },
};
