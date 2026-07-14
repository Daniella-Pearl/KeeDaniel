require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in your .env file!');
        }
        if (!adminEmail || !adminPassword) {
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your .env file!');
        }

        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        
        // Print database name to confirm we are in 'DeeNoop'
        console.log(`✅ Connected to DB: "${mongoose.connection.name}"`);

        // Force lowercase email to avoid casing mismatch checks
        const targetEmail = adminEmail.toLowerCase();

        // 1. Check if user already exists
        const existingAdmin = await User.findOne({ email: targetEmail });
        if (existingAdmin) {
            console.log(`⚠️ Admin with email "${targetEmail}" already exists. Seeding skipped.`);
            await mongoose.connection.close();
            process.exit(0);
        }

        // 2. Create the Admin user
        console.log('🔒 Registering admin user...');
        const adminUser = new User({
            email: targetEmail,
            password: adminPassword,
            magazineName: 'System Admin Magazine',
            isActive: true
        });

        // 3. Save to database
        const savedUser = await adminUser.save();
        console.log(`💾 Saved Document ID: ${savedUser._id}`);

        // 4. ABSOLUTE VERIFICATION STEP
        // Let's directly search the database right now to verify it's physically there!
        console.log('🔍 Running live verification check...');
        const verifyUser = await User.findOne({ email: targetEmail });
        
        if (verifyUser) {
            console.log('🎉 VERIFIED! Admin is safely stored in the database.');
            console.log(`   Collection Name: "${User.collection.name}"`);
            console.log(`   Registered Email: ${verifyUser.email}`);
        } else {
            console.log('❌ CRITICAL ERROR: The save returned success, but the database is empty!');
        }

        // Close connection cleanly before exiting
        await mongoose.connection.close();
        console.log('🔌 Database connection closed cleanly.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        try { await mongoose.connection.close(); } catch(e) {}
        process.exit(1);
    }
};

seedAdmin();