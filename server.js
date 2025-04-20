const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process'); // Import child_process

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage to handle the file in memory
const upload = multer({ storage: storage });

// Serve static files from the public directory
app.use(express.static('public'));

// Endpoint to handle image uploads
app.post('/upload', upload.single('file'), (req, res) => {
    const originalFilename = req.file.originalname;
    const displayLabel = path.basename(originalFilename, path.extname(originalFilename)); // Get the label without extension

    console.log(`Attempting to upload: ${originalFilename}`);

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

        // Check if the label already exists
        const labelExists = imageList.some(image => image.label === displayLabel);

        if (labelExists) {
            console.log(`Label already exists: ${displayLabel}`);
            return res.status(400).send({ message: 'Label already exists. Please use a different name.' });
        }

        // Save the file to disk after confirming that the label does not exist
        const savedFilename = Date.now() + path.extname(originalFilename);
        const filePath = path.join('public/images/', savedFilename);

        fs.writeFile(filePath, req.file.buffer, (err) => {
            if (err) {
                console.error(`Error writing image file: ${err.message}`);
                return res.status(500).send('Error writing image file.');
            }

            // Push the object containing both filename and label
            imageList.push({
                filename: savedFilename,
                label: displayLabel
            });

            // Write the updated list back to imageList.json
            fs.writeFile('./public/imageList.json', JSON.stringify(imageList, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing image list: ${err.message}`);
                    return res.status(500).send('Error writing image list.');
                }

                // If no issues, respond with success
                return res.status(200).send({ message: 'Image uploaded successfully!', filename: savedFilename });
            });
        });
    });
});

// Function to restart the server with a delay
function restartServer() {
    // Allow some time for the response to be sent before restarting
    setTimeout(() => {
        const newServer = spawn('node', ['server_file_name.js'], {
            detached: true,
            stdio: 'inherit'
        });

        // Kill the current process
        process.exit();
    }, 1000); // Delay in milliseconds (1 second or more)
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://127.0.0.1:${PORT}`);
});