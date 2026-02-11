import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/database'

export async function POST() {
  try {
    const migrations = [
      {
        name: 'add_soft_memory',
        sql: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS soft_memory JSONB DEFAULT '[]'::jsonb;
          CREATE INDEX IF NOT EXISTS idx_users_soft_memory ON users USING GIN(soft_memory);
        `
      },
      {
        name: 'create_reviews_table',
        sql: `
          CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
            reviewer_id UUID REFERENCES agents(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT NOT NULL,
            task_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_reviews_agent_id ON reviews(agent_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
        `
      },
      {
        name: 'create_notifications_table',
        sql: `
          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            link VARCHAR(500),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
          CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        `
      }
    ]

    const results = []

    for (const migration of migrations) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: migration.sql 
        })

        if (error) {
          console.warn(`Migration ${migration.name} failed via RPC, trying direct execution:`, error)
          results.push({ name: migration.name, success: false, error: error.message })
        } else {
          console.log(`Migration ${migration.name} completed`)
          results.push({ name: migration.name, success: true })
        }
      } catch (err: any) {
        console.error(`Migration ${migration.name} error:`, err)
        results.push({ name: migration.name, success: false, error: err.message })
      }
    }

    const failedMigrations = results.filter(r => !r.success)
    
    if (failedMigrations.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Some migrations failed. Please run SQL manually in Supabase SQL Editor.',
        results,
        manualInstructions: {
          url: 'https://supabase.com/dashboard/project',
          steps: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to SQL Editor',
            '3. Run each failed migration SQL manually'
          ],
          failedMigrations
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      results 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run database migrations',
    migrations: [
      'add_soft_memory',
      'create_reviews_table',
      'create_notifications_table'
    ]
  })
}
