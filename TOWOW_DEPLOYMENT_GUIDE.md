# 通爻协议真实部署指南

## 📋 部署前置条件

### 1. 必需的API密钥

| 密钥 | 用途 | 获取方式 |
|------|------|---------|
| `ZHIPU_API_KEY` | 需求Formulation (LLM) | https://open.bigmodel.cn/ |
| `SUPABASE_URL` | Agent数据存储 | Supabase Dashboard |
| `SUPABASE_KEY` | 数据库访问权限 | Supabase Settings |

### 2. 数据库要求

- Supabase 项目已创建
- pgvector 扩展已启用
- 执行过 `add_towow_tables.sql` 迁移脚本

### 3. Python依赖

```bash
pip install fastapi uvicorn httpx openai pydantic psycopg2-binary sentence-transformers
```

---

## 🚀 快速部署步骤

### 步骤1: 配置环境变量

创建 `python-service/.env` 文件：

```env
# LLM配置
LLM_PROVIDER=zhipu
ZHIPU_API_KEY=your-zhipu-api-key-here

# Supabase配置
SUPABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务配置
TOWOW_API_URL=http://localhost:8000
```

### 步骤2: 初始化数据库

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 执行 `supabase/migrations/add_towow_tables.sql`
4. 确认所有表和索引创建成功

### 步骤3: 同步Agent数据

```bash
cd python-service

# 启动服务（在另一个终端）
python main.py

# 在另一个终端同步Agent数据
curl -X POST http://localhost:8000/api/admin/sync-agents
```

预期输出：
```json
{
  "status": "success",
  "results": {
    "total": 8,
    "success": 8,
    "failed": 0,
    "errors": []
  }
}
```

### 步骤4: 配置前端

创建 `.env.local` 文件（项目根目录）：

```env
# 通爻服务地址
NEXT_PUBLIC_TOWOW_API_URL=http://localhost:8000
```

### 步骤5: 更新前端使用真实协商

编辑 `src/app/resonance/page.tsx`：

```tsx
// 将 ResonanceEngine 替换为 ResonanceEngineReal
import { ResonanceEngineReal } from '@/components/resonance-engine-real'

// 在组件中使用
<ResonanceEngineReal />
```

### 步骤6: 启动服务

```bash
# 终端1: 启动Python服务
cd python-service
python main.py

# 终端2: 启动Next.js
cd ..
npm run dev
```

### 步骤7: 测试

访问 `http://localhost:3000/resonance`，输入需求测试。

---

## 📊 数据流图

```
用户输入需求
    ↓
前端调用 POST /api/negotiation/start
    ↓
Python服务:
  1. LLM Formulation → 理解需求
  2. 向量编码 → 768维向量
  3. pgvector搜索 → 找到匹配Agent
  4. 创建Center会话
  5. 返回session_id
    ↓
前端轮询 GET /api/negotiation/{session_id}/status
    ↓
Python后台任务:
  1. 模拟Agent处理
  2. 生成Offer
  3. 提交到Center
  4. 等待所有Offer
  5. 生成最终方案
    ↓
前端显示最终结果
```

---

## 🔧 核心组件说明

### 1. agents_db.py - 真实Agent数据

包含8个预置Agent，每个都有：
- 技能列表（前端、后端、数据、法律等）
- 等级和满意度
- 响应时间
- 联系端点

### 2. agent_sync.py - 向量编码与存储

功能：
- 将Agent技能描述编码为768维向量
- 同步到Supabase的 `agents.profile_vector` 列
- 支持向量相似度搜索

关键方法：
```python
sync_service = AgentSyncService(supabase_url)
sync_service.sync_all_agents()  # 同步所有Agent
sync_service.search_agents_by_vector(vector)  # 搜索相似Agent
```

### 3. center_coordinator.py - Center协调器

功能：
- 创建协商会话
- 收集Agent Offer
- 等待屏障同步
- 生成最终方案

状态流转：
```
pending → negotiating → offers_collecting → center_processing → completed
            ↓               ↓                    ↓
        timeout         insufficient_offers    failed
```

### 4. main.py - API接口

新增接口：
- `POST /api/negotiation/start` - 启动协商
- `POST /api/negotiation/{session_id}/offer` - Agent提交Offer
- `GET /api/negotiation/{session_id}/status` - 查询状态
- `POST /api/admin/sync-agents` - 同步Agent数据

---

## 🧪 测试API

### 1. 健康检查

```bash
curl http://localhost:8000/health
```

### 2. 同步Agent

```bash
curl -X POST http://localhost:8000/api/admin/sync-agents
```

### 3. 启动协商

```bash
curl -X POST http://localhost:8000/api/negotiation/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-001",
    "requirement": "我需要审核一份跨境贸易合同",
    "k": 5
  }'
```

响应：
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "formulation": {
    "original": "我需要审核一份跨境贸易合同",
    "enriched": "需要一位具有法律专业背景的专家协助审核跨境贸易合同的合规性...",
    "keywords": ["合同审核", "法律咨询", "合规性检查", "跨境贸易"],
    "context": { ... },
    "confidence": 0.85
  },
  "matched_agents": [...],
  "status": "negotiating"
}
```

### 4. 查询状态

```bash
curl http://localhost:8000/api/negotiation/{session_id}/status
```

---

## 📝 真实Agent接入（进阶）

如果要让真实的Agent参与协商，Agent需要实现以下接口：

### Agent端实现

```python
import httpx

class MyAgent:
    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.towow_url = "http://localhost:8000"
    
    async def listen_for_negotiations(self):
        """监听协商请求（可以使用WebSocket）"""
        # 实现协商请求监听
        pass
    
    async def process_negotiation(self, session_id: str, requirement: str):
        """处理协商请求，生成Offer"""
        
        # 分析需求
        my_skills = self.analyze_requirement(requirement)
        
        # 生成Offer
        offer_content = {
            "offer": "我可以提供专业服务",
            "estimated_time": "30分钟",
            "estimated_cost": 5000,
            "reasoning": "我的技能匹配度很高"
        }
        
        # 提交Offer到Center
        await self.submit_offer(
            session_id,
            offer_content,
            confidence=0.9,
            resonance_score=0.85
        )
    
    async def submit_offer(self, session_id, offer_content, confidence, resonance_score):
        """提交Offer"""
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.towow_url}/api/negotiation/{session_id}/offer",
                json={
                    "agent_id": self.agent_id,
                    "agent_name": self.agent_name,
                    "offer_content": offer_content,
                    "confidence": confidence,
                    "resonance_score": resonance_score
                }
            )
    
    def analyze_requirement(self, requirement: str):
        """分析需求是否匹配自身技能"""
        # 实现需求分析逻辑
        return True

# 使用示例
agent = MyAgent("my-agent-001", "MyExpertAgent")
# agent.listen_for_negotiations()
```

---

## 🔍 故障排除

### 问题1: Agent同步失败

**症状**: `POST /api/admin/sync-agents` 返回错误

**解决方案**:
1. 检查 Supabase 连接字符串
2. 确认 pgvector 扩展已启用
3. 检查数据库权限

### 问题2: 向量搜索返回空结果

**症状**: `matched_agents` 为空数组

**解决方案**:
1. 确认Agent已同步到数据库
2. 检查 `profile_vector` 列是否有值
3. 调整 `min_score` 参数

### 问题3: LLM Formulation失败

**症状**: Formulation返回错误或空结果

**解决方案**:
1. 检查 `ZHIPU_API_KEY` 是否有效
2. 确认API额度充足
3. 查看Python服务日志

### 问题4: 协商超时

**症状**: 状态一直是 `negotiating`

**解决方案**:
1. 检查后台任务是否正常运行
2. 增加 `timeout_seconds` 参数
3. 查看 Center协调器日志

---

## 📈 性能优化

### 1. 向量索引

切换到 HNSW 索引（数据量大时）：

```sql
DROP INDEX idx_agents_profile_vector;
CREATE INDEX idx_agents_profile_vector 
ON agents USING hnsw (profile_vector vector_cosine_ops);
```

### 2. Agent缓存

`agent_projections` 表已实现缓存机制，6小时过期。

### 3. 批量同步

修改 `agents_db.py`，添加更多Agent，然后批量同步。

---

## 🎯 下一步扩展

1. **WebSocket实时通信** - 替代轮询，实时推送状态
2. **真实Agent注册** - Agent主动注册能力
3. **递归协商** - 处理复杂需求，创建子协商
4. **回声机制** - 从执行结果学习，更新Agent Profile
5. **多语言支持** - 支持英文等多语言需求

---

## 📞 技术支持

遇到问题？检查以下资源：
1. Python服务日志：`python main.py`
2. Supabase Dashboard：SQL Editor 查看数据
3. 浏览器开发者工具：Network 查看API调用
4. Next.js日志：`npm run dev` 输出

---

## 📚 相关文档

- [通爻协议架构说明](./TOWOW_INTEGRATION.md)
- [真实实现清单](./TOWOW_REAL_IMPLEMENTATION.md)
- [Supabase pgvector 文档](https://supabase.com/docs/guides/ai/vector-columns)
