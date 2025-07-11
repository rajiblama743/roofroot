const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUpload() {
  try {
    console.log('Testing upload functionality...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3000/health');
    console.log('Health check:', healthResponse.ok ? '✅ PASS' : '❌ FAIL');
    
    // Create a test file
    const testContent = 'This is a test image content';
    fs.writeFileSync('test-image.jpg', testContent);
    
    // Test upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-image.jpg'));
    formData.append('filename', 'test-upload.jpg');
    formData.append('bucket', 'roofroot-storage');
    
    const uploadResponse = await fetch('http://localhost:3000/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('Upload test:', '✅ PASS');
      console.log('Download URL:', result.downloadUrl);
      
      // Test download URL
      const downloadResponse = await fetch(result.downloadUrl);
      console.log('Download test:', downloadResponse.ok ? '✅ PASS' : '❌ FAIL');
    } else {
      console.log('Upload test:', '❌ FAIL');
      const error = await uploadResponse.text();
      console.log('Error:', error);
    }
    
    // Clean up
    fs.unlinkSync('test-image.jpg');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpload(); 