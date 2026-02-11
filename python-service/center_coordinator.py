"""
Center协调器
负责收集Agent Offer、等待屏障、生成最终方案
"""

import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import uuid

from llm_provider import get_llm_provider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NegotiationStatus(str, Enum):
    """协商状态"""
    PENDING = "pending"
    NEGOTIATING = "negotiating"
    OFFERS_COLLECTING = "offers_collecting"
    CENTER_PROCESSING = "center_processing"
    COMPLETED = "completed"
    TIMEOUT = "timeout"
    FAILED = "failed"
    INSUFFICIENT_OFFERS = "insufficient_offers"


class AgentOffer:
    """Agent Offer数据结构"""
    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        offer_content: Dict[str, Any],
        confidence: float,
        resonance_score: float,
        created_at: datetime = None
    ):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.offer_content = offer_content
        self.confidence = confidence
        self.resonance_score = resonance_score
        self.created_at = created_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "offer_content": self.offer_content,
            "confidence": self.confidence,
            "resonance_score": self.resonance_score,
            "created_at": self.created_at.isoformat()
        }


class NegotiationSession:
    """协商会话"""
    def __init__(
        self,
        session_id: str,
        user_id: str,
        requirement: str,
        formulated_requirement: Dict[str, Any],
        expected_agents: List[str],
        timeout_seconds: int = 300
    ):
        self.id = session_id
        self.user_id = user_id
        self.requirement = requirement
        self.formulated_requirement = formulated_requirement
        self.expected_agents = expected_agents
        self.timeout_seconds = timeout_seconds
        
        self.status = NegotiationStatus.PENDING
        self.offers: Dict[str, AgentOffer] = {}
        self.created_at = datetime.now()
        self.completed_at: Optional[datetime] = None
        self.final_solution: Optional[Dict[str, Any]] = None
        self.error_message: Optional[str] = None
        
        self._barrier_event = asyncio.Event()
        self._timeout_task: Optional[asyncio.Task] = None
    
    async def start_negotiation(self):
        """开始协商"""
        self.status = NegotiationStatus.NEGOTIATING
        logger.info(f"会话 {self.id} 开始协商，预期Agent: {len(self.expected_agents)}")
        
        # 启动超时任务
        self._timeout_task = asyncio.create_task(self._timeout_monitor())
    
    async def _timeout_monitor(self):
        """超时监控"""
        try:
            await asyncio.sleep(self.timeout_seconds)
            
            if self.status not in [NegotiationStatus.COMPLETED, NegotiationStatus.FAILED]:
                logger.warning(f"会话 {self.id} 超时")
                await self.timeout()
        except asyncio.CancelledError:
            pass
    
    async def collect_offer(self, offer: AgentOffer) -> bool:
        """
        收集Agent Offer
        
        Args:
            offer: Agent Offer
            
        Returns:
            是否收集成功
        """
        if offer.agent_id not in self.expected_agents:
            logger.warning(f"会话 {self.id} 收到未知Agent的Offer: {offer.agent_id}")
            return False
        
        if offer.agent_id in self.offers:
            logger.warning(f"会话 {self.id} 已收到Agent {offer.agent_id} 的Offer")
            return False
        
        self.offers[offer.agent_id] = offer
        self.status = NegotiationStatus.OFFERS_COLLECTING
        
        logger.info(
            f"会话 {self.id} 收到Offer: {offer.agent_name} "
            f"({len(self.offers)}/{len(self.expected_agents)})"
        )
        
        # 检查是否所有Agent都已响应
        if len(self.offers) >= len(self.expected_agents):
            self._barrier_event.set()
        
        return True
    
    async def wait_for_barrier(self) -> bool:
        """
        等待屏障（所有Agent响应或超时）
        
        Returns:
            是否收集到足够的Offer
        """
        try:
            await asyncio.wait_for(
                self._barrier_event.wait(),
                timeout=self.timeout_seconds
            )
            return len(self.offers) >= len(self.expected_agents)
        except asyncio.TimeoutError:
            return len(self.offers) > 0
    
    async def timeout(self):
        """超时处理"""
        if self._timeout_task:
            self._timeout_task.cancel()
        
        self.status = NegotiationStatus.TIMEOUT
        self.error_message = f"协商超时，只收到 {len(self.offers)}/{len(self.expected_agents)} 个响应"
        self.completed_at = datetime.now()
        logger.warning(f"会话 {self.id} 超时")
    
    async def fail(self, error_message: str):
        """失败处理"""
        if self._timeout_task:
            self._timeout_task.cancel()
        
        self.status = NegotiationStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.now()
        logger.error(f"会话 {self.id} 失败: {error_message}")
    
    async def complete(self, final_solution: Dict[str, Any]):
        """完成协商"""
        if self._timeout_task:
            self._timeout_task.cancel()
        
        self.status = NegotiationStatus.COMPLETED
        self.final_solution = final_solution
        self.completed_at = datetime.now()
        logger.info(f"会话 {self.id} 完成")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "requirement": self.requirement,
            "formulated_requirement": self.formulated_requirement,
            "status": self.status.value,
            "offers": [offer.to_dict() for offer in self.offers.values()],
            "final_solution": self.final_solution,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "expected_agents": len(self.expected_agents),
            "collected_offers": len(self.offers)
        }


class CenterCoordinator:
    """Center协调器"""
    
    def __init__(self):
        self.sessions: Dict[str, NegotiationSession] = {}
        self.llm = get_llm_provider()
    
    def create_session(
        self,
        user_id: str,
        requirement: str,
        formulated_requirement: Dict[str, Any],
        expected_agents: List[str],
        timeout_seconds: int = 300
    ) -> NegotiationSession:
        """
        创建协商会话
        
        Args:
            user_id: 用户ID
            requirement: 原始需求
            formulated_requirement: Formulation后的需求
            expected_agents: 预期参与的Agent ID列表
            timeout_seconds: 超时时间（秒）
            
        Returns:
            协商会话
        """
        session_id = str(uuid.uuid4())
        session = NegotiationSession(
            session_id=session_id,
            user_id=user_id,
            requirement=requirement,
            formulated_requirement=formulated_requirement,
            expected_agents=expected_agents,
            timeout_seconds=timeout_seconds
        )
        
        self.sessions[session_id] = session
        logger.info(f"创建会话 {session_id}")
        
        return session
    
    def get_session(self, session_id: str) -> Optional[NegotiationSession]:
        """获取会话"""
        return self.sessions.get(session_id)
    
    async def submit_offer(
        self,
        session_id: str,
        agent_id: str,
        agent_name: str,
        offer_content: Dict[str, Any],
        confidence: float,
        resonance_score: float
    ) -> bool:
        """
        提交Agent Offer
        
        Args:
            session_id: 会话ID
            agent_id: Agent ID
            agent_name: Agent名称
            offer_content: Offer内容
            confidence: 置信度
            resonance_score: 共振分数
            
        Returns:
            是否提交成功
        """
        session = self.get_session(session_id)
        if not session:
            logger.error(f"会话不存在: {session_id}")
            return False
        
        offer = AgentOffer(
            agent_id=agent_id,
            agent_name=agent_name,
            offer_content=offer_content,
            confidence=confidence,
            resonance_score=resonance_score
        )
        
        return await session.collect_offer(offer)
    
    async def wait_for_completion(self, session_id: str) -> NegotiationSession:
        """
        等待会话完成
        
        Args:
            session_id: 会话ID
            
        Returns:
            完成后的会话
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"会话不存在: {session_id}")
        
        await session.wait_for_barrier()
        
        # 处理结果
        if len(session.offers) == 0:
            await session.fail("没有收到任何Offer")
        elif len(session.offers) < len(session.expected_agents) // 2:
            await session.fail("收到的Offer数量不足")
        else:
            session.status = NegotiationStatus.CENTER_PROCESSING
            final_solution = await self._generate_final_solution(session)
            await session.complete(final_solution)
        
        return session
    
    async def _generate_final_solution(self, session: NegotiationSession) -> Dict[str, Any]:
        """
        生成最终方案
        
        Args:
            session: 协商会话
            
        Returns:
            最终方案
        """
        logger.info(f"生成会话 {session.id} 的最终方案")
        
        # 按共振分数排序
        sorted_offers = sorted(
            session.offers.values(),
            key=lambda o: o.resonance_score,
            reverse=True
        )
        
        # 选择Top 3 Offer
        top_offers = sorted_offers[:3]
        
        # 构建方案摘要
        solution = {
            "session_id": session.id,
            "recommendation": {
                "primary_agent": top_offers[0].to_dict(),
                "alternatives": [o.to_dict() for o in top_offers[1:]],
                "total_offers": len(session.offers),
                "selection_criteria": "基于共振分数、置信度和Agent满意度"
            },
            "summary": {
                "requirement": session.requirement,
                "formulated": session.formulated_requirement.get("enriched"),
                "matched_agents": len(session.offers),
                "best_match": top_offers[0].agent_name,
                "resonance_score": top_offers[0].resonance_score
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return solution
    
    def cleanup_session(self, session_id: str):
        """清理会话"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"清理会话 {session_id}")


# 全局协调器实例
center_coordinator = CenterCoordinator()
