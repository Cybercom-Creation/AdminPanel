
require('dotenv').config({ path: '../.env' }); // Adjust path if needed
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser'); // Adjust path

const seedAdmin = async () => {
  //await mongoose.connect('mongodb+srv://Keyur:Keyur%40cybercom@webappcluster.p5rm4nb.mongodb.net/?retryWrites=true&w=majority&appName=WebappCluster');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected for seeding.');

  try {
    // Optional: Delete a specific user before seeding if needed
    // const emailToDelete = 'admin@example.com'; // Specify the email of the user to delete
    // const deletedUser = await AdminUser.findOneAndDelete({ email: emailToDelete });
    // if (deletedUser) {
    //   console.log(`Successfully deleted user with email: ${emailToDelete}`);
    // } else {
    //   console.log(`User with email ${emailToDelete} not found for deletion.`);
    // }

    // console.log('--- Starting to seed users ---');

    const usersToSeed = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin@1234', // Use strong, unique passwords
        is_active: true,
      },
      {
        username: 'devansh',
        email: 'devansh@cybercomcreation.com',
        password: 'Devansh@123', // Use strong, unique passwords
        is_active: true,
      },
      {
        username: 'keyur',
        email: 'keyur@cybercomcreation.com',
        password: 'Keyur@456', // Use strong, unique passwords
        is_active: true,
      },
      // Add more user objects here as needed
      // {
      //   username: 'anotheruser',
      //   email: 'another@example.com',
      //   password: 'AnotherSecurePassword1!',
      //   is_active: false, // Example of an inactive user
      // },
    ];

    for (const userData of usersToSeed) {
      // Check if user exists by email OR username to prevent duplicates
      const existingUser = await AdminUser.findOne({ $or: [{ email: userData.email }, { username: userData.username }] });
      if (existingUser) {
        console.log(`Admin user with email ${userData.email} or username ${userData.username} already exists.`);
      } else {
        const newUser = new AdminUser(userData);
        await newUser.save(); // The 'pre save' hook will hash the password
        console.log(`Admin user ${userData.email} (username: ${userData.username}) created successfully!`);
      }
    }  
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedAdmin();
