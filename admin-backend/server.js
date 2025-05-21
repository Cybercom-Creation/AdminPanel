// server.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose'); // Import Mongoose
const nodemailer = require('nodemailer');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings'); // Import settings routes
const { createObjectCsvStringifier } = require('csv-writer');
const archiver = require('archiver');

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors({
    origin: '*'
})); // Enable CORS
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
// Define College Schema
const CollegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true  
    },
    driveFolderId: { // ID of the Google Drive folder for this college
        type: String,
        sparse: true, // Optional: use if not all colleges will immediately have a Drive folder
    }
}, { timestamps: true });
const College = mongoose.model('College', CollegeSchema);

//  User Schema
const UserSchema = new mongoose.Schema({
    
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
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        
    },
}, { timestamps: true }); 

const User = mongoose.model('User', UserSchema); 

// Define ProctoringLog Schema
const ProctoringLogSchema = new mongoose.Schema({
    // _id is added automatically
    
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true 
    },
    triggerEvent: { 
        type: String,
        trim: true
    },
    startTime: { 
        type: Date
    },
    endTime: { 
        type: Date
    }
    
}, { timestamps: true });


const ProctoringLog = mongoose.model('ProctoringLog', ProctoringLogSchema);




// --- Nodemailer Setup (Email Transporter - unchanged) ---
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

//Function: Generate Combined Log CSV Data (MongoDB Version) ---
async function generateCombinedCsvData(collegeIdParam = null) {
    try {
        let userFilter = {};
         if (collegeIdParam) {
            userFilter.college = collegeIdParam; 
        }

        const relevantUsers = await User.find(userFilter).select('_id college').lean(); 
        const relevantUserIds = relevantUsers.map(u => u._id);

        if (collegeIdParam && relevantUserIds.length === 0) {
            console.log(`No users found for collegeId: ${collegeIdParam}. Returning empty CSV data for combined logs.`);
            return null; 
        }

        // 1. Calculate total number of alerts for each user
        console.log("Calculating total alerts per user...");
        const userAlertCountsAgg = await ProctoringLog.aggregate([
            {
                $group: {
                    _id: "$userId", // Group by the user ID
                    totalAlerts: { $sum: 1 } 
                }
            }
        ]);

        const alertCountsMap = new Map();
        userAlertCountsAgg.forEach(item => {
            if (item._id) { // Ensure _id is not null
                alertCountsMap.set(item._id.toString(), item.totalAlerts);
            }
        });
        console.log(`Calculated alert counts for ${alertCountsMap.size} users.`);



        console.log("Fetching proctoring logs and populating user data...");

        const logQuery = {};
        if (collegeIdParam) { 
            logQuery.userId = { $in: relevantUserIds };
        }

        const logs = await ProctoringLog.find(logQuery)
            .populate({
                path: 'userId', 
                select: 'name email phone college', 
                populate: { path: 'college', select: 'name' } 
            })
            .sort({ userId: 1, createdAt: 1 }) 
            .lean(); 

        
        const logsWithUserData = logs.filter(log => log.userId && typeof log.userId === 'object' && log.userId.college); 
        console.log(`${logsWithUserData.length} logs successfully populated with user data.`);
         if (logs.length > 0 && (logsWithUserData.length < logs.length || logs.some(log => log.userId && !log.userId.college))) {
             console.warn(`Warning: ${logs.length - logsWithUserData.length} logs could not be linked to existing users. Check 'userId' field references in 'proctoringlogs' collection.`);
             
        }


        if (!logs || logs.length === 0) {
            console.log("No proctoring logs found in the database.");
            return null;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                // Use the populated user data fields
                { id: 'user_id', title: 'UserID' },         
                { id: 'user_name', title: 'Name' },         
                { id: 'user_email', title: 'Email' },       
                { id: 'user_phone', title: 'Phone' },       
                { id: 'college_name', title: 'CollegeName' },
                // Use the proctoring log's own fields
                { id: 'log_id', title: 'LogID' },          
                { id: 'trigger_event', title: 'TriggerEvent' }, 
                { id: 'start_time', title: 'StartTime' },   
                { id: 'end_time', title: 'EndTime' },       
                { id: 'total_user_alerts', title: 'TotalUserAlerts' }, 
                
                
            ]
        });

        // Process rows for CSV structure
        const processedRows = logs.map(log => {
            
            const populatedUser = log.userId; 
            const userIdStr = populatedUser?._id?.toString();
            const numberOfAlertsForUser = userIdStr ? (alertCountsMap.get(userIdStr) || 0) : 0;


            return {
                // Use data from the populated user object, providing defaults if population failed
                user_id: populatedUser?._id?.toString() || 'N/A',
                user_name: populatedUser?.name || 'N/A',
                user_email: populatedUser?.email || 'N/A',
                user_phone: populatedUser?.phone || '', 
                college_name: populatedUser?.college?.name || 'N/A', 
                
                // Use data directly from the proctoring log object
                log_id: log._id.toString(), 
                trigger_event: log.triggerEvent || '', 
                start_time: log.startTime instanceof Date ? log.startTime.toISOString() : '', 
                end_time: log.endTime instanceof Date ? log.endTime.toISOString() : '', 
                total_user_alerts: numberOfAlertsForUser,
                
            };
        });

         
        if (processedRows.length > 0) {
            console.log("Sample of processed rows for CSV (first 3):", JSON.stringify(processedRows.slice(0, 3), null, 2));
        }

        
        const headerString = csvStringifier.getHeaderString();
        const recordsString = csvStringifier.stringifyRecords(processedRows);
        console.log("Generated CSV Header String for combined_logs:", headerString); // Log the generated header
        return headerString + recordsString;

    } catch (error) {
        console.error("Error generating combined CSV data:", error);
        throw error; 
    }
}

//Function: Generate User Details CSV DatahotoDriveLin  ---
async function generateUserCsvData(collegeIdParam = null) {
    try {
        const userQuery = {};
        if (collegeIdParam) {
            userQuery.college = collegeIdParam;
        }

        
        const users = await User.find(userQuery)
            .populate('college', 'name') 
            .select('name email phone photoDriveLink college') 
            .sort({ createdAt: 1 }) 
            .lean();

        if (!users || users.length === 0) return null;

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'user_id', title: 'UserID' }, 
                { id: 'user_name', title: 'Name' },
                { id: 'user_email', title: 'Email' },
                { id: 'user_phone', title: 'Phone' },
                { id: 'college_name', title: 'CollegeName' }, 
                
                { id: 'photo_link', title: 'PhotoLink' }
            ]
        });

        // Process rows: use photoDriveLink directly
        const processedRows = users.map(user => {
            
            const photoLink = user.photoDriveLink || '';

            return {
                user_id: user._id,
                user_name: user.name,
                user_email: user.email,
                user_phone: user.phone || '', 
                college_name: user.college?.name || 'N/A', 
                photo_link: photoLink 
            };
        });

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(processedRows);

    } catch (error) {
        console.error("Error generating user CSV data:", error);
        throw error;
    }
}


// --- API Endpoints ---
// --- Routes ---
app.use('/auth', authRoutes); // Mount authentication routes
app.use('/settings', settingsRoutes); // Mount settings routes

// Basic route
app.get('/', (req, res) => {
    res.send('Admin Panel Backend (MongoDB) is running!');
});

// --- NEW Endpoint to get all colleges for the dropdown ---

app.get('/api/colleges', async (req, res) => {
    try {
        const colleges = await College.find({}).sort({ name: 1 }).lean();
        
        res.status(200).json(colleges.map(c => ({ id: c._id.toString(), name: c.name })));
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ message: 'Failed to fetch colleges', error: error.message });
    }
});

// --- NEW Endpoint to get users for the Admin Panel Table ---
app.get('/admin/users', async (req, res) => {
    const { collegeId } = req.query;
    console.log(`GET /admin/users request received. CollegeId: ${collegeId}`);

    try {
        const userQuery = {};
        if (collegeId) userQuery.college = collegeId; 
        const users = await User.find(userQuery)
            .select('_id name email phone photoBase64 photoDriveLink testDurationMs driveFolderLink testStartTime testEndTime college') 

        if (!users || users.length === 0) {
            console.log("No users found in the database.");
            
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
                            
                            duration: { $ifNull: ['$durationMs', 0] },// Use durationMs, default to 0 if null/missing
                            startTime: '$startTime' 
                            
                        }
                    },
                    
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
                    _id: 1, 
                    violations: '$violationCounts',
                    violationDetails: '$violationDetailsList', 
                    
                }
            }
        ]);


        // 4. Create a map for easy lookup of violation stats by userId
        const statsMap = new Map();
        violationStats.forEach(stat => {
            statsMap.set(stat._id.toString(), {
                violations: stat.violations || {}, 
                violationDetails: stat.violationDetails || [], 
                totalViolations: Object.values(stat.violations || {}).reduce((sum, count) => sum + count, 0),
                
            });
        });

        // 5. Combine user data with their violation stats
        const usersWithData = users.map(user => {
            const userIdStr = user._id.toString();
            const userEmail = user.email;
            const userStats = statsMap.get(userIdStr) || { violations: {}, violationDetails: [], totalViolations: 0 }; // Default if no logs found

            // Determine the picture URLs - use photoDriveLink if available, otherwise default
            const defaultAvatar = '/default-avatar.png'; // Ensure this exists in admin-frontend/public/
            let imageUrl = defaultAvatar;

            imageUrl = user.photoBase64; 

            // *** Refined Test Duration Handling ***
        let numericTestDuration = 0; 
        if (user.testDurationMs !== null && user.testDurationMs !== undefined) {
            // Attempt to convert the value from the DB to a number
            const parsedDuration = Number(user.testDurationMs);
            // Check if conversion was successful and the number is valid (non-negative)
            if (!isNaN(parsedDuration) && parsedDuration >= 0) {
                numericTestDuration = parsedDuration;
            } else {
                
                console.warn(`User ${userIdStr}: Invalid testDurationMs value found: ${user.testDurationMs}`);
            }
        }
        const finalTestDuration = numericTestDuration; 

            // *** Refined Violation Details Handling ***
    const finalViolationDetails = (userStats.violationDetails || []).map((detail, index) => {
        let numericViolationDuration = 0; // Start with a default valid number
        
        if (detail.duration !== null && detail.duration !== undefined) {
           
            const parsedViolationDuration = Number(detail.duration);
           
            if (!isNaN(parsedViolationDuration) && parsedViolationDuration >= 0) {
                numericViolationDuration = parsedViolationDuration;
            } else {
                
                console.warn(`User ${userIdStr}, Violation Index ${index}: Invalid duration value found: ${detail.duration}`);
            }
        }
        return {
            type: detail.type || 'Unknown',
            duration: numericViolationDuration, 
            startTime: detail.startTime

        };
    });
    
            return {
                // Fields expected by the frontend (UserRow.jsx)
                id: userEmail,
                name: user.name || 'Unknown User',
                smallPicUrl: imageUrl,
                largePicUrl: imageUrl,
                testStartTime: user.testStartTime,
                testEndTime: user.testEndTime,
                testDuration: finalTestDuration,
                violations: userStats.violations, 
                violationDetails: finalViolationDetails, 
                driveFolderLink: user.driveFolderLink || null,
                totalViolations: userStats.totalViolations 
            };
        });

        console.log(`Sending ${usersWithData.length} user records to the frontend.`);
       
        res.status(200).json(usersWithData);

    } catch (error) {
        console.error('Error fetching users for admin panel:', error);
        res.status(500).json({ message: 'Failed to fetch user data.', error: error.message });
    }
});


// --- Export Route (now POST) ---
app.post('/export', async (req, res) => {
    console.log("POST /export request received.");
    const { email: recipientEmail, collegeId } = req.body; 

    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: 'Recipient email address is required.' });
    }
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    console.log(`Export request received for email: ${recipientEmail}, CollegeId: ${collegeId}`);

    try {
        // Generate CSV data using MongoDB helper functions
        const combinedCsvData = await generateCombinedCsvData(collegeId); 
        const userCsvData = await generateUserCsvData(collegeId); 
        if (!combinedCsvData && !userCsvData) {
            console.log('No data found to export.');
            return res.status(404).json({ success: false, message: 'No data found to export.' });
        }

        const attachments = [];
        const timestamp = new Date(Date.now()).toLocaleString("en-IN", {

            timeZone: "Asia/Kolkata",
          
            hour12: true, 
          
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
            
             return res.status(404).json({ success: false, message: 'No data available to generate export files.' });
           
        }

        // Send Email
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

// --- Download Route ---
app.get('/download', async (req, res) => {
    const { collegeId } = req.query; 
    console.log(`GET /download request received. CollegeId: ${collegeId}`);

    try {
       
        const combinedCsvData = await generateCombinedCsvData(collegeId);
        const userCsvData = await generateUserCsvData(collegeId);

        if (!combinedCsvData && !userCsvData) {
            console.log('No data found to download.');
            return res.status(404).send('No data available to download.');
        }

        // Set headers for zip file download
        const timestamp = Date.now();
        const zipFilename = `admin_export_${timestamp}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

        
        const archive = archiver('zip', { zlib: { level: 9 } });

       
        archive.on('warning', function(err) {
          if (err.code === 'ENOENT') {
            console.warn('Archiver warning:', err); 
          } else {
            console.error('Archiver warning:', err);
            
          }
        });
        archive.on('error', function(err) {
            console.error("Archiving error:", err);
            
            if (!res.headersSent) {
                res.status(500).send({ error: 'Failed to create the zip archive.' });
            } else {
                res.end(); 
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

// --- Global Error Handlers  ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  process.exit(1); 
});

// Graceful shutdown on signals like SIGTERM/SIGINT
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing server and database connection...`);
    
    server.close(async () => { 
        console.log('HTTP server closed.');
        // Close MongoDB connection
        await mongoose.connection.close(false); 
        console.log('MongoDB connection closed.');
        process.exit(0); 
    });

    // Force close after a timeout if graceful shutdown fails
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds timeout
};


