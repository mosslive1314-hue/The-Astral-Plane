"""
真实Agent数据库
包含预置的真实Agent数据，包含技能描述用于向量编码
"""

REAL_AGENTS = [
    {
        "id": "agent-001",
        "name": "CodeNinja",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=codeninja",
        "level": 85,
        "bio": "全栈开发专家，擅长Web应用、API设计、系统架构",
        "skills": [
            {"name": "前端开发", "category": "技术", "proficiency": 0.95},
            {"name": "后端开发", "category": "技术", "proficiency": 0.92},
            {"name": "系统架构", "category": "技术", "proficiency": 0.88},
            {"name": "DevOps", "category": "技术", "proficiency": 0.85},
            {"name": "数据库设计", "category": "技术", "proficiency": 0.90}
        ],
        "is_active": True,
        "response_time_minutes": 15,
        "satisfaction_rate": 4.8,
        "contact_endpoint": "ws://agents.local/agent-001"
    },
    {
        "id": "agent-002",
        "name": "DesignMaster",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=designmaster",
        "level": 78,
        "bio": "UI/UX设计专家，擅长用户体验设计、视觉设计、交互设计",
        "skills": [
            {"name": "UI设计", "category": "设计", "proficiency": 0.95},
            {"name": "UX设计", "category": "设计", "proficiency": 0.92},
            {"name": "交互设计", "category": "设计", "proficiency": 0.88},
            {"name": "品牌设计", "category": "设计", "proficiency": 0.85},
            {"name": "动效设计", "category": "设计", "proficiency": 0.80}
        ],
        "is_active": True,
        "response_time_minutes": 20,
        "satisfaction_rate": 4.7,
        "contact_endpoint": "ws://agents.local/agent-002"
    },
    {
        "id": "agent-003",
        "name": "DataWizard",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=datawizard",
        "level": 82,
        "bio": "数据分析专家，擅长机器学习、数据可视化、统计分析",
        "skills": [
            {"name": "机器学习", "category": "数据", "proficiency": 0.93},
            {"name": "数据可视化", "category": "数据", "proficiency": 0.90},
            {"name": "统计分析", "category": "数据", "proficiency": 0.88},
            {"name": "深度学习", "category": "数据", "proficiency": 0.85},
            {"name": "大数据处理", "category": "数据", "proficiency": 0.82}
        ],
        "is_active": True,
        "response_time_minutes": 25,
        "satisfaction_rate": 4.6,
        "contact_endpoint": "ws://agents.local/agent-003"
    },
    {
        "id": "agent-004",
        "name": "LegalEagle",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=legaleagle",
        "level": 90,
        "bio": "法律顾问专家，擅长合同审核、法律咨询、合规审查",
        "skills": [
            {"name": "合同审核", "category": "法律", "proficiency": 0.98},
            {"name": "法律咨询", "category": "法律", "proficiency": 0.95},
            {"name": "合规审查", "category": "法律", "proficiency": 0.92},
            {"name": "知识产权", "category": "法律", "proficiency": 0.88},
            {"name": "诉讼支持", "category": "法律", "proficiency": 0.85}
        ],
        "is_active": True,
        "response_time_minutes": 30,
        "satisfaction_rate": 4.9,
        "contact_endpoint": "ws://agents.local/agent-004"
    },
    {
        "id": "agent-005",
        "name": "CloudExpert",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=cloudexpert",
        "level": 86,
        "bio": "云架构专家，擅长AWS、Azure、Kubernetes、微服务",
        "skills": [
            {"name": "云架构设计", "category": "技术", "proficiency": 0.95},
            {"name": "Kubernetes", "category": "技术", "proficiency": 0.92},
            {"name": "微服务", "category": "技术", "proficiency": 0.90},
            {"name": "DevOps", "category": "技术", "proficiency": 0.88},
            {"name": "容器化", "category": "技术", "proficiency": 0.90}
        ],
        "is_active": True,
        "response_time_minutes": 18,
        "satisfaction_rate": 4.7,
        "contact_endpoint": "ws://agents.local/agent-005"
    },
    {
        "id": "agent-006",
        "name": "FinancePro",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=financepro",
        "level": 84,
        "bio": "金融分析师，擅长投资分析、风险评估、财务规划",
        "skills": [
            {"name": "投资分析", "category": "金融", "proficiency": 0.93},
            {"name": "风险评估", "category": "金融", "proficiency": 0.90},
            {"name": "财务规划", "category": "金融", "proficiency": 0.88},
            {"name": "量化交易", "category": "金融", "proficiency": 0.82},
            {"name": "市场研究", "category": "金融", "proficiency": 0.87}
        ],
        "is_active": True,
        "response_time_minutes": 22,
        "satisfaction_rate": 4.5,
        "contact_endpoint": "ws://agents.local/agent-006"
    },
    {
        "id": "agent-007",
        "name": "SecurityGuard",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=securityguard",
        "level": 88,
        "bio": "网络安全专家，擅长渗透测试、安全审计、漏洞修复",
        "skills": [
            {"name": "渗透测试", "category": "安全", "proficiency": 0.95},
            {"name": "安全审计", "category": "安全", "proficiency": 0.92},
            {"name": "漏洞修复", "category": "安全", "proficiency": 0.90},
            {"name": "安全架构", "category": "安全", "proficiency": 0.88},
            {"name": "合规检查", "category": "安全", "proficiency": 0.85}
        ],
        "is_active": True,
        "response_time_minutes": 20,
        "satisfaction_rate": 4.8,
        "contact_endpoint": "ws://agents.local/agent-007"
    },
    {
        "id": "agent-008",
        "name": "AIResearcher",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=airesearcher",
        "level": 92,
        "bio": "AI研究员，擅长LLM、计算机视觉、自然语言处理",
        "skills": [
            {"name": "大语言模型", "category": "AI", "proficiency": 0.97},
            {"name": "计算机视觉", "category": "AI", "proficiency": 0.90},
            {"name": "自然语言处理", "category": "AI", "proficiency": 0.93},
            {"name": "强化学习", "category": "AI", "proficiency": 0.85},
            {"name": "模型微调", "category": "AI", "proficiency": 0.88}
        ],
        "is_active": True,
        "response_time_minutes": 35,
        "satisfaction_rate": 4.9,
        "contact_endpoint": "ws://agents.local/agent-008"
    }
]

def get_agent_profile_text(agent: dict) -> str:
    """
    生成Agent的技能描述文本，用于向量编码
    """
    skills_text = "，".join([
        f"{skill['name']}（{skill['category']}，熟练度{skill['proficiency']:.0%}）"
        for skill in agent["skills"]
    ])
    
    profile_text = f"{agent['name']}：{agent['bio']}。技能包括：{skills_text}。等级{agent['level']}，满意度{agent['satisfaction_rate']}。"
    return profile_text

def get_all_agents() -> list:
    """获取所有真实Agent数据"""
    return REAL_AGENTS

def get_agent_by_id(agent_id: str) -> dict:
    """根据ID获取Agent"""
    for agent in REAL_AGENTS:
        if agent["id"] == agent_id:
            return agent
    return None
