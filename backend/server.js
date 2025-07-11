const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to get the server's IP address
const getServerIP = () => {
  const interfaces = os.networkInterfaces();
  
  // Look for the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost'; // Fallback
};

const SERVER_IP = getServerIP();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'roofroot-2bdfb', // Your Firebase project ID
  keyFilename: path.join(__dirname, 'service-account-key.json'), // Path to your service account key
});

const BUCKET_NAME = 'roofroot-storage'; // Update this to match your bucket name
const bucket = storage.bucket(BUCKET_NAME);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Server info endpoint - returns the server's IP and port
app.get('/server-info', (req, res) => {
  console.log('Server info requested from:', req.ip);
  res.json({
    serverIP: SERVER_IP,
    port: PORT,
    fullUrl: `http://${SERVER_IP}:${PORT}`,
    timestamp: new Date().toISOString(),
    platform: os.platform(),
    hostname: os.hostname(),
  });
});

// Upload image endpoint
app.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.body.filename || `image-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const file = bucket.file(`listing-images/${filename}`);

    // Upload file to Google Cloud Storage
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Generate signed URL for download (instead of making public)
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
    });

    console.log(`Successfully uploaded ${filename} to Google Cloud Storage`);
    
    res.json({
      success: true,
      filename,
      downloadUrl: downloadUrl,
    });
  } catch (error) {
    console.error('Error uploading to Google Cloud Storage:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
});

// Get signed URL for direct upload
app.post('/get-signed-url', async (req, res) => {
  try {
    const { filename, contentType = 'image/jpeg' } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const file = bucket.file(`listing-images/${filename}`);
    
    // Generate signed URL for upload
    const [uploadUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 1000 * 60 * 15, // 15 minutes
      contentType,
    });

    // Generate signed URL for download
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
    });

    res.json({
      uploadUrl,
      downloadUrl,
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Get download URL endpoint
app.post('/get-download-url', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const file = bucket.file(`listing-images/${filename}`);
    
    // Get signed URL for download
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
    });

    res.json({
      downloadUrl,
    });
  } catch (error) {
    console.error('Error getting download URL:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

// Delete image endpoint
app.delete('/delete-image', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const file = bucket.file(`listing-images/${filename}`);
    await file.delete();

    console.log(`Successfully deleted ${filename} from Google Cloud Storage`);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting from Google Cloud Storage:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested from:', req.ip);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'RoofRoot Backend',
    version: '1.0.0'
  });
});

// Test endpoint for debugging
app.get('/ping', (req, res) => {
  console.log('Ping requested from:', req.ip);
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    userAgent: req.get('User-Agent')
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 