import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def seed_test_data():
    print("Seeding test data...")
    
    # Create test users
    test_users = [
        {'secondme_id': 'user_001', 'nickname': 'Alice', 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', 'shades': ['JavaScript', 'React', 'Node.js']},
        {'secondme_id': 'user_002', 'nickname': 'Bob', 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', 'shades': ['Python', 'Django', 'AI']},
        {'secondme_id': 'user_003', 'nickname': 'Charlie', 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', 'shades': ['UI/UX', 'Figma', 'Design']},
    ]
    
    user_ids = {}
    for user_data in test_users:
        result = supabase_client.table('users').upsert(user_data, on_conflict='secondme_id').execute()
        user_ids[user_data['secondme_id']] = result.data[0]['id']
        print(f"Created user: {user_data['nickname']} (id: {result.data[0]['id']})")
    
    # Create test agents
    test_agents = [
        {'user_id': user_ids['user_001'], 'name': 'Alice Developer', 'level': 5, 'coins': 5000, 'credit_score': 750, 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', 'is_active': True, 'response_time_minutes': 30, 'satisfaction_rate': 4.8},
        {'user_id': user_ids['user_002'], 'name': 'Bob AI Expert', 'level': 8, 'coins': 10000, 'credit_score': 900, 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', 'is_active': True, 'response_time_minutes': 15, 'satisfaction_rate': 4.9},
        {'user_id': user_ids['user_003'], 'name': 'Charlie Designer', 'level': 4, 'coins': 3000, 'credit_score': 700, 'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', 'is_active': True, 'response_time_minutes': 45, 'satisfaction_rate': 4.5},
    ]
    
    agent_ids = {}
    for agent_data in test_agents:
        result = supabase_client.table('agents').insert(agent_data).execute()
        agent_ids[agent_data['name']] = result.data[0]['id']
        print(f"Created agent: {agent_data['name']} (id: {result.data[0]['id']})")
    
    # Create test skills
    test_skills = [
        {'name': 'Web Development', 'category': 'Development', 'description': 'Full-stack web development', 'rarity': 'common', 'base_price': 100},
        {'name': 'AI/ML Development', 'category': 'AI', 'description': 'Machine learning and AI development', 'rarity': 'rare', 'base_price': 500},
        {'name': 'UI/UX Design', 'category': 'Design', 'description': 'User interface and experience design', 'rarity': 'common', 'base_price': 150},
        {'name': 'Python Programming', 'category': 'Development', 'description': 'Python development and scripting', 'rarity': 'common', 'base_price': 80},
        {'name': 'React Framework', 'category': 'Frontend', 'description': 'React.js framework expertise', 'rarity': 'uncommon', 'base_price': 200},
    ]
    
    skill_ids = {}
    for skill_data in test_skills:
        result = supabase_client.table('skills').insert(skill_data).execute()
        skill_ids[skill_data['name']] = result.data[0]['id']
        print(f"Created skill: {skill_data['name']} (id: {result.data[0]['id']})")
    
    print("\nTest data seeded successfully!")
    print(f"Users: {len(user_ids)}")
    print(f"Agents: {len(agent_ids)}")
    print(f"Skills: {len(skill_ids)}")

if __name__ == '__main__':
    seed_test_data()
