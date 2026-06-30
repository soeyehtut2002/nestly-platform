const cloudinary = require('cloudinary').v2;

const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'nestly';

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // Graceful fallback for offline local development and test automation
      return res.json({
        mock: true,
        signature: 'mock_signature_for_local_development',
        timestamp,
        apiKey: 'mock_api_key',
        cloudName: 'mock_cloud_name',
        folder
      });
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    res.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate upload signature: ' + err.message });
  }
};

module.exports = {
  getUploadSignature
};
