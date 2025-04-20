// Real-time facial detection using webcam
const run = async () => {
    const loader = document.getElementById('loader');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');

    try {
        // Show loader while models are loading
        loader.style.display = 'block';
        video.style.display = 'none';
        canvas.style.display = 'none';

        // Load models
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
            faceapi.nets.ageGenderNet.loadFromUri('./models'),
        ]);

        // Hide loader and show video and canvas
        loader.style.display = 'none';
        video.style.display = 'block';
        canvas.style.display = 'block';

        // Prepare to load images and their face descriptors
        const labeledFaceDescriptors = [];

        // Fetch the list of image filenames from the JSON file
        const response = await fetch('./imageList.json');
        const imageList = await response.json();

        // Load each image and get its face descriptor
        for (const item of imageList) {
            const { filename, label } = item; // Destructure filename and label from the item
            const imageBlob = await fetch(`./images/${filename}`).then(res => res.blob());
            const img = await faceapi.bufferToImage(imageBlob);
            const detectedFace = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detectedFace) {
                const descriptor = detectedFace.descriptor;
                labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [descriptor])); // Use the label from JSON
            } else {
                console.warn(`No face detected in the image: ${filename}`);
            }
        }

        // Create a FaceMatcher
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 1.0); // Threshold for matching

        // Access the webcam
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                // console.log("Webcam accessed successfully!");
                video.srcObject = stream;
            })
            .catch(err => console.error("Error accessing webcam: ", err));

        // Process the video stream
        video.addEventListener('play', () => {
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

                // Clear the canvas before drawing
                canvas.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, canvas.width, canvas.height);

                // Draw bounding boxes and landmarks
                faceapi.draw.drawDetections(canvas, resizedData);

                // Match detected faces with labeled face descriptors
                resizedData.forEach(face => {
                    const bestMatch = faceMatcher.findBestMatch(face.descriptor);

                    if (bestMatch.label !== 'unknown') {
                        const textField = new faceapi.draw.DrawTextField(
                            [bestMatch.label], // Use the label from JSON
                            face.detection.box.topRight
                        );
                        textField.draw(canvas);
                    }
                });
            }, 100); // Update every 100ms
        });
    } catch (error) {
        console.error("Error loading models or initializing app:", error);
        loader.innerHTML = '<p class="text-danger">Failed to load models. Please try again.</p>';
    }
};

run();
