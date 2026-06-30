const prisma = require('../config/db');

const startChat = async (req, res) => {
  try {
    const { sellerId } = req.body;
    const buyerId = req.user.id;
    const condominiumId = req.user.condominiumId; // Scoped by user location

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required to start a chat.' });
    }

    if (sellerId === buyerId) {
      return res.status(400).json({ error: 'You cannot start a chat with yourself.' });
    }

    // Verify seller exists and belongs to the same condominium
    const seller = await prisma.user.findUnique({
      where: { id: sellerId }
    });

    if (!seller || seller.condominiumId !== condominiumId) {
      return res.status(403).json({ error: 'Conversations are restricted to residents within the same condominium.' });
    }

    // Verify if chat already exists
    let chat = await prisma.chat.findFirst({
      where: {
        condominiumId,
        OR: [
          { buyerId: buyerId, sellerId: sellerId },
          { buyerId: sellerId, sellerId: buyerId }
        ]
      },
      include: {
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true } }
      }
    });

    if (!chat) {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          condominiumId,
          buyerId,
          sellerId: sellerId
        },
        include: {
          buyer: { select: { id: true, fullName: true } },
          seller: { select: { id: true, fullName: true } }
        }
      });
    }

    return res.json(chat);
  } catch (error) {
    console.error('Start Chat Error:', error);
    return res.status(500).json({ error: 'Internal server error starting chat.' });
  }
};

const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const condominiumId = req.user.condominiumId;

    const chats = await prisma.chat.findMany({
      where: {
        condominiumId,
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        buyer: { select: { id: true, fullName: true, roomNumber: true } },
        seller: { select: { id: true, fullName: true, roomNumber: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(chats);
  } catch (error) {
    console.error('Fetch Chats Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const condominiumId = req.user.condominiumId;

    // Verify chat belongs to this user & condo context
    const chat = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!chat || chat.condominiumId !== condominiumId || (chat.buyerId !== userId && chat.sellerId !== userId)) {
      return res.status(403).json({ error: 'Access denied to this conversation.' });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true } }
      }
    });

    // Mark messages from the other user as read
    await prisma.message.updateMany({
      where: {
        chatId: chatId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return res.json(messages);
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  startChat,
  getChats,
  getMessages
};
