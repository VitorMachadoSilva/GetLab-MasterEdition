import { prisma } from '@/lib/prisma';

type NotificationType = 'INFO' | 'BOOKING' | 'USER' | 'ROOM' | 'SYSTEM';

export async function createNotification({
  title,
  message,
  type = 'INFO',
  targetUserIds = [],
}: {
  title: string;
  message: string;
  type?: NotificationType;
  targetUserIds?: string[];
}) {
  try {
    await prisma.notification.create({
      data: {
        title: title.slice(0, 100),
        message: message.slice(0, 300),
        type,
        targetUserIds: Array.from(new Set(targetUserIds.filter(Boolean))),
      },
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}
