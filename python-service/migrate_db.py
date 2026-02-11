import asyncio
import os
import sys
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from supabase import create_client, Client
except ImportError:
    print("安装 Supabase 客户端: pip install supabase")
    sys.exit(1)

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("错误: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 必须在 .env 中配置")
    sys.exit(1)

supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

TABLES_TO_CREATE = [
    {
        'name': 'users',
        'sql': '''
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                secondme_id VARCHAR(255) UNIQUE NOT NULL,
                nickname VARCHAR(100),
                avatar TEXT,
                shades TEXT[],
                soft_memory JSONB,
                access_token TEXT,
                refresh_token TEXT,
                token_expires_at TIMESTAMP WITH TIME ZONE,
                secondme_synced_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''
    },
    {
        'name': 'agents',
        'sql': '''
            CREATE TABLE IF NOT EXISTS agents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                level INTEGER DEFAULT 1,
                coins INTEGER DEFAULT 1000,
                credit_score INTEGER DEFAULT 500,
                avatar TEXT,
                profile_vector VECTOR(384),
                projection_lens_id UUID,
                is_active BOOLEAN DEFAULT true,
                last_resonance_at TIMESTAMP WITH TIME ZONE,
                response_time_minutes INTEGER DEFAULT 30,
                satisfaction_rate DECIMAL(3, 2) DEFAULT 5.0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''
    },
    {
        'name': 'skills',
        'sql': '''
            CREATE TABLE IF NOT EXISTS skills (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                rarity VARCHAR(20) DEFAULT 'common',
                base_price INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''
    },
    {
        'name': 'negotiation_sessions',
        'sql': '''
            CREATE TABLE IF NOT EXISTS negotiation_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                requirement TEXT NOT NULL,
                formulated_requirement JSONB,
                requirement_vector VECTOR(384),
                status VARCHAR(20) DEFAULT 'negotiating',
                result JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE
            );
        '''
    },
    {
        'name': 'agent_offers',
        'sql': '''
            CREATE TABLE IF NOT EXISTS agent_offers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
                agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                offer_content JSONB NOT NULL,
                confidence DECIMAL(3, 2),
                resonance_score DECIMAL(3, 2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''
    },
    {
        'name': 'projection_lenses',
        'sql': '''
            CREATE TABLE IF NOT EXISTS projection_lenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                config JSONB NOT NULL DEFAULT '{}',
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        '''
    },
]

INDEXES_TO_CREATE = [
    {
        'name': 'idx_agents_user_id',
        'table': 'agents',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);'
    },
    {
        'name': 'idx_agents_profile_vector',
        'table': 'agents',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_agents_profile_vector ON agents USING ivfflat (profile_vector vector_cosine_ops);'
    },
    {
        'name': 'idx_negotiation_sessions_user',
        'table': 'negotiation_sessions',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_user ON negotiation_sessions(user_id, created_at DESC);'
    },
    {
        'name': 'idx_agent_offers_session',
        'table': 'agent_offers',
        'sql': 'CREATE INDEX IF NOT EXISTS idx_agent_offers_session ON agent_offers(session_id, created_at DESC);'
    },
]

async def execute_sql_via_rpc(sql: str) -> dict[str, Any]:
    try:
        result = supabase_client.rpc('exec_sql', {'query': sql}).execute()
        if result.data:
            return result.data
        else:
            return {'error': str(result.error) if result.error else 'Unknown error'}
    except Exception as e:
        return {'error': str(e)}

async def check_table_exists(table_name: str) -> bool:
    try:
        result = await execute_sql_via_rpc(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}');")
        if result and result.get('data'):
            return True
        return False
    except:
        return False

async def create_table(table_def: dict) -> bool:
    exists = await check_table_exists(table_def['name'])
    if exists:
        print(f"  [OK] Table {table_def['name']} already exists, skipping")
        return True
    
    print(f"  [CREATE] Creating table: {table_def['name']}")
    result = await execute_sql_via_rpc(table_def['sql'])
    
    if 'error' in result:
        print(f"  [ERROR] Failed to create table {table_def['name']}: {result['error']}")
        return False
    else:
        print(f"  [OK] Table {table_def['name']} created successfully")
        return True

async def create_index(index_def: dict) -> bool:
    print(f"  [CREATE] Creating index: {index_def['name']}")
    result = await execute_sql_via_rpc(index_def['sql'])
    
    if 'error' in result:
        print(f"  [ERROR] Failed to create index {index_def['name']}: {result['error']}")
        return False
    else:
        print(f"  [OK] Index {index_def['name']} created successfully")
        return True

async def seed_initial_data() -> None:
    print("\n  [SEED] Seeding initial data...")
    
    lens_data = [
        {
            'name': '基础透镜',
            'description': '只按技能名称和类别进行简单匹配',
            'config': '{"weights": {"skill_name": 1.0, "skill_category": 1.0}}',
            'is_default': True
        },
        {
            'name': '经验透镜',
            'description': '考虑Agent的等级和信用评分',
            'config': '{"weights": {"skill_name": 0.8, "skill_category": 0.8, "agent_level": 0.5, "credit_score": 0.3}}',
            'is_default': False
        },
    ]
    
    for lens in lens_data:
        try:
            result = supabase_client.table('projection_lenses').select('*').eq('name', lens['name']).execute()
            if not result.data or len(result.data) == 0:
                supabase_client.table('projection_lenses').insert({
                    'name': lens['name'],
                    'description': lens['description'],
                    'config': lens['config'],
                    'is_default': lens['is_default']
                }).execute()
                print(f"    [OK] Seeded lens: {lens['name']}")
            else:
                print(f"    [SKIP] Lens already exists: {lens['name']}")
        except Exception as e:
            print(f"    [WARNING] Seeding failed: {e}")
    
    print("  [OK] Initial data seeded successfully")

async def main():
    print("=" * 60)
    print("AgentCraft Database Migration Tool")
    print("=" * 60)
    print(f"数据库: {SUPABASE_URL}")
    print()
    
    success_count = 0
    fail_count = 0
    
    for table_def in TABLES_TO_CREATE:
        result = await create_table(table_def)
        if result:
            success_count += 1
        else:
            fail_count += 1
    
    for index_def in INDEXES_TO_CREATE:
        result = await create_index(index_def)
        if result:
            success_count += 1
        else:
            fail_count += 1
    
    await seed_initial_data()
    
    print()
    print("=" * 60)
    print(f"[OK] Migration complete: {success_count} succeeded, {fail_count} failed")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
