const prisma = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized operation.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.json({
      message: 'Notification marked as read.',
      notification: updated
    });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
