// server.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose'); // Import Mongoose
const nodemailer = require('nodemailer');
const cors = require('cors');

const { createObjectCsvStringifier } = require('csv-writer');
const archiver = require('archiver');

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware to parse JSON request bodies

// --- MongoDB Connection Setup ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Options are generally handled well by default in newer Mongoose versions
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

connectDB(); // Connect to the database when the app starts

// --- Mongoose Schemas ---
// Define User Schema
const UserSchema = new mongoose.Schema({
    // Assuming user_id from MySQL becomes the default _id or a custom field if needed
    // If you need to keep the old numeric user_id, add:
    // mysql_user_id: { type: Number, unique: true, sparse: true }, // If migrating old IDs
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: {
        type: String,
        trim: true
    },
    photoBase64: { // Store as string if it's already base64 encoded
        type: String
    },
    photoDriveLink: { type: String },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const User = mongoose.model('User', UserSchema); // Model name 'User' -> collection 'users'

// Define ProctoringLog Schema
const ProctoringLogSchema = new mongoose.Schema({
    // _id is added automatically
    // IMPORTANT: Ensure this field name 'userId' matches what's in your DB
    // If your actual field name is 'user', change it here or in the populate call.
    userId: { // Reference to the User document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the 'User' model
        required: true // Make sure every log MUST have a user reference
    },
    triggerEvent: { // Renamed from trigger_event to match your description
        type: String,
        trim: true
    },
    startTime: { // Renamed from warning_start_time
        type: Date
    },
    endTime: { // Renamed from warning_end_time
        type: Date
    }
    // interval_seconds: { type: Number } // Keep or remove based on your actual schema
}, { timestamps: true });

// Ensure the model name 'ProctoringLog' maps to your collection name 'proctoringlogs'
// Mongoose usually pluralizes automatically, but double-check if needed.
const ProctoringLog = mongoose.model('ProctoringLog', ProctoringLogSchema);


// --- Nodemailer Setup (Email Transporter - unchanged) ---
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Helper Function: Generate Combined Log CSV Data (MongoDB Version) ---
async function generateCombinedCsvData() {
    try {
        console.log("Fetching proctoring logs and populating user data...");

        // *** CRITICAL STEP: Populate based on the correct field name ***
        // If your field in ProctoringLogSchema is 'userId', use 'userId'.
        // If it's 'user' (like in the original code), use 'user'.
        const logs = await ProctoringLog.find({})
            .populate('userId', 'name email phone') // Populate using the 'userId' field, selecting specific user fields
            .sort({ userId: 1, createdAt: 1 }) // Sort by user ID, then log creation time
            .lean(); // Use .lean() for plain JS objects

        console.log(`Fetched ${logs.length} logs.`);

        // Debugging: Check if population worked
        const logsWithUserData = logs.filter(log => log.userId && typeof log.userId === 'object'); // Check if userId was populated (became an object)
        console.log(`${logsWithUserData.length} logs successfully populated with user data.`);
        if (logs.length > 0 && logsWithUserData.length < logs.length) {
             console.warn(`Warning: ${logs.length - logsWithUserData.length} logs could not be linked to existing users. Check 'userId' field references in 'proctoringlogs' collection.`);
             // Log a few examples of failed populations if needed:
             // console.log("Examples of logs that failed population:", logs.filter(log => !log.userId || typeof log.userId !== 'object').slice(0, 5));
        }


        if (!logs || logs.length === 0) {
            console.log("No proctoring logs found in the database.");
            return null;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                // Use the populated user data fields
                { id: 'user_id', title: 'UserID' },         // From populated log.userId._id
                { id: 'user_name', title: 'Name' },         // From populated log.userId.name
                { id: 'user_email', title: 'Email' },       // From populated log.userId.email
                { id: 'user_phone', title: 'Phone' },       // From populated log.userId.phone
                // Use the log's own fields
                { id: 'log_id', title: 'LogID' },           // From log._id
                { id: 'trigger_event', title: 'TriggerEvent' }, // From log.triggerEvent
                { id: 'start_time', title: 'StartTime' },   // From log.startTime
                { id: 'end_time', title: 'EndTime' }        // From log.endTime
                // { id: 'interval_seconds', title: 'IntervalSeconds' } // Add back if needed
            ]
        });

        // Process rows for CSV structure
        const processedRows = logs.map(log => {
            // Access populated user data via log.userId (or log.user if that's the field name)
            const populatedUser = log.userId; // Assuming the field name used in populate was 'userId'

            return {
                // Use data from the populated user object, providing defaults if population failed
                user_id: populatedUser?._id?.toString() || 'N/A',
                user_name: populatedUser?.name || 'N/A',
                user_email: populatedUser?.email || 'N/A',
                user_phone: populatedUser?.phone || '', // Default to empty string for phone

                // Use data directly from the log object
                log_id: log._id.toString(), // Convert ObjectId to string
                trigger_event: log.triggerEvent || '', // Use correct field name
                start_time: log.startTime instanceof Date ? log.startTime.toISOString() : '', // Use correct field name
                end_time: log.endTime instanceof Date ? log.endTime.toISOString() : '', // Use correct field name
                // interval_seconds: log.interval_seconds ?? '' // Add back if needed
            };
        });

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(processedRows);

    } catch (error) {
        console.error("Error generating combined CSV data:", error);
        throw error; // Re-throw to be caught by the route handler
    }
}

// --- Helper Function: Generate User Details CSV Data (MongoDB Version - Using photoDriveLink) ---
async function generateUserCsvData() {
    try {
        // Fetch all users, selecting necessary fields including photoDriveLink
        // We no longer need photo_base64 for this specific CSV export
        const users = await User.find({})
            .select('name email phone photoDriveLink') // Select photoDriveLink instead of photo_base64
            .sort({ createdAt: 1 }) // Or sort by name, email, etc.
            .lean();

        if (!users || users.length === 0) return null;

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'user_id', title: 'UserID' }, // Use user._id
                { id: 'user_name', title: 'Name' },
                { id: 'user_email', title: 'Email' },
                { id: 'user_phone', title: 'Phone' },
                // Header remains the same, but the content will be the Drive link
                { id: 'photo_link', title: 'PhotoLink' }
            ]
        });

        // Process rows: use photoDriveLink directly
        const processedRows = users.map(user => {
            // Use the photoDriveLink directly. Provide an empty string if it's missing.
            const photoLink = user.photoDriveLink || '';

            return {
                user_id: user._id,
                user_name: user.name,
                user_email: user.email,
                user_phone: user.phone || '', // Handle potentially missing phone
                photo_link: photoLink // Use the Google Drive link here
            };
        });

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(processedRows);

    } catch (error) {
        console.error("Error generating user CSV data:", error);
        throw error; // Re-throw
    }
}


// --- API Endpoints ---

// Basic route
app.get('/', (req, res) => {
    res.send('Admin Panel Backend (MongoDB) is running!');
});

// --- NEW Endpoint to get users for the Admin Panel Table ---
app.get('/api/admin/users', async (req, res) => {
    console.log("GET /api/admin/users request received.");
    
    try {
        // 1. Fetch all users - select necessary fields
        // Include testDuration and screenshotFolderUrl if they are stored on the User model
        const users = await User.find({})
            .select('_id name email phone photoBase64 photoDriveLink testDurationMs')
            .lean(); // Use lean for better performance

        if (!users || users.length === 0) {
            console.log("No users found in the database.");
            // Send empty array for frontend to handle gracefully
            return res.status(200).json([]);
        }

        // 2. Get all user IDs for the next query
        const userIds = users.map(user => user._id);

        // 3. Aggregate violation counts and details from ProctoringLog for these users
        const violationStats = await ProctoringLog.aggregate([
            {
                $match: { userId: { $in: userIds } } // Filter logs for the fetched users
            },
            {
                $sort: { createdAt: 1 } // Sort logs by time before grouping if needed for details order
            },
            {
                $group: {
                    _id: '$userId', // Group by user ID
                    violationsList: { // Collect all trigger events for the user
                        $push: '$triggerEvent'
                    },
                    violationDetailsList: { // Collect details for the expandable panel
                        $push: {
                            type: '$triggerEvent',
                            //timestamp: '$createdAt',
                            duration: { $ifNull: ['$durationMs', 0] } // Use durationMs, default to 0 if null/missing
                            //details: '$details' // Include the details field from the log schema
                            // Add other log details you want to show
                        }
                    },
                    // Example: Calculate duration from logs if not stored on User
                    // firstLogTime: { $min: '$createdAt' },
                    // lastLogTime: { $max: '$createdAt' }
                }
            },
            {
                // Calculate violation counts from the collected list
                $addFields: {
                    violationCounts: {
                        $reduce: {
                            input: '$violationsList',
                            initialValue: {},
                            in: {
                                $let: {
                                    vars: { currentType: '$$this' ,
                                        currentCount: {
                                            $ifNull: [
                                                // Use $getField to access a field using a variable name
                                                { $getField: { field: '$$this', input: '$$value' } },
                                                0 // Default to 0 if the field doesn't exist yet
                                            ]
                                        }

                                    },
                                    in: {
                                        $mergeObjects: [
                                            '$$value',

                                            {
                                                $arrayToObject: [[
                                                    {
                                                        k: '$$currentType', // The key is the violation type string
                                                        v: { $add: ['$$currentCount', 1] } // The value is the incremented count
                                                    }
                                                ]]
                                            }

                                            // { // Dynamically create/update key for the violation type
                                            //   [ '$$currentType' ] : { $add: [ { $ifNull: [ `$$value.$$currentType`, 0 ] }, 1 ] }
                                            // }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
             {
                // Project final fields for clarity and remove intermediate lists
                $project: {
                    _id: 1, // Keep the userId (_id)
                    violations: '$violationCounts', // Rename violationCounts to violations
                    violationDetails: '$violationDetailsList', // Rename violationDetailsList
                    // duration: { $divide: [ { $subtract: ['$lastLogTime', '$firstLogTime'] }, 1000 ] } // Calculate duration in seconds if needed
                }
            }
        ]);


        // 4. Create a map for easy lookup of violation stats by userId
        const statsMap = new Map();
        violationStats.forEach(stat => {
            statsMap.set(stat._id.toString(), {
                violations: stat.violations || {}, // The calculated counts object { typeA: 2, typeB: 1 }
                violationDetails: stat.violationDetails || [], // Array of details [{ type: ..., timestamp: ...}]
                totalViolations: Object.values(stat.violations || {}).reduce((sum, count) => sum + count, 0),
                // calculatedDuration: stat.duration // Use calculated duration if applicable
            });
        });

        // 5. Combine user data with their violation stats
        const usersWithData = users.map(user => {
            const userIdStr = user._id.toString();
            const userStats = statsMap.get(userIdStr) || { violations: {}, violationDetails: [], totalViolations: 0 }; // Default if no logs found

            // Determine the picture URLs - use photoDriveLink if available, otherwise default
            const defaultAvatar = '/default-avatar.png'; // Ensure this exists in admin-frontend/public/
            let imageUrl = defaultAvatar;

            imageUrl = user.photoBase64; 

            // *** Refined Test Duration Handling ***
    let numericTestDuration = 0; // Start with a default valid number
    if (user.testDurationMs !== null && user.testDurationMs !== undefined) {
        // Attempt to convert the value from the DB to a number
        const parsedDuration = Number(user.testDurationMs);
        // Check if conversion was successful and the number is valid (non-negative)
        if (!isNaN(parsedDuration) && parsedDuration >= 0) {
            numericTestDuration = parsedDuration;
        } else {
             // Optional: Log if parsing failed for debugging
             console.warn(`User ${userIdStr}: Invalid testDurationMs value found: ${user.testDurationMs}`);
        }
    }
    const finalTestDuration = numericTestDuration; // Use the validated number


            // *** Refined Violation Details Handling ***
    const finalViolationDetails = (userStats.violationDetails || []).map((detail, index) => {
        let numericViolationDuration = 0; // Start with a default valid number
        // The 'duration' field comes from the aggregation's $ifNull check
        if (detail.duration !== null && detail.duration !== undefined) {
            // Attempt conversion (might already be a number from aggregation, but good practice)
            const parsedViolationDuration = Number(detail.duration);
             // Check if conversion was successful and the number is valid (non-negative)
            if (!isNaN(parsedViolationDuration) && parsedViolationDuration >= 0) {
                numericViolationDuration = parsedViolationDuration;
            } else {
                
                console.warn(`User ${userIdStr}, Violation Index ${index}: Invalid duration value found: ${detail.duration}`);
            }
        }
        return {
            type: detail.type || 'Unknown',
            duration: numericViolationDuration // Use the validated number
        };
    });
    console.log(`User ${userIdStr} (${user.name}) - Sending: testDuration=${finalTestDuration}, violationDetails=${JSON.stringify(finalViolationDetails)}`);
            return {
                // Fields expected by the frontend (UserRow.jsx)
                id: userIdStr,
                name: user.name || 'Unknown User',
                smallPicUrl: imageUrl,
                largePicUrl: imageUrl,
                testDuration: finalTestDuration,
                violations: userStats.violations, // e.g., { faceMismatch: 2, phoneDetected: 1 }
                violationDetails: finalViolationDetails, // e.g., [{ type: '...', timestamp: '...', details: '...' }]
                screenshotFolderUrl: user.photoDriveLink || null, // Use value from User model or null
                totalViolations: userStats.totalViolations // Calculated total for sorting
            };
        });

        console.log(`Sending ${usersWithData.length} user records to the frontend.`);
        console.log(`Sending ${users.photoBase64} user records to the frontend.`);
        res.status(200).json(usersWithData);

    } catch (error) {
        console.error('Error fetching users for admin panel:', error);
        res.status(500).json({ message: 'Failed to fetch user data.', error: error.message });
    }
});


// --- MODIFIED Export Route (now POST) ---
app.post('/export', async (req, res) => {
    const recipientEmail = req.body.email;

    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: 'Recipient email address is required.' });
    }
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    console.log(`Export request received for email: ${recipientEmail}`);

    try {
        // Generate CSV data using MongoDB helper functions
        const combinedCsvData = await generateCombinedCsvData();
        const userCsvData = await generateUserCsvData();

        if (!combinedCsvData && !userCsvData) {
            console.log('No data found to export.');
            return res.status(404).json({ success: false, message: 'No data found to export.' });
        }

        const attachments = [];
        const timestamp = new Date(Date.now()).toLocaleString("en-IN", {

            timeZone: "Asia/Kolkata",
          
            hour12: true, // optional: for AM/PM format
          
          });
           
        if (combinedCsvData) {
            attachments.push({
                filename: `combined_logs_${timestamp}.csv`,
                content: combinedCsvData,
                contentType: 'text/csv'
            });
        }
        if (userCsvData) {
            attachments.push({
                filename: `user_details_${timestamp}.csv`,
                content: userCsvData,
                contentType: 'text/csv'
            });
        }

        if (attachments.length === 0) {
            console.log('No CSV data generated (potentially empty results).');
            // Decide if this is an error or just an empty export
             return res.status(404).json({ success: false, message: 'No data available to generate export files.' });
           // return res.status(500).json({ success: false, message: 'Failed to generate CSV data.' });
        }

        // Send Email (logic remains the same)
        const mailOptions = {
            from: `"Admin Panel Export" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `Admin Panel Data Export - ${new Date().toISOString()}`,
            text: 'Please find the attached CSV files containing the exported data.',
            attachments: attachments
        };

        console.log(`Sending email to ${recipientEmail}...`);
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');

        res.status(200).json({ success: true, message: `Export email sent successfully to ${recipientEmail}.` });

    } catch (error) {
        console.error('Error during export process:', error);
        // Check for Mongoose specific errors if needed (e.g., CastError for bad ObjectIds)
        if (error instanceof mongoose.Error.CastError) {
             return res.status(400).json({ success: false, message: 'Invalid data format encountered.' });
        }
        // Check for Nodemailer errors
        if (error.responseCode === 535) {
             return res.status(500).json({ success: false, message: 'Email authentication failed. Check EMAIL_USER and EMAIL_PASS.' });
        }
        res.status(500).json({ success: false, message: 'An error occurred during the export process.' });
    }
});

// --- NEW Download Route ---
app.get('/download', async (req, res) => {
    console.log('Download request received.');
    try {
        // Generate CSV data using MongoDB helper functions
        const combinedCsvData = await generateCombinedCsvData();
        const userCsvData = await generateUserCsvData();

        if (!combinedCsvData && !userCsvData) {
            console.log('No data found to download.');
            return res.status(404).send('No data available to download.');
        }

        // Set headers for zip file download
        const timestamp = Date.now();
        const zipFilename = `admin_export_${timestamp}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

        // Create a zip archive
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Handle archiving errors robustly
        archive.on('warning', function(err) {
          if (err.code === 'ENOENT') {
            console.warn('Archiver warning:', err); // Log file not found warnings
          } else {
            console.error('Archiver warning:', err); // Log other warnings as errors
            // Decide if you need to abort response generation
          }
        });
        archive.on('error', function(err) {
            console.error("Archiving error:", err);
            // Try to inform the client if headers not sent, otherwise just end.
            if (!res.headersSent) {
                res.status(500).send({ error: 'Failed to create the zip archive.' });
            } else {
                res.end(); // End the stream abruptly if possible
            }
        });

        // Pipe the archive data to the response
        archive.pipe(res);

        // Append CSV files to the archive
        if (combinedCsvData) {
            archive.append(combinedCsvData, { name: `combined_logs_${timestamp}.csv` });
        }
        if (userCsvData) {
            archive.append(userCsvData, { name: `user_details_${timestamp}.csv` });
        }

        // Finalize the archive (triggers sending the response)
        await archive.finalize();
        console.log(`Zip file ${zipFilename} generated and sent for download.`);

    } catch (error) {
        console.error('Error during download process:', error);
        if (!res.headersSent) {
            res.status(500).send('An error occurred while generating the download file.');
        } else {
            res.end();
        }
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// --- Global Error Handlers (Good Practice) ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider more robust logging/alerting here
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Perform cleanup if necessary
  process.exit(1); // Exit after uncaught exception is generally recommended
});

// Graceful shutdown on signals like SIGTERM/SIGINT
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing server and database connection...`);
    // Close server to stop accepting new connections
    server.close(async () => { // Assuming you store app.listen result in 'server'
        console.log('HTTP server closed.');
        // Close MongoDB connection
        await mongoose.connection.close(false); // false = don't force close immediately
        console.log('MongoDB connection closed.');
        process.exit(0); // Exit cleanly
    });

    // Force close after a timeout if graceful shutdown fails
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds timeout
};

// You need to store the server instance:
// const server = app.listen(...) instead of just app.listen(...)
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Catches Ctrl+C

// **Note:** Graceful shutdown implementation requires storing the server instance
// returned by app.listen() and uncommenting the process.on listeners.
// For simplicity in this refactor, it's commented out but highly recommended for production.
