import http from 'http';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import formidable from 'formidable'; // Import formidable

const geminiApiUrl = process.env.GEMINI_API_URL;
const userUploadApiUrl = process.env.USER_UPLOAD_API_URL;

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Enable CORS for API requests
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Serve the frontend HTML
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } 
  // Handle button POST requests
  else if (req.method === 'POST' && req.url === '/select-topic') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // This is a crucial fix: Use the environment variable, not a hardcoded URL.
        const pyRes = await fetch(`${geminiApiUrl}/process-topic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const pyData = await pyRes.json();
        
        // ... (rest of your logic for handling Gemini response)
        let messageText;

        if (pyData.message?.parts && pyData.message.parts[0]?.text) {
          messageText = pyData.message.parts[0].text;
        } else if (typeof pyData.message === 'string') {
          messageText = pyData.message;
        } else {
          messageText = "Error fetching description";
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: messageText }));

      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error contacting Python service' }));
      }
    });
  }
  // New route to handle file uploads
  else if (req.method === 'POST' && req.url === '/upload-file') {
    const form = formidable({});
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('File upload error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to parse form data.' }));
        return;
      }
      
      const uploadedFile = files.file?.[0]; // Access the file object, which is an array
      
      if (!uploadedFile) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file was uploaded.' }));
        return;
      }

      // You can now access file details like path, size, etc.
      console.log('File received:', uploadedFile.originalFilename);
      
      // Now, forward the file to the user-upload microservice
      try {
        const fileData = fs.readFileSync(uploadedFile.filepath);
        
        const pyRes = await fetch(`${userUploadApiUrl}/process-file`, {
          method: 'POST',
          body: fileData,
          headers: {
            'Content-Type': uploadedFile.mimetype,
            'Content-Disposition': `attachment; filename="${uploadedFile.originalFilename}"`
          }
        });
        
        if (!pyRes.ok) {
          const errorText = await pyRes.text();
          console.error('Microservice error:', errorText);
          throw new Error('Microservice returned an error');
        }
        
        const pyData = await pyRes.json();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'File forwarded to microservice successfully.' }));
        
      } catch (forwardErr) {
        console.error('Error forwarding file:', forwardErr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to forward file to microservice.' }));
      }
    });
  } 
  // Catch-all for other routes
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => console.log(`Server running on port ${port}`));