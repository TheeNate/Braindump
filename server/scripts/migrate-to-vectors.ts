
import { storage } from '../storage';

async function migrateExistingIdeas() {
  console.log('Starting migration of existing ideas to vector database...');
  
  try {
    const allIdeas = await storage.getIdeas();
    console.log(`Found ${allIdeas.length} ideas to migrate`);
    
    for (const idea of allIdeas) {
      try {
        await storage.storeIdeaVector(idea.id, idea.text);
        console.log(`✓ Migrated idea ${idea.id}`);
      } catch (error) {
        console.error(`✗ Failed to migrate idea ${idea.id}:`, error);
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  migrateExistingIdeas();
}

export { migrateExistingIdeas };
