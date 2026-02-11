"""
Agent同步与向量编码服务
负责将真实Agent数据同步到Supabase，并生成向量
"""

from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from sentence_transformers import SentenceTransformer
import logging

from agents_db import REAL_AGENTS, get_agent_profile_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentSyncService:
    def __init__(self, supabase_url: str):
        """
        初始化Agent同步服务
        
        Args:
            supabase_url: Supabase数据库连接URL
        """
        self.supabase_url = supabase_url.replace("postgresql://", "")
        self.model = None
        
    def _get_model(self):
        """懒加载向量编码模型"""
        if self.model is None:
            model_name = "shibing624/text2vec-base-chinese"
            cache_dir = "/app/models"
            logger.info(f"加载向量编码模型: {model_name}")
            self.model = SentenceTransformer(model_name, cache_folder=cache_dir)
        return self.model
    
    def _get_connection(self):
        """获取数据库连接"""
        return psycopg2.connect(
            f"postgresql://{self.supabase_url}",
            cursor_factory=RealDictCursor
        )
    
    def _encode_agent_profile(self, agent: dict) -> List[float]:
        """
        编码Agent的技能描述为向量
        
        Args:
            agent: Agent数据字典
            
        Returns:
            768维向量列表
        """
        profile_text = get_agent_profile_text(agent)
        model = self._get_model()
        vector = model.encode(profile_text, normalize_embeddings=True)
        return vector.tolist()
    
    def sync_agent(self, agent: dict, conn=None) -> bool:
        """
        同步单个Agent到数据库
        
        Args:
            agent: Agent数据
            conn: 数据库连接（可选）
            
        Returns:
            是否成功
        """
        should_close = conn is None
        if conn is None:
            conn = self._get_connection()
            conn.autocommit = True
            cursor = conn.cursor()
        else:
            cursor = conn.cursor()
        
        try:
            # 编码Agent向量
            profile_vector = self._encode_agent_profile(agent)
            skills_json = [skill["name"] for skill in agent["skills"]]
            
            # 检查Agent是否存在
            cursor.execute("SELECT id FROM agents WHERE id = %s", (agent["id"],))
            existing = cursor.fetchone()
            
            if existing:
                # 更新现有Agent
                cursor.execute("""
                    UPDATE agents SET
                        name = %s,
                        avatar = %s,
                        bio = %s,
                        skills = %s,
                        level = %s,
                        is_active = %s,
                        response_time_minutes = %s,
                        satisfaction_rate = %s,
                        contact_endpoint = %s,
                        profile_vector = %s::vector,
                        last_resonance_at = NOW()
                    WHERE id = %s
                """, (
                    agent["name"],
                    agent.get("avatar"),
                    agent["bio"],
                    skills_json,
                    agent["level"],
                    agent["is_active"],
                    agent["response_time_minutes"],
                    agent["satisfaction_rate"],
                    agent.get("contact_endpoint"),
                    profile_vector,
                    agent["id"]
                ))
                logger.info(f"更新Agent: {agent['name']} ({agent['id']})")
            else:
                # 插入新Agent
                cursor.execute("""
                    INSERT INTO agents (
                        id, name, avatar, bio, skills, level,
                        is_active, response_time_minutes, satisfaction_rate,
                        contact_endpoint, profile_vector, last_resonance_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector, NOW())
                """, (
                    agent["id"],
                    agent["name"],
                    agent.get("avatar"),
                    agent["bio"],
                    skills_json,
                    agent["level"],
                    agent["is_active"],
                    agent["response_time_minutes"],
                    agent["satisfaction_rate"],
                    agent.get("contact_endpoint"),
                    profile_vector
                ))
                logger.info(f"插入Agent: {agent['name']} ({agent['id']})")
            
            return True
            
        except Exception as e:
            logger.error(f"同步Agent失败 {agent['id']}: {e}")
            return False
        finally:
            if should_close:
                cursor.close()
                conn.close()
    
    def sync_all_agents(self) -> dict:
        """
        同步所有Agent到数据库
        
        Returns:
            同步结果统计
        """
        results = {
            "total": len(REAL_AGENTS),
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        conn = self._get_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        for agent in REAL_AGENTS:
            success = self.sync_agent(agent, conn)
            if success:
                results["success"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(agent["id"])
        
        cursor.close()
        conn.close()
        
        logger.info(f"同步完成: 成功 {results['success']}/{results['total']}")
        return results
    
    def get_agent_vector(self, agent_id: str) -> Optional[List[float]]:
        """
        获取Agent的向量
        
        Args:
            agent_id: Agent ID
            
        Returns:
            向量列表，如果不存在返回None
        """
        conn = self._get_connection()
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute(
                "SELECT profile_vector FROM agents WHERE id = %s",
                (agent_id,)
            )
            result = cursor.fetchone()
            
            if result and result["profile_vector"]:
                return list(result["profile_vector"])
            return None
            
        finally:
            cursor.close()
            conn.close()
    
    def search_agents_by_vector(
        self,
        query_vector: List[float],
        limit: int = 10,
        min_score: float = 0.3
    ) -> List[dict]:
        """
        根据向量搜索相似的Agent
        
        Args:
            query_vector: 查询向量
            limit: 返回数量
            min_score: 最小相似度
            
        Returns:
            匹配的Agent列表
        """
        conn = self._get_connection()
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            query = """
                SELECT 
                    a.id,
                    a.name,
                    a.avatar,
                    a.bio,
                    a.skills,
                    a.level,
                    a.is_active,
                    a.satisfaction_rate,
                    a.response_time_minutes,
                    1 - (a.profile_vector <=> %s::vector) as resonance_score
                FROM agents a
                WHERE a.is_active = true
                    AND a.profile_vector IS NOT NULL
                ORDER BY a.profile_vector <=> %s::vector
                LIMIT %s
            """
            
            cursor.execute(query, (query_vector, query_vector, limit))
            results = cursor.fetchall()
            
            # 过滤低于最小分数的
            return [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "avatar": row["avatar"],
                    "bio": row["bio"],
                    "skills": row["skills"],
                    "level": row["level"],
                    "satisfaction_rate": float(row["satisfaction_rate"]),
                    "response_time_minutes": row["response_time_minutes"],
                    "resonance_score": float(row["resonance_score"])
                }
                for row in results
                if float(row["resonance_score"]) >= min_score
            ]
            
        finally:
            cursor.close()
            conn.close()


if __name__ == "__main__":
    import os
    
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        print("错误: 请设置环境变量 SUPABASE_URL")
        exit(1)
    
    sync_service = AgentSyncService(supabase_url)
    results = sync_service.sync_all_agents()
    
    print(f"\n同步结果:")
    print(f"  总数: {results['total']}")
    print(f"  成功: {results['success']}")
    print(f"  失败: {results['failed']}")
    
    if results["errors"]:
        print(f"  失败的Agent: {results['errors']}")
