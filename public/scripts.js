// Real-time facial detection using webcam
const run = async () => {
    // Load models
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
    ]);

    // Prepare to load images and their face descriptors
    const labeledFaceDescriptors = [];

    // Fetch the list of image filenames from the JSON file
    const response = await fetch('./imageList.json');
    const imageFilenames = await response.json();

    // Load each image and get its face descriptor
    for (const filename of imageFilenames) {
        const imageBlob = await fetch(`./images/${filename}`).then(res => res.blob());
        const img = await faceapi.bufferToImage(imageBlob);
        const detectedFace = await faceapi.detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detectedFace) {
            const descriptor = detectedFace.descriptor;
            const label = filename.split('.')[0]; // Remove the file extension
            labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [descriptor]));
        } else {
            console.warn(`No face detected in the image: ${filename}`);
        }
    }

    // Create a FaceMatcher
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6); // Threshold for matching

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
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();

            // Ensure video dimensions are valid
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.error("Invalid video dimensions.");
                return;
            }

            const resizedData = faceapi.resizeResults(faceAIData, displaySize);

            // Clear the canvas before drawing
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            // Draw bounding boxes and landmarks
            faceapi.draw.drawDetections(canvas, resizedData);

            // Match detected faces with labeled face descriptors
            resizedData.forEach(face => {
                const bestMatch = faceMatcher.findBestMatch(face.descriptor);

                if (bestMatch.label !== 'unknown') {
                    const textField = new faceapi.draw.DrawTextField(
                        [bestMatch.label], // Use the image filename as label
                        face.detection.box.topRight
                    );
                    textField.draw(canvas);
                }
            });
        }, 100); // Update every 100ms
    });
};

run();