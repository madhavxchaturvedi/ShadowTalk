import User from '../models/User.js';

/**
 * Migration script to add shadowId to existing users
 * Run this once to update all existing users
 */

const generateShadowId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shadowId = 'Shadow';
  for (let i = 0; i < 6; i++) {
    shadowId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shadowId;
};

const migrateShadowIds = async () => {
  try {
    console.log('🔄 Starting ShadowID migration...');
    
    // Find all users without shadowId
    const users = await User.find({ shadowId: { $exists: false } });
    console.log(`Found ${users.length} users without ShadowID`);

    if (users.length === 0) {
      console.log('✅ No users to migrate');
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Generate unique shadowId
        let shadowId = generateShadowId();
        let attempts = 0;
        
        while (await User.findOne({ shadowId }) && attempts < 10) {
          shadowId = generateShadowId();
          attempts++;
        }

        // Update user
        user.shadowId = shadowId;
        await user.save();
        
        console.log(`✅ Migrated user ${user.anonymousId} -> ${shadowId}`);
        migrated++;
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.anonymousId}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('🎉 Migration complete!');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

export default migrateShadowIds;
