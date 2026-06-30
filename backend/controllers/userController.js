const prisma = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        roomNumber: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, roomNumber, phoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        roomNumber,
        phoneNumber
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roomNumber: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true
      }
    });

    return res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ error: 'Avatar URL is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true
      }
    });

    return res.json({
      message: 'Avatar updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar
};
