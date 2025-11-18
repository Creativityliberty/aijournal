import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('691a6f970027876be2db')
  .setKey('standard_4f2e9a05cf9a3751168b1c39052133f49dc5369ee4659e50bc9003c8b874467f3554111cc2c4d31011c545226f2cd909f385fd63e6430a24ada89d2c8b4f3ae12e6d63585b67c6bba7a78a9481a3d9ddbe60f42d1bcf51b4a092bb227ac602db8060bd84c9a899be529d60c1e5f2710854a2cad9cae90fd16c4c549ebdd6b281');

const databases = new Databases(client);

const DATABASE_ID = '691a7b05002d9a035b39';
const ITEMS_COLLECTION_ID = 'canvas_items';

async function addMissingAttributes() {
  try {
    console.log('🔧 Adding missing attributes to canvas_items collection...\n');

    // Add positionX (optional with default)
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        'positionX',
        false, // not required
        0, // min
        10000, // max
        0 // default
      );
      console.log('✅ Added positionX attribute');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  positionX already exists');
      } else {
        throw e;
      }
    }

    // Add positionY (optional with default)
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        'positionY',
        false,
        0,
        10000,
        0
      );
      console.log('✅ Added positionY attribute');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  positionY already exists');
      } else {
        throw e;
      }
    }

    // Add width (optional with default)
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        'width',
        false,
        0,
        10000,
        300
      );
      console.log('✅ Added width attribute');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  width already exists');
      } else {
        throw e;
      }
    }

    // Add height (optional with default)
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        'height',
        false,
        0,
        10000,
        300
      );
      console.log('✅ Added height attribute');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  height already exists');
      } else {
        throw e;
      }
    }

    // Add zIndex (optional with default)
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        'zIndex',
        false,
        0,
        1000,
        0
      );
      console.log('✅ Added zIndex attribute');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  zIndex already exists');
      } else {
        throw e;
      }
    }

    console.log('\n✅ All attributes added successfully!');
    console.log('⏳ Wait 30-60 seconds for Appwrite to process the attributes...');
  } catch (error) {
    console.error('❌ Error adding attributes:', error);
    throw error;
  }
}

addMissingAttributes();
