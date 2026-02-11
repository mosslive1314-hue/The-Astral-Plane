"""
SecondMe OAuth2 Client for AgentCraft
集成 SecondMe 的认证和用户数据获取
"""
from __future__ import annotations

import base64
import hashlib
import logging
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

SECONDME_OAUTH_URL = "https://app.mindos.com/gate/lab"
SECONDME_API_URL = "https://app.mindos.com/gate/lab/api/secondme"
APP_ID = "agentcraft"
APP_SECRET = "agentcraft_secret"

class SecondMeUserInfo(BaseModel):
    user_id: str
    nickname: str
    avatar: Optional[str] = None
    email: Optional[str] = None

class ShadesResponse(BaseModel):
    tags: list[str]
    categories: dict[str, list[str]]
    updated_at: datetime

class SoftMemoryResponse(BaseModel):
    facts: list[dict[str, Any]]
    relationships: list[dict[str, Any]]
    preferences: list[dict[str, Any]]
    updated_at: datetime

class SecondMeOAuth2Client:
    """
    SecondMe OAuth2 客户端
    """
    
    def __init__(
        self,
        app_id: str = APP_ID,
        app_secret: str = APP_SECRET,
        timeout: int = 30,
    ):
        self.app_id = app_id
        self.app_secret = app_secret
        self.timeout = timeout
        self._http_client: Optional[httpx.AsyncClient] = None
    
    @property
    def http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=self.timeout)
        return self._http_client
    
    async def get_authorization_url(
        self,
        redirect_uri: str,
        state: Optional[str] = None,
    ) -> str:
        """
        生成 OAuth2 授权URL
        """
        auth_url = f"{SECONDME_OAUTH_URL}/oauth"
        params = {
            "response_type": "code",
            "client_id": self.app_id,
            "redirect_uri": redirect_uri,
            "state": state or "random_state",
        }
        
        url = f"{auth_url}?{self._build_query_string(params)}"
        logger.info(f"Generated OAuth2 authorization URL: {url}")
        return url
    
    async def exchange_code_for_token(
        self,
        code: str,
        redirect_uri: str,
    ) -> dict[str, Any]:
        """
        用授权码交换访问令牌
        """
        token_url = f"{SECONDME_OAUTH_URL}/oauth/token"
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "redirect_uri": redirect_uri,
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        response = await self.http_client.post(token_url, data=data, headers=headers)
        response.raise_for_status()
        
        token_data = response.json()
        logger.info(f"Token exchange successful, user_id: {token_data.get('user_id', 'unknown')}")
        return token_data
    
    async def get_user_info(
        self,
        access_token: str,
    ) -> SecondMeUserInfo:
        """
        获取用户基本信息
        """
        url = f"{SECONDME_API_URL}/user/info"
        headers = {
            "Authorization": f"Bearer {access_token}",
        }
        
        response = await self.http_client.get(url, headers=headers)
        response.raise_for_status()
        
        user_data = response.json()
        return SecondMeUserInfo(
            user_id=user_data.get("user_id", ""),
            nickname=user_data.get("nickname", ""),
            avatar=user_data.get("avatar"),
            email=user_data.get("email"),
        )
    
    async def get_shades(
        self,
        access_token: str,
    ) -> ShadesResponse:
        """
        获取用户 Shades（兴趣标签）
        """
        url = f"{SECONDME_API_URL}/user/shades"
        headers = {
            "Authorization": f"Bearer {access_token}",
        }
        
        response = await self.http_client.get(url, headers=headers)
        response.raise_for_status()
        
        shades_data = response.json()
        return ShadesResponse(
            tags=shades_data.get("tags", []),
            categories=shades_data.get("categories", {}),
            updated_at=datetime.now(),
        )
    
    async def get_soft_memory(
        self,
        access_token: str,
    ) -> SoftMemoryResponse:
        """
        获取用户 Soft Memory（事实性记忆）
        """
        url = f"{SECONDME_API_URL}/user/softmemory"
        headers = {
            "Authorization": f"Bearer {access_token}",
        }
        
        response = await self.http_client.get(url, headers=headers)
        response.raise_for_status()
        
        memory_data = response.json()
        return SoftMemoryResponse(
            facts=memory_data.get("facts", []),
            relationships=memory_data.get("relationships", []),
            preferences=memory_data.get("preferences", []),
            updated_at=datetime.now(),
        )
    
    async def refresh_token(
        self,
        refresh_token: str,
    ) -> dict[str, Any]:
        """
        刷新访问令牌
        """
        token_url = f"{SECONDME_OAUTH_URL}/oauth/token"
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.app_id,
            "client_secret": self.app_secret,
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        response = await self.http_client.post(token_url, data=data, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    @staticmethod
    def _build_query_string(params: Dict[str, Any]) -> str:
        """
        构建查询字符串
        """
        return "&".join(f"{k}={v}" for k, v in params.items())
    
    async def close(self):
        """
        关闭 HTTP 客户端
        """
        if self._http_client:
            try:
                await self._http_client.aclose()
            except Exception as e:
                logger.warning(f"Failed to close HTTP client: {e}")
            finally:
                self._http_client = None


async def verify_token_signature(
    access_token: str,
    app_secret: str,
) -> bool:
    """
    验证令牌签名（如果 API 支持）
    """
    try:
        payload = access_token.split(".")[1] if "." in access_token else ""
        expected_signature = hashlib.sha256(
            f"{payload}.{app_secret}".encode()
        ).hexdigest()
        return expected_signature in access_token
    except Exception as e:
        logger.warning(f"Token signature verification failed: {e}")
        return False
