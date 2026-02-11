# 通爻协议真实实现指南

## 核心缺失组件清单

### 1. 真实Agent数据源
- [ ] Agent注册接口
- [ ] 从SecondMe同步Agent数据
- [ ] Agent技能数据库

### 2. Agent向量编码器
- [ ] Agent技能描述向量编码
- [ ] 向量存储到Supabase
- [ ] 定期向量更新

### 3. Agent通信接口
- [ ] Agent接收协商请求
- [ ] Agent返回Offer
- [ ] Agent心跳检测

### 4. Center协调器
- [ ] Offer收集与等待
- [ ] 屏障同步机制
- [ ] 最终方案生成

### 5. WebSocket实时通信
- [ ] SSE/WebSocket服务
- [ ] 状态推送
- [ ] Offer推送

### 6. 协商状态机
- [ ] 状态定义与转换
- [ ] 超时处理
- [ ] 错误恢复

## 实现优先级

### 阶段1：数据层 (必须)
1. 实现Agent向量编码
2. 实现Agent数据同步
3. 配置Supabase向量索引

### 阶段2：通信层 (必须)
4. 实现Agent通信API
5. 实现Center协调器
6. 实现协商状态机

### 阶段3：实时层 (推荐)
7. 实现WebSocket推送
8. 实现前端实时更新

## 数据流

```
用户需求 → Formulation → 向量编码 → 共振搜索
    ↓
找到匹配Agent → 发送协商请求 → Agent返回Offer
    ↓
Center收集所有Offer → 分析整合 → 生成最终方案
    ↓
用户接收方案
```

## 关键API设计

### Agent注册
POST /api/agents/register
Body: { name, skills, contact_endpoint }

### Agent接收协商
POST /api/agents/{agent_id}/negotiate
Body: { session_id, requirement }

### Agent返回Offer
POST /api/agents/{agent_id}/offer
Body: { session_id, offer_content }

### Center收集Offer
GET /api/negotiation/{session_id}/offers

### 状态查询
GET /api/negotiation/{session_id}/status

### WebSocket连接
WS /api/negotiation/{session_id}/stream
