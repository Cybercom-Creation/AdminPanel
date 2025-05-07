// admin-backend/models/AppSettings.js
const mongoose = require('mongoose');

const AppSettingsSchema = new mongoose.Schema({
    // Use a unique key to ensure only one settings document, or manage settings per tenant/user if needed
    // For a global settings document, we can use a fixed identifier.
    identifier: {
        type: String,
        default: 'global_settings',
        unique: true,
        required: true,
    },
    liveVideoStreamEnabled: {
        type: Boolean,
        default: true,
    },
    noiseDetectionEnabled: {
        type: Boolean,
        default: true,
    },
    userPhotoFeatureEnabled: { // Renamed for clarity (e.g., could be capture or upload)
        type: Boolean,
        default: true,
    },
    periodicScreenshotsEnabled: {
        type: Boolean,
        default: false,
    },
    screenshotIntervalSeconds: {
        type: Number,
        default: 300, // Default to 5 minutes
        min: 10,      // Minimum interval (e.g., 10 seconds)
    },
}, { timestamps: true });

// Method to get or create settings
AppSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ identifier: 'global_settings' });
    if (!settings) {
        settings = await this.create({ identifier: 'global_settings' });
    }
    return settings;
};

const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);

module.exports = AppSettings;
