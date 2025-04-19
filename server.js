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
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// Serve static files from the public directory
app.use(express.static('public'));

// Endpoint to handle image uploads
app.post('/upload', upload.single('file'), (req, res) => {
    const filename = req.file.originalname; // `file` is the field name in the form
    console.log(`Uploaded: ${filename}`);

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

            // Restart the server after a new image upload
            restartServer();
            
            return res.status(200).send({ message: 'Image uploaded successfully!', filename: filename });
        });
    });
});

// Function to restart the server
function restartServer() {
    // Spawn a new process for the server
    const newServer = spawn('node', ['server_file_name.js'], {
        detached: true,
        stdio: 'inherit'
    });

    // Kill the current process
    process.exit();
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://face-recognition-z2nv.onrender.com:${PORT}`);
});