import { Pinecone } from '@pinecone-database/pinecone';

async function setupPineconeIndex() {
  console.log('🚀 Setting up Pinecone index...');
  
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const indexName = process.env.PINECONE_INDEX_NAME || 'ideas-index';
  
  try {
    // Check if index exists
    const { indexes } = await pinecone.listIndexes();
    const existingIndex = indexes?.find(index => index.name === indexName);
    
    if (existingIndex) {
      console.log('✅ Pinecone index already exists:', indexName);
      return;
    }
    
    // Create index with OpenAI embedding dimensions (1536 for text-embedding-ada-002)
    console.log('🔄 Creating Pinecone index:', indexName);
    await pinecone.createIndex({
      name: indexName,
      dimension: 1536, // OpenAI text-embedding-ada-002 dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    
    console.log('✅ Pinecone index created successfully:', indexName);
    console.log('⏳ Note: Index may take a few minutes to be fully ready');
    
  } catch (error) {
    console.error('❌ Failed to setup Pinecone index:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupPineconeIndex()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { setupPineconeIndex };