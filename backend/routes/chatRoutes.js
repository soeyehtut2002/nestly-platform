const express = require('express');
const router = express.Router();
const { startChat, getChats, getMessages } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

router.post('/start', authenticateToken, startChat);
router.get('/', authenticateToken, getChats);
router.get('/:chatId/messages', authenticateToken, getMessages);

module.exports = router;
