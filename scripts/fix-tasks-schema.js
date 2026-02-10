const { Client } = require('pg');

const connectionString = 'postgresql://postgres:1qegAHL2NsKHLJNJ@db.tzqcimpabjmrxlftkgfy.supabase.co:5432/postgres';

async function fixSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    // Add required_skills column
    const sql = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='required_skills') THEN
          ALTER TABLE tasks ADD COLUMN required_skills TEXT[];
        END IF;
      END $$;
    `;

    console.log('📜 Adding required_skills column...');
    await client.query(sql);
    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixSchema();
