const { Client } = require('pg');

const connectionString = 'postgresql://postgres:1qegAHL2NsKHLJNJ@db.tzqcimpabjmrxlftkgfy.supabase.co:5432/postgres';

async function updateSchema() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const sql = `
      -- 1. Notes Table (Mind Assets)
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        tags TEXT[],
        type VARCHAR(50) DEFAULT 'general',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 2. Solutions Table (Market Contracts)
      CREATE TABLE IF NOT EXISTS solutions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        price INTEGER DEFAULT 0,
        rating NUMERIC(3,1) DEFAULT 5.0,
        usage_count INTEGER DEFAULT 0,
        tags TEXT[],
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 3. Futures Contracts Table
      CREATE TABLE IF NOT EXISTS futures_contracts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id),
        skill_name VARCHAR(100),
        contract_type VARCHAR(10) NOT NULL CHECK (contract_type IN ('long', 'short')),
        strike_price INTEGER NOT NULL,
        current_price INTEGER NOT NULL,
        leverage INTEGER DEFAULT 1,
        margin INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 4. Futures Orders Table
      CREATE TABLE IF NOT EXISTS futures_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        skill_name VARCHAR(100),
        type VARCHAR(10) NOT NULL CHECK (type IN ('long', 'short')),
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        leverage INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 5. Tasks Table - Handle Existing Table
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add columns if they don't exist (Idempotent)
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='publisher_id') THEN
          ALTER TABLE tasks ADD COLUMN publisher_id UUID REFERENCES agents(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee_id') THEN
          ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES agents(id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='requirements') THEN
          ALTER TABLE tasks ADD COLUMN requirements TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='reward') THEN
          ALTER TABLE tasks ADD COLUMN reward INTEGER;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deadline') THEN
          ALTER TABLE tasks ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='description') THEN
          ALTER TABLE tasks ADD COLUMN description TEXT;
        END IF;
      END $$;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_notes_agent ON notes(agent_id);
      CREATE INDEX IF NOT EXISTS idx_solutions_agent ON solutions(agent_id);
      CREATE INDEX IF NOT EXISTS idx_futures_contracts_agent ON futures_contracts(agent_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_publisher ON tasks(publisher_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `;

    console.log('📜 Executing Schema Update...');
    await client.query(sql);
    console.log('✅ Schema Updated Successfully!\n');

    // Verify
    console.log('🔍 Verifying Tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('notes', 'solutions', 'futures_contracts', 'futures_orders', 'tasks');
    `);

    result.rows.forEach(row => {
      console.log(`   - Found table: ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateSchema();
