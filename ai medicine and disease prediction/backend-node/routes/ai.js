const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// Proxy helper
const proxyRequest = async (method, url, data, res, headers = {}) => {
    try {
        const response = await axios({
            method,
            url: `${ML_SERVICE_URL}${url}`,
            data,
            headers
        });
        res.json(response.data);
    } catch (error) {
        console.error(`AI Service Error (${url}):`, error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'AI Service Unavailable' });
        }
    }
};

// Predict Disease
router.post('/predict', async (req, res) => {
    // Forward symptoms and user profile (if available)
    await proxyRequest('post', '/predict', req.body, res);
});

// Chat with AI
router.post('/chat', async (req, res) => {
    await proxyRequest('post', '/chat', req.body, res);
});

// OCR Prescription
router.post('/ocr', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, req.file.originalname);

        const response = await axios.post(`${ML_SERVICE_URL}/ocr`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('OCR Proxy Error:', error.message);
        res.status(500).json({ error: 'OCR Service Failed' });
    }
});

module.exports = router;
