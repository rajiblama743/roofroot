# RoofRoot Backend API

This is the backend API server for the RoofRoot React Native app. It handles image uploads to Google Cloud Storage.

## Features

- Image upload to Google Cloud Storage
- Signed URL generation for direct uploads
- Image deletion from Google Cloud Storage
- Health check endpoint
- CORS enabled for React Native apps

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Google Cloud Storage:**
   - Create a Google Cloud Storage bucket
   - Create a service account with Storage Object Admin role
   - Download the service account key JSON file
   - Save it as `service-account-key.json` in this directory

3. **Configure the server:**
   - Update `BUCKET_NAME` in `server.js` to match your bucket name
   - Update `projectId` in `server.js` to match your Google Cloud project ID

4. **Start the server:**
   ```bash
   npm start
   ```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Upload Image
- **POST** `/upload-image`
- Uploads an image to Google Cloud Storage
- **Body:** Multipart form data with `file` field
- **Response:** `{ success: true, filename: string, downloadUrl: string }`

### Get Signed URL
- **POST** `/get-signed-url`
- Generates signed URLs for direct upload
- **Body:** `{ filename: string, contentType?: string }`
- **Response:** `{ uploadUrl: string, downloadUrl: string }`

### Get Download URL
- **POST** `/get-download-url`
- Gets a signed download URL for an image
- **Body:** `{ filename: string }`
- **Response:** `{ downloadUrl: string }`

### Delete Image
- **DELETE** `/delete-image`
- Deletes an image from Google Cloud Storage
- **Body:** `{ filename: string }`
- **Response:** `{ success: true, message: string }`

## Environment Variables

You can set these environment variables:

- `PORT`: Server port (default: 3000)
- `BUCKET_NAME`: Google Cloud Storage bucket name
- `PROJECT_ID`: Google Cloud project ID

## Security

- The service account key file is required for authentication
- CORS is enabled for React Native apps
- File size is limited to 10MB
- Only image files are accepted

## Deployment

### Google Cloud Run (Recommended)

1. Install Google Cloud CLI
2. Enable Cloud Run API
3. Deploy:
   ```bash
   gcloud run deploy roofroot-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Heroku

1. Create a Heroku app
2. Set environment variables
3. Deploy using Git

### Local Development

For React Native development:

- **iOS Simulator:** `http://localhost:3000`
- **Android Emulator:** `http://10.0.2.2:3000`
- **Physical Device:** Use your computer's IP address

## Troubleshooting

### Common Issues

1. **Service account key not found**
   - Make sure `service-account-key.json` is in the backend directory
   - Check file permissions

2. **Bucket not found**
   - Verify the bucket name in `server.js`
   - Check service account permissions

3. **CORS errors**
   - CORS is already enabled for all origins
   - Check if the request is reaching the server

4. **File upload fails**
   - Check file size (max 10MB)
   - Verify file format (images only)
   - Check network connectivity

### Debug Commands

```bash
# Check server logs
npm run dev

# Test health endpoint
curl http://localhost:3000/health

# Test file upload
curl -X POST -F "file=@test.jpg" http://localhost:3000/upload-image
```

## License

MIT 