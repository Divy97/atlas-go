const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cities-atlas';

// City schema (duplicate from model for script)
const CitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  stateId: { type: String },
  latitude: { type: Number, default: 0 }, // Changed: not required, default to 0
  longitude: { type: Number, default: 0 }, // Changed: not required, default to 0
  firstLetter: { type: String, required: true, index: true },
  lastLetter: { type: String, required: true },
}, {
  timestamps: false,
  versionKey: false
});

CitySchema.index({ firstLetter: 1 });
CitySchema.index({ country: 1 });
CitySchema.index({ name: 1 });
CitySchema.index({ displayName: 'text' });

const City = mongoose.model('City', CitySchema);

async function migrateCities() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read the base64 data from the cities-atlas-data.ts file
    const dataFilePath = path.join(__dirname, '../src/lib/cities-atlas-data.ts');
    console.log('📖 Reading cities data file...');
    
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    
    // Extract the base64 string (it's between quotes after the = sign)
    const base64Match = fileContent.match(/= '([^']+)'/);
    if (!base64Match) {
      throw new Error('Could not find base64 data in the file');
    }
    
    const base64Data = base64Match[1];
    console.log(`📊 Found base64 data (${base64Data.length} characters)`);
    
    // Decode base64 to JSON
    const jsonData = Buffer.from(base64Data, 'base64').toString('utf8');
    const cities = JSON.parse(jsonData);
    
    console.log(`🏙️  Parsed ${cities.length} cities`);
    
    // Clear existing data
    console.log('🗑️  Clearing existing cities...');
    await City.deleteMany({});
    
    // Filter out cities with missing required data and count issues
    let skippedCount = 0;
    let missingCoords = 0;
    
    const validCities = cities.filter(city => {
      // Check for required fields
      if (!city.id || !city.name || !city.displayName || !city.country || !city.firstLetter || !city.lastLetter) {
        skippedCount++;
        return false;
      }
      
      // Count cities with missing coordinates (we'll use defaults)
      if (city.latitude === null || city.longitude === null || 
          city.latitude === undefined || city.longitude === undefined) {
        missingCoords++;
      }
      
      return true;
    });
    
    console.log(`📊 Statistics:`);
    console.log(`   - Valid cities: ${validCities.length}`);
    console.log(`   - Skipped (missing required data): ${skippedCount}`);
    console.log(`   - Cities with missing coordinates: ${missingCoords} (will use defaults)`);
    
    // Insert cities in batches for better performance
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < validCities.length; i += batchSize) {
      const batch = validCities.slice(i, i + batchSize);
      
      // Transform the data to match our schema
      const transformedBatch = batch.map(city => ({
        id: city.id,
        name: city.name,
        displayName: city.displayName,
        country: city.country,
        countryCode: city.countryCode,
        stateId: city.stateId || undefined,
        latitude: (city.latitude !== null && city.latitude !== undefined) ? city.latitude : 0,
        longitude: (city.longitude !== null && city.longitude !== undefined) ? city.longitude : 0,
        firstLetter: city.firstLetter,
        lastLetter: city.lastLetter,
      }));
      
      try {
        await City.insertMany(transformedBatch);
        insertedCount += batch.length;
        console.log(`📝 Inserted ${insertedCount}/${validCities.length} cities`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, error.message);
        // Try inserting one by one to identify problematic records
        for (const cityData of transformedBatch) {
          try {
            await City.create(cityData);
            insertedCount++;
          } catch (singleError) {
            console.error(`❌ Failed to insert city ${cityData.id} (${cityData.displayName}):`, singleError.message);
            skippedCount++;
          }
        }
        console.log(`📝 Inserted ${insertedCount}/${validCities.length} cities (with error recovery)`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`🎉 Final statistics:`);
    console.log(`   - Total cities migrated: ${insertedCount}`);
    console.log(`   - Cities skipped: ${skippedCount}`);
    console.log(`   - Cities with default coordinates: ${missingCoords}`);
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await City.createIndexes();
    console.log('✅ Indexes created');
    
    // Verify data
    const totalInDB = await City.countDocuments();
    console.log(`🔍 Verification: ${totalInDB} cities in database`);
    
    // Show some sample data
    const sampleCities = await City.find().limit(3);
    console.log('📋 Sample cities:');
    sampleCities.forEach(city => {
      console.log(`   - ${city.displayName}, ${city.country} (${city.firstLetter}→${city.lastLetter})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateCities();
}

module.exports = migrateCities; 