// Real-time facial detection using webcam
const run = async () => {
    // Load models
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
    ]);

    // Get the video element
    const video = document.getElementById('video');

    // Access the webcam
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
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
                .withFaceDescriptors()
                .withAgeAndGender();

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
            faceapi.draw.drawFaceLandmarks(canvas, resizedData);

            // Draw age and gender
            resizedData.forEach(face => {
                const { age, gender, genderProbability } = face;
                const genderText = `${gender} - ${genderProbability.toFixed(2)}`;
                const ageText = `${Math.round(age)} years`;
                const textField = new faceapi.draw.DrawTextField(
                    [genderText, ageText],
                    face.detection.box.topRight
                );
                textField.draw(canvas);
            });
        }, 100); // Update every 100ms
    });
};

run();