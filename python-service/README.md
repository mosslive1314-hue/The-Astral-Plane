# 通爻协议集成服务

这是灵界项目集成的通爻协议后端服务，使用FastAPI + Python实现。

## 功能

1. **SecondMe API集成**（只读）
   - 获取用户数字分身信息
   - 访问用户软记忆

2. **需求Formulation（丰富化）**
   - 使用LLM理解并丰富用户需求
   - 识别隐含需求和关键词
   - 提供置信度评分

3. **向量编码**
   - 使用Sentence-Transformers将文本编码为向量
   - 优化中文支持（shibing624/text2vec-base-chinese）

4. **Agent共振机制**
   - 基于向量相似度查找匹配的Agent
   - 简单版本：按技能匹配
   - 支持扩展到复杂投影透镜

5. **协商会话管理**
   - 创建和管理协商会话
   - 记录Agent Offer
   - 状态追踪

## 快速开始

### 1. 配置环境变量

```bash
cd python-service
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# Supabase配置
SUPABASE_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API密钥
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. 启动服务（Docker）

```bash
cd python-service
docker-compose up -d
```

服务将在 `http://localhost:8000` 启动

### 3. 启动服务（本地Python环境）

```bash
cd python-service
pip install -r requirements.txt
python main.py
```

### 4. 验证服务

访问 `http://localhost:8000/docs` 查看API文档

或使用curl测试：

```bash
# 健康检查
curl http://localhost:8000/health

# 向量编码
curl -X POST http://localhost:8000/api/encode/vector \
  -H "Content-Type: application/json" \
  -d '{"text": "我需要审核一份合同"}'

# 需求Formulation
curl -X POST http://localhost:8000/api/formulate/requirement \
  -H "Content-Type: application/json" \
  -d '{"original": "我需要审核一份合同"}'
```

## API端点

### 健康检查
- `GET /` - 服务信息
- `GET /health` - 健康状态

### SecondMe集成
- `POST /api/secondme/user/info` - 获取用户信息
  - Header: `Authorization: Bearer {token}`

### 向量编码
- `POST /api/encode/vector` - 文本转向量
  - Body: `{ "text": "...", "model": "sentence-transformers" }`

### 需求Formulation
- `POST /api/formulate/requirement` - 需求丰富化
  - Body: `{ "original": "..." }`

### Agent共振
- `POST /api/negotiation/resonate` - 查找共振Agent
  - Body: `{ "requirement_vector": [...], "limit": 10, "min_confidence": 0.3 }`

### 协商会话
- `POST /api/negotiation/session` - 创建协商会话
  - Body: `{ "user_id": "...", "requirement": "..." }`

## 数据库准备

在启动服务前，需要先在Supabase中执行表结构迁移：

```sql
-- 执行 supabase/migrations/add_towow_tables.sql
```

这会创建以下表：
- `negotiation_sessions` - 协商会话
- `agent_offers` - Agent Offer
- `projection_lenses` - 投影透镜配置
- `agent_projections` - Agent投影缓存
- `sub_requirements` - 子需求（递归用）

并扩展以下表：
- `agents` - 添加向量、透镜、在线状态等字段
- `users` - 添加OAuth相关字段

## 技术栈

- **FastAPI** - Web框架
- **Sentence-Transformers** - 向量编码（中文优化）
- **OpenAI API** - 需求Formulation
- **Supabase (PostgreSQL + pgvector)** - 数据库
- **Docker** - 容器化部署

## 投影透镜系统

已预置3个渐进式投影透镜：

1. **基础透镜**（默认）
   - 只按技能名称和类别匹配
   - 权重：skill_name: 1.0, skill_category: 1.0

2. **经验透镜**
   - 考虑Agent等级和信用评分
   - 权重：skill_name: 0.8, skill_category: 0.8, agent_level: 0.5, credit_score: 0.3
   - 过滤：min_level: 1

3. **响应透镜**
   - 优先考虑响应速度和在线状态
   - 权重：skill_name: 0.7, skill_category: 0.7, response_time: 0.8, active: 1.0
   - 过滤：active_only: true

## 扩展点

### 支持更多向量模型
在 `encode_vector` 函数中修改 `model_name`：

```python
model_name = "paraphrase-multilingual-MiniLM-L12-v2"  # 多语言
# 或
model_name = "all-MiniLM-L6-v2"  # 通用
```

### 自定义Formulation逻辑
修改 `/api/formulate/requirement` 中的 `system_prompt` 来调整需求分析逻辑。

### 实现复杂的投影透镜
在 `projection_lenses` 表中添加新透镜，并在 `find_resonating_agents` 中实现对应的权重计算逻辑。

### 集成SecondMe OAuth
实现完整的OAuth2流程来获取用户授权：
1. 重定向到授权页面
2. 获取授权码
3. 换取Access Token
4. 调用API

## 性能优化

1. **向量索引**
   - 已在迁移脚本中创建ivfflat索引
   - 支持余弦相似度搜索

2. **Agent投影缓存**
   - `agent_projections` 表缓存Agent投影
   - 过期时间：6小时
   - 自动清理过期数据

3. **Docker层优化**
   - 使用Python slim镜像减小体积
   - 预安装系统依赖
   - 模型缓存到 `/app/models`

## 监控

查看服务日志：

```bash
docker-compose logs -f towow-service
```

## 故障排除

### 模型下载慢
首次启动会下载向量模型（约400MB），需要几分钟。可以手动下载到 `./models` 目录。

### Supabase连接失败
检查：
1. `SUPABASE_URL` 格式是否正确
2. 数据库是否启用了pgvector扩展
3. 是否执行了表迁移脚本

### OpenAI API错误
检查：
1. `OPENAI_API_KEY` 是否有效
2. API额度是否充足
3. 网络连接是否正常

## 后续计划

1. 实现完整的Center协调逻辑
2. 实现递归协商
3. 添加WebSocket实时通信
4. 实现"回声"机制（从结果学习）
5. 支持更多投影透镜
6. 优化向量搜索性能
