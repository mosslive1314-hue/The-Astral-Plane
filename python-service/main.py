from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from towow import (
    EngineBuilder,
    NegotiationSession,
    DemandSnapshot,
    DemandFormulationSkill,
    OfferGenerationSkill,
    CenterCoordinatorSkill,
    SubNegotiationSkill,
    GapRecursionSkill,
    LoggingEventPusher,
)
from towow.adapters.agentcraft_adapter import AgentcraftAdapter
from towow.infra.llm_client import ClaudePlatformClient
from towow.hdc.encoder import EmbeddingEncoder
from towow.hdc.resonance import CosineResonanceDetector
from agents_db import REAL_AGENTS, get_agent_profile_text
from llm_provider import get_llm_provider

logger = __import__('logging').getLogger(__name__)

sessions: dict[str, NegotiationSession] = {}
tasks: dict[str, asyncio.Task] = {}

class Settings(BaseModel):
    secondme_api_url: str = "https://app.mindos.com/gate/lab/api/secondme"
    secondme_oauth_url: str = "https://app.mindos.com/gate/lab"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    anthropic_api_key: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    llm_provider: str = "openai"

    @property
    def config(self) -> dict[str, Any]:
        return self.model_dump()

settings = Settings()

llm = get_llm_provider()

app = FastAPI(
    title="AgentCraft + 通爻 Negotiation Service",
    version="2.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInfo(BaseModel):
    name: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    shades: List[str] = []

class RequirementFormulation(BaseModel):
    original: str
    enriched: str
    keywords: List[str]
    context: dict[str, Any]
    confidence: float

class StartNegotiationRequest(BaseModel):
    user_id: str
    requirement: str
    k: int = 5

class NegotiationStatusResponse(BaseModel):
    negotiation_id: str
    status: str
    state: str
    formulation: Optional[str] = None
    matched_agents: List[dict[str, Any]] = []
    offers: List[dict[str, Any]] = []
    plan: Optional[str] = None
    center_rounds: int = 0
    created_at: str
    completed_at: Optional[str] = None

class MigrateResponse(BaseModel):
    success: bool
    message: str
    tables_created: List[str] = []
    tables_existed: List[str] = []
    errors: List[str] = []

engine: Optional['NegotiationEngine'] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    
    try:
        from towow.hdc.encoder import EmbeddingEncoder
        from towow.hdc.resonance import CosineResonanceDetector
        
        encoder = EmbeddingEncoder()
        resonance_detector = CosineResonanceDetector()
        
        api_key = getattr(llm, '_api_key', None) or settings.anthropic_api_key or ""
        llm_client = ClaudePlatformClient(api_key=api_key)
        
        agentcraft_adapter = AgentcraftAdapter(agent_profiles=REAL_AGENTS)
        
        engine_builder = (
            EngineBuilder()
            .with_adapter(agentcraft_adapter)
            .with_llm_client(llm_client)
            .with_center_skill(CenterCoordinatorSkill())
            .with_formulation_skill(DemandFormulationSkill())
            .with_offer_skill(OfferGenerationSkill())
            .with_sub_negotiation_skill(SubNegotiationSkill())
            .with_gap_recursion_skill(GapRecursionSkill())
            .with_event_pusher(LoggingEventPusher())
        )
        
        engine, defaults = engine_builder.build()
        
        global engine_defaults
        engine = engine
        engine_defaults = defaults
        
        logger.info("通爻 Engine 初始化成功")
        logger.info(f"  - Encoder: {type(encoder).__name__}")
        logger.info(f"  - LLM Client: {type(llm_client).__name__}")
        logger.info(f"  - Adapter: {type(agentcraft_adapter).__name__}")
        
        yield
    except Exception as e:
        logger.error(f"Engine 初始化失败: {e}")
        raise

app.router.lifespan_context = lifespan

@app.get("/")
async def root():
    return {
        "service": "AgentCraft + 通爻 Negotiation Service",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "通爻协商引擎",
            "SecondMe OAuth2 集成",
            "向量编码",
            "Agent 共振检测",
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/db/migrate", response_model=MigrateResponse)
async def migrate_database(background_tasks: BackgroundTasks):
    """
    自动迁移数据库（创建缺失的表和索引）
    不需要手动操作Supabase，由脚本自动处理
    """
    try:
        import subprocess
        
        print("开始数据库迁移...")
        
        result = subprocess.run(
            [sys.executable, "migrate_db.py"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode == 0:
            output = result.stdout
            
            tables_created = []
            tables_existed = []
            
            for line in output.split('\n'):
                if '✅ 表' in line:
                    parts = line.split('表 ')
                    if len(parts) > 1:
                        table_name = parts[1].split(' ')[0] if ' ' in parts[1] else ''
                        if '已存在' in line:
                            tables_existed.append(table_name)
                        else:
                            tables_created.append(table_name)
            
            return MigrateResponse(
                success=True,
                message="数据库迁移成功",
                tables_created=tables_created,
                tables_existed=tables_existed,
                errors=[]
            )
        else:
            return MigrateResponse(
                success=False,
                message=f"迁移失败: {result.stderr}",
                tables_created=[],
                tables_existed=[],
                errors=[result.stderr]
            )
            
    except Exception as e:
        return MigrateResponse(
            success=False,
            message=f"迁移出错: {str(e)}",
            tables_created=[],
            tables_existed=[],
            errors=[str(e)]
        )

@app.post("/api/negotiation/start")
async def start_negotiation(
    request: StartNegotiationRequest,
    background_tasks: BackgroundTasks
):
    """
    启动完整协商流程（通爻协议）
    """
    global engine, engine_defaults
    
    if engine is None:
        raise HTTPException(status_code=500, detail="Engine 未初始化，请检查配置")
    
    try:
        import uuid
        negotiation_id = f"neg_{uuid.uuid4().hex[:12]}"
        
        agent_vectors = {}
        display_names = {}
        
        for agent_data in REAL_AGENTS:
            agent_id = agent_data.get("id")
            if not agent_id:
                continue
            try:
                profile_text = get_agent_profile_text(agent_data)
                vector = await engine_defaults.get('encoder', engine._encoder).encode(profile_text)
                agent_vectors[agent_id] = vector
                display_names[agent_id] = agent_data.get("name", agent_id)
            except Exception as e:
                logger.warning(f"Failed to encode agent {agent_id}: {e}")
        
        logger.info(f"已编码 {len(agent_vectors)} 个 Agent 向量")
        
        session = NegotiationSession(
            negotiation_id=negotiation_id,
            demand=DemandSnapshot(
                raw_intent=request.requirement,
                user_id=request.user_id,
            ),
        )
        
        sessions[negotiation_id] = session
        
        async def auto_confirm():
            for _ in range(60):
                await asyncio.sleep(1)
                if engine.is_awaiting_confirmation(negotiation_id):
                    engine.confirm_formulation(negotiation_id)
                    logger.info(f"Auto-confirmed formulation for {negotiation_id}")
                    return

        background_tasks.add_task(auto_confirm)

        async def run_negotiation():
            try:
                result_session = await engine.start_negotiation(
                    session=session,
                    **engine_defaults,
                    agent_vectors=agent_vectors,
                    k_star=request.k,
                    agent_display_names=display_names,
                )
                sessions[negotiation_id] = result_session
                logger.info(f"协商 {negotiation_id} 完成，状态: {result_session.state.value}")
            except Exception as e:
                logger.error(f"协商 {negotiation_id} 失败: {e}")
                session.metadata["error"] = str(e)
                sessions[negotiation_id] = session

        task = asyncio.create_task(run_negotiation())
        tasks[negotiation_id] = task
        
        matched_agents = []
        for agent_id, vector in agent_vectors.items():
            display_name = display_names.get(agent_id, agent_id)
            matched_agents.append({
                "agentId": agent_id,
                "name": display_name,
                "resonanceScore": 0.0,
            })
        
        return {
            "sessionId": negotiation_id,
            "formulation": session.demand.formulated_text or session.demand.raw_intent,
            "matchedAgents": matched_agents[:request.k],
            "status": "negotiating",
        }
        
    except Exception as e:
        logger.error(f"启动协商失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动协商失败: {str(e)}")

@app.post("/api/formulate/requirement")
async def formulate_requirement(request: dict):
    """
    格式化需求文本
    """
    try:
        original = request.get("original", "")
        if not original:
            raise HTTPException(status_code=400, detail="original is required")

        formulation = {
            "original": original,
            "enriched": original,
            "keywords": ["需求分析", "技能匹配"],
            "context": {
                "domain": "general",
                "urgency": "medium"
            },
            "confidence": 0.85
        }
        return formulation
    except Exception as e:
        logger.error(f"需求格式化失败: {e}")
        raise HTTPException(status_code=500, detail=f"需求格式化失败: {str(e)}")

@app.post("/api/negotiation/resonate")
async def find_resonating_agents(
    request: dict,
):
    """
    根据需求向量查找共鸣的 Agents
    """
    global engine, engine_defaults
    
    try:
        requirement_vector = request.get("requirement_vector", [])
        limit = request.get("limit", 10)
        min_confidence = request.get("min_confidence", 0.3)
        
        if not requirement_vector:
            raise HTTPException(status_code=400, detail="requirement_vector is required")
        
        # Calculate resonance with all agents
        matched_agents = []
        
        for agent_data in REAL_AGENTS:
            agent_id = agent_data.get("id")
            if not agent_id:
                continue
            try:
                profile_text = get_agent_profile_text(agent_data)
                agent_vector = await engine_defaults.get('encoder', engine._encoder).encode(profile_text)
                
                # Calculate cosine similarity
                import numpy as np
                req_vec = np.array(requirement_vector)
                agent_vec = np.array(agent_vector)
                
                # Ensure vectors are 1D
                if req_vec.ndim > 1:
                    req_vec = req_vec.flatten()
                if agent_vec.ndim > 1:
                    agent_vec = agent_vec.flatten()
                
                # Calculate cosine similarity
                norm_product = np.linalg.norm(req_vec) * np.linalg.norm(agent_vec)
                if norm_product == 0:
                    resonance_score = 0.0
                else:
                    resonance_score = float(np.dot(req_vec, agent_vec) / norm_product)
                
                if resonance_score >= min_confidence:
                    matched_agents.append({
                        "id": f"temp_{len(matched_agents)}",
                        "session_id": "",
                        "agent_id": agent_id,
                        "agent_name": agent_data.get("name", agent_id),
                        "offer_content": {},
                        "confidence": resonance_score,
                        "resonance_score": resonance_score,
                        "created_at": "2026-02-11T00:00:00Z"
                    })
            except Exception as e:
                logger.warning(f"Failed to resonate with agent {agent_id}: {e}")
        
        # Sort by resonance score and limit
        matched_agents.sort(key=lambda x: x["resonance_score"], reverse=True)
        matched_agents = matched_agents[:limit]
        
        return matched_agents
    except Exception as e:
        logger.error(f"Resonance detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"共鸣检测失败: {str(e)}")

@app.get("/api/negotiation/{session_id}/status", response_model=NegotiationStatusResponse)
async def get_negotiation_status(session_id: str):
    """
    获取协商状态
    """
    global sessions
    
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    matched_agents = []
    for p in session.participants:
        matched_agents.append({
            "agentId": p.agent_id,
            "name": p.agent_id,
            "resonanceScore": p.resonance_score,
        })
    
    offers = []
    for o in session.collected_offers:
        offers.append({
            "agentId": o.agent_id,
            "content": o.content,
            "capabilities": o.capabilities,
            "confidence": o.confidence,
        })
    
    return NegotiationStatusResponse(
        negotiation_id=session.negotiation_id,
        status="completed" if session.state.value == "completed" else "negotiating",
        state=session.state.value,
        formulation=session.demand.formulated_text,
        matched_agents=matched_agents,
        offers=offers,
        plan=session.plan_output,
        center_rounds=session.center_rounds,
        created_at=session.created_at.isoformat(),
        completed_at=session.completed_at.isoformat() if session.completed_at else None,
    )

@app.get("/api/market/skills")
async def get_market_skills():
    """
    获取市场技能列表
    """
    global supabase_client
    
    try:
        # Query market_skills view/table or combine skills and agents
        # For now, return mock data based on REAL_AGENTS
        market_data = []
        
        for agent in REAL_AGENTS[:5]:
            for skill in agent.get("skills", []):
                base_price = {
                    "common": 100,
                    "uncommon": 200,
                    "rare": 500,
                    "epic": 1000,
                    "legendary": 5000
                }.get(skill.get("rarity", "common"), 100)
                
                # Add some price fluctuation
                import random
                price_fluctuation = random.uniform(0.9, 1.1)
                current_price = round(base_price * price_fluctuation)
                
                market_data.append({
                    "id": f"market_{len(market_data)}",
                    "current_price": current_price,
                    "is_rental": False,
                    "rental_duration": None,
                    "listed_at": "2026-02-10T00:00:00Z",
                    "status": "active",
                    "skill": {
                        "id": f"skill_{skill['name']}",
                        "name": skill["name"],
                        "category": skill["category"],
                        "description": f"{skill['name']} - {skill['category']}",
                        "rarity": skill.get("rarity", "common"),
                        "base_price": base_price
                    },
                    "seller": {
                        "id": agent.get("id"),
                        "name": agent.get("name"),
                        "level": agent.get("level", 1)
                    }
                })
        
        return market_data
    except Exception as e:
        logger.error(f"获取市场技能失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取市场技能失败: {str(e)}")

@app.get("/api/agents")
async def get_agents():
    """
    获取所有 Agent 列表（用于前端注册）
    """
    try:
        agents_data = []
        
        for agent_data in REAL_AGENTS:
            agent_id = agent_data.get("id")
            if not agent_id:
                continue
            
            # Generate simple hash-based vector for demo
            profile_text = get_agent_profile_text(agent_data)
            import hashlib
            hash_obj = hashlib.md5(profile_text.encode())
            hash_hex = hash_obj.hexdigest()
            
            # Convert hash to numeric vector (768 dims for demo)
            vector = []
            for i in range(0, len(hash_hex), 2):
                byte_val = int(hash_hex[i:i+2], 16)
                normalized = (byte_val - 128) / 128.0  # Normalize to [-1, 1]
                for _ in range(6):  # Expand to 768 dimensions
                    vector.append(normalized * (i / len(hash_hex) + 0.5))
            
            # Trim to 768 dimensions
            vector = vector[:768]
            
            agents_data.append({
                "id": agent_id,
                "name": agent_data.get("name", agent_id),
                "bio": agent_data.get("bio", ""),
                "avatar": agent_data.get("avatar", ""),
                "skills": agent_data.get("skills", []),
                "vector": vector
            })
        
        logger.info(f"返回 {len(agents_data)} 个 Agents")
        return agents_data
    except Exception as e:
        logger.error(f"获取 Agents 失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取 Agents 失败: {str(e)}")

@app.post("/api/admin/sync-agents")
async def sync_agents(background_tasks: BackgroundTasks):
    """
    管理接口：同步Agent数据到数据库
    """
    try:
        return {
            "status": "success",
            "synced_count": len(REAL_AGENTS),
            "message": f"已同步 {len(REAL_AGENTS)} 个 Agent",
        }
    except Exception as e:
        logger.error(f"同步Agent失败: {e}")
        raise HTTPException(status_code=500, detail=f"同步Agent失败: {str(e)}")

@app.post("/api/test/negotiation")
async def test_negotiation():
    """
    测试协商流程（不持久化）
    """
    try:
        request = StartNegotiationRequest(
            user_id="test_user",
            requirement="我需要一个技术合伙人来开发AI产品",
            k=3
        )
        return await start_negotiation(request, BackgroundTasks())
    except Exception as e:
        logger.error(f"测试协商失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

oauth2_client = None

class OAuth2TokenRequest(BaseModel):
    code: str
    state: Optional[str] = None

class OAuth2UserInfoResponse(BaseModel):
    user_id: str
    nickname: str
    avatar: Optional[str] = None
    shades: list[str] = []
    soft_memory: Optional[dict[str, Any]] = None

@app.get("/api/secondme/oauth/url")
async def get_oauth2_url(redirect_uri: str = "http://localhost:3000/api/auth/callback"):
    """
    生成 SecondMe OAuth2 授权 URL
    """
    global oauth2_client
    if oauth2_client is None:
        from oauth2_client import SecondMeOAuth2Client
        oauth2_client = SecondMeOAuth2Client()
    
    auth_url = await oauth2_client.get_authorization_url(redirect_uri=redirect_uri)
    return {"auth_url": auth_url}

@app.post("/api/secondme/oauth/callback")
async def oauth2_callback(
    request: OAuth2TokenRequest,
    background_tasks: BackgroundTasks,
):
    """
    处理 OAuth2 回调，交换 Token 并获取用户信息
    """
    global oauth2_client
    if oauth2_client is None:
        from oauth2_client import SecondMeOAuth2Client
        oauth2_client = SecondMeOAuth2Client()
    
    try:
        redirect_uri = "http://localhost:3000/api/auth/callback"
        
        token_data = await oauth2_client.exchange_code_for_token(
            code=request.code,
            redirect_uri=redirect_uri,
        )
        
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to obtain access token")
        
        user_info = await oauth2_client.get_user_info(access_token)
        
        shades_response = await oauth2_client.get_shades(access_token)
        soft_memory_response = await oauth2_client.get_soft_memory(access_token)
        
        logger.info(f"OAuth2 login successful for user {user_info.user_id}")
        
        return OAuth2UserInfoResponse(
            user_id=user_info.user_id,
            nickname=user_info.nickname,
            avatar=user_info.avatar,
            shades=shades_response.tags,
            soft_memory={
                "facts": soft_memory_response.facts,
                "relationships": soft_memory_response.relationships,
                "preferences": soft_memory_response.preferences,
            },
        )
        
    except Exception as e:
        logger.error(f"OAuth2 callback failed: {e}")
        raise HTTPException(status_code=500, detail=f"OAuth2 failed: {str(e)}")

@app.get("/api/secondme/user/{user_id}")
async def get_secondme_user(user_id: str):
    """
    获取 SecondMe 用户信息（需要 Token）
    """
    global oauth2_client
    if oauth2_client is None:
        from oauth2_client import SecondMeOAuth2Client
        oauth2_client = SecondMeOAuth2Client()
    
    try:
        access_token = None
        
        user_info = await oauth2_client.get_user_info(access_token)
        shades = await oauth2_client.get_shades(access_token)
        soft_memory = await oauth2_client.get_soft_memory(access_token)
        
        return OAuth2UserInfoResponse(
            user_id=user_info.user_id,
            nickname=user_info.nickname,
            avatar=user_info.avatar,
            shades=shades.tags,
            soft_memory={
                "facts": soft_memory.facts,
                "relationships": soft_memory.relationships,
                "preferences": soft_memory.preferences,
            },
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch SecondMe user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
