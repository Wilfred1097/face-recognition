// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => {
            console.log('Service Worker registered successfully.');
        })
        .catch(err => {
            console.error('Service Worker registration failed: ', err);
        });
}

// Real-time facial detection using webcam
const run = async () => {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block';

    // Load essential models
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
        console.log("Tiny Face Detector model loaded.");
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        console.log("Face Landmark 68 model loaded.");

        // Load Face Recognition model after detecting landmarks
        await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
        console.log("Face Recognition model loaded.");

        // Load additional models if necessary
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('./models').then(() => {
                console.log("SSD Mobilenet v1 model loaded.");
            }),
            faceapi.nets.ageGenderNet.loadFromUri('./models').then(() => {
                console.log("Age and Gender model loaded.");
            })
        ]);

    } catch (error) {
        console.error("Error loading models: ", error);
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        return;
    }

    // Prepare to load images and their face descriptors
    const labeledFaceDescriptors = [];

    // Fetch the list of image filenames from the JSON file
    const response = await fetch('./imageList.json');
    const imageList = await response.json();

    // Load each image and get its face descriptor
    for (const item of imageList) {
        const { filename, label } = item;
        try {
            const imageBlob = await fetch(`./images/${filename}`).then(res => res.blob());
            const img = await faceapi.bufferToImage(imageBlob);
            const detectedFace = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detectedFace) {
                const descriptor = detectedFace.descriptor;
                labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [descriptor]));
            } else {
                console.warn(`No face detected in the image: ${filename}`);
            }
        } catch (error) {
            console.error(`Error processing image ${filename}: `, error);
        }
    }

    // Create a FaceMatcher after loading all descriptors
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 1.0);

    // Hide loading indicator
    loadingIndicator.style.display = 'none';

    // Get the video element
    const video = document.getElementById('video');

    // Access the webcam
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            console.log("Webcam accessed successfully!");
            video.srcObject = stream;
        })
        .catch(err => console.error("Error accessing webcam: ", err));

    // Process the video stream
    video.addEventListener('play', () => {
        const canvas = document.getElementById('canvas');
        const displaySize = { width: video.videoWidth, height: video.videoHeight };

        // Set canvas dimensions to match video
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;

        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const faceAIData = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            // Ensure video dimensions are valid
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.error("Invalid video dimensions.");
                return;
            }

            const resizedData = faceapi.resizeResults(faceAIData, displaySize);
            canvas.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, canvas.width, canvas.height);

            // Draw bounding boxes and landmarks
            faceapi.draw.drawDetections(canvas, resizedData);

            // Match detected faces with labeled face descriptors
            resizedData.forEach(face => {
                const bestMatch = faceMatcher.findBestMatch(face.descriptor);

                if (bestMatch.label !== 'unknown') {
                    const textField = new faceapi.draw.DrawTextField(
                        [bestMatch.label],
                        face.detection.box.topRight
                    );
                    textField.draw(canvas);
                }
            });
        }, 100); // Update every 100ms
    });
};

// Call the run function
run();