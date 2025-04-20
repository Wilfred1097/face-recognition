const CACHE_NAME = 'face-api-cache-v1';
const MODEL_URLS = [
    './models/tiny_face_detector_model-shard1',
    './models/tiny_face_detector_model-weights_manifest.json',
    './models/face_landmark_68_tiny_model-shard1',
    './models/face_landmark_68_tiny_model-weights_manifest.json',
    './models/face_recognition_model-shard1',
    './models/face_recognition_model-weights_manifest.json',
    './models/ssd_mobilenetv1_model-shard1',
    './models/ssd_mobilenetv1_model-weights_manifest.json',
    './models/age_gender_model-shard1',
    './models/age_gender_model-weights_manifest.json'
];

// Install the service worker and cache the models
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching models...');
                return cache.addAll(MODEL_URLS);
            })
    );
});

// Fetch event to serve cached models
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If a cache match is found, return it, else fetch the request
                return response || fetch(event.request);
            })
    );
});

// Activate event to clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});