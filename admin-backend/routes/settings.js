// admin-backend/routes/settings.js
const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');
// const { protect, admin } = require('../middleware/authMiddleware'); // Optional: Protect these routes

// GET current application settings
// For simplicity, not protecting this route now, but you should in production
// router.get('/', protect, admin, async (req, res) => {
router.get('/', async (req, res) => {
    try {
        const settings = await AppSettings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// PUT (update) application settings
// router.put('/', protect, admin, async (req, res) => {
router.put('/', async (req, res) => {
    try {
        const {
            liveVideoStreamEnabled,
            noiseDetectionEnabled,
            userPhotoFeatureEnabled,
            periodicScreenshotsEnabled,
            screenshotIntervalSeconds,
        } = req.body;

        // Validate screenshotIntervalSeconds
        if (periodicScreenshotsEnabled && (screenshotIntervalSeconds === undefined || screenshotIntervalSeconds < 10)) {
            return res.status(400).json({ message: 'Screenshot interval must be at least 10 seconds when enabled.' });
        }


        const settings = await AppSettings.findOneAndUpdate(
            { identifier: 'global_settings' },
            {
                $set: { // Use $set to update only provided fields
                    liveVideoStreamEnabled,
                    noiseDetectionEnabled,
                    userPhotoFeatureEnabled,
                    periodicScreenshotsEnabled,
                    // Only update interval if screenshots are enabled and interval is provided
                    ...(periodicScreenshotsEnabled && screenshotIntervalSeconds !== undefined && { screenshotIntervalSeconds }),
                }
            },
            { new: true, upsert: true, runValidators: true } // upsert:true creates if not found
        );

        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

module.exports = router;
