# Face Recognition Project

This project uses JavaScript combined with the `face-api.js` library for real-time face detection and comparison. It enables seamless real-time face detection and identification by leveraging modern machine learning techniques in JavaScript.

## Technology Used

- **JavaScript**: Core language for implementing functionality.
- **face-api.js**: A machine learning library built on top of TensorFlow.js that provides pre-trained models for face detection, landmark detection, face recognition, and more.

## How Face Detection and Comparison Work

### 1. Face Detection
- Models like `tinyFaceDetector`, `ssdMobilenetv1`, and `faceLandmark68Net` are preloaded using `face-api.js`.
- The system integrates with a webcam to capture real-time video streams.
- Faces in the video stream are detected using the `detectAllFaces` method, which identifies faces and marks their landmarks (e.g., eyes, nose, mouth).

### 2. Face Descriptor Extraction
- Each detected face is processed to generate a **descriptor**, which is a numerical representation of key facial features.
- Pre-uploaded images of individuals are also processed to generate descriptors, which are then labeled (e.g., a person's name).

### 3. Face Matching
- Detected face descriptors are compared against the labeled descriptors using the `FaceMatcher` class from `face-api.js`.
- A similarity threshold determines if a match is found, and the matched label (e.g., a name) is displayed on the video stream.

### 4. Image Upload and Labeling
- Users can upload images via a form, where each image is labeled with the uploader's name.
- The server saves these images and updates a JSON file (`imageList.json`) with metadata such as filenames and labels.

### 5. Real-time Comparison
- The `FaceMatcher` continuously compares faces detected in the webcam feed with stored descriptors.
- Matching results are displayed on a canvas overlay, showing bounding boxes around faces and their corresponding labels.

## Installation and Setup

Follow these steps to get the project running:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Wilfred1097/face-recognition.git
   cd face-recognition
   ```

2. **Install dependencies**:
   Run the following command to install all required dependencies:
   ```bash
   npm install
   ```

3. **Start the server**:
   Launch the server with:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open your browser and visit `http://127.0.0.1:3000` to access the real-time face recognition interface.

## Additional Notes
- Ensure your webcam is connected and accessible to allow the application to perform real-time face detection.
- Uploaded images should be renamed to include the full name of the individual (e.g., `John_Doe.jpg`) before uploading.

## References
- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
