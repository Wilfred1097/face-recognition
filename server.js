const express = require('express');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const cors = require('cors');

const app = express();
const PORT = 5500;

// Use CORS middleware
app.use(cors()); // Enable CORS for all routes

// Serve static files from the public directory
app.use(express.static('public'));

// Ensure the images directory exists
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Endpoint to handle image uploads
app.post('/upload', (req, res) => {
    const busboy = new Busboy({ headers: req.headers });
    let filename = '';

    busboy.on('file', (fieldname, file, mimetype, name) => {
        filename = name; // Store the filename
        const saveTo = path.join(imagesDir, filename);
        
        // Pipe the incoming file stream to a write stream
        file.pipe(fs.createWriteStream(saveTo))
            .on('error', (writeError) => {
                console.error(`Error writing file: ${writeError.message}`);
                return res.status(500).send('Error writing the file.');
            });

        file.on('end', () => {
            console.log(`Uploaded: ${filename}`);
        });
    });

    busboy.on('finish', () => {
        // Read the current imageList.json
        fs.readFile('./public/imageList.json', 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading image list: ${err.message}`);
                return res.status(500).send('Error reading image list.');
            }

            let imageList;
            try {
                imageList = JSON.parse(data);
            } catch (parseErr) {
                console.error(`Error parsing image list: ${parseErr.message}`);
                return res.status(500).send('Error parsing image list.');
            }

            imageList.push(filename);

            fs.writeFile('./public/imageList.json', JSON.stringify(imageList, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing image list: ${err.message}`);
                    return res.status(500).send('Error writing image list.');
                }
                return res.status(200).send({ message: 'Image uploaded successfully!', filename: filename });
            });
        });
    });

    req.pipe(busboy); // Pipe the request to Busboy
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});