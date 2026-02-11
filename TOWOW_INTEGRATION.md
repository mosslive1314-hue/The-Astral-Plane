# 通爻协议集成部署指南

本指南帮助你部署灵界的通爻协议集成服务。

## 架构概览

```
┌─────────────────────────────────────────────┐
│           灵界前端 (Next.js)              │
│    - 用户界面                            │
│    - 需求输入（灵波）                    │
│    - 结果展示                            │
└────────────────┬────────────────────────────┘
                 │ HTTP调用
                 ▼
┌─────────────────────────────────────────────┐
│      通爻协商服务 (Python/FastAPI)        │
│    - 需求Formulation                    │
│    - 向量编码                            │
│    - Agent共振搜索                        │
│    - SecondMe API集成                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Supabase (PostgreSQL + pgvector)      │
│    - Agent数据                           │
│    - 向量索引                            │
│    - 协商会话记录                        │
└─────────────────────────────────────────────┘
```

## 前置要求

1. **Docker已安装**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Supabase项目已创建**
   - 确保Supabase项目启用了pgvector扩展
   - 记录数据库连接信息

3. **OpenAI API密钥**（用于需求Formulation）
   - 访问 https://platform.openai.com/api-keys
   - 创建新的API密钥

4. **SecondMe应用已注册**（可选）
   - 访问 SecondMe后台
   - 创建OAuth2应用
   - 获取Client ID和Client Secret

## 部署步骤

### 步骤1：准备Supabase数据库

1. 登录Supabase Dashboard
2. 进入 **SQL Editor**
3. 打开文件 `supabase/migrations/add_towow_tables.sql`
4. 复制全部SQL内容
5. 点击 **Run** 执行
6. 确认所有表和索引创建成功

### 步骤2：配置环境变量

编辑 `python-service/.env` 文件：

```env
# Supabase配置（从你的项目Dashboard获取）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API密钥
OPENAI_API_KEY=sk-your-openai-api-key

# 通爻服务URL（如果部署到其他端口，修改此处）
TOWOW_API_URL=http://localhost:8000
```

### 步骤3：启动通爻服务

#### 方式A：使用Docker（推荐）

```bash
cd python-service
docker-compose up -d
```

查看服务状态：

```bash
docker-compose logs -f towow-service
```

服务将在 `http://localhost:8000` 启动

#### 方式B：本地Python环境

```bash
cd python-service

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

### 步骤4：验证服务

访问 `http://localhost:8000/docs` 查看API文档

或使用curl测试：

```bash
# 健康检查
curl http://localhost:8000/health

# 测试向量编码
curl -X POST http://localhost:8000/api/encode/vector \
  -H "Content-Type: application/json" \
  -d '{"text": "测试文本编码"}'

# 测试需求Formulation
curl -X POST http://localhost:8000/api/formulate/requirement \
  -H "Content-Type: application/json" \
  -d '{"original": "我需要审核一份合同"}'
```

### 步骤5：更新灵界前端配置

在灵界根目录创建 `.env.local` 文件（如果不存在）：

```env
# 通爻服务地址
NEXT_PUBLIC_TOWOW_API_URL=http://localhost:8000
```

### 步骤6：重启灵界前端

```bash
cd agentcraft
npm run dev
```

访问 `http://localhost:3000` 测试完整流程。

## 使用指南

### 测试灵波功能（通爻集成版）

1. 访问灵界首页
2. 在灵波输入框中输入需求：
   ```
   我需要审核一份跨境贸易的法律合同
   ```
3. 点击"广播"按钮
4. 等待通爻协议处理：
   - 需求Formulation（LLM分析）
   - 向量编码
   - Agent共振搜索
5. 查看结果：
   - Formulation结果：理解的需求、关键词、置信度
   - 共振Agent列表：按共振分数排序

### 查看Agent详情

1. 点击任意Agent卡片
2. 跳转到Agent详情页
3. 查看：
   - 基本信息（姓名、等级、信用）
   - 技能库
   - 最近活动
4. 点击"立即联系"进入专家聊天

### 发布悬赏

1. 点击"方案"卡片
2. 跳转到发布悬赏页面
3. 填写详细信息
4. 发布任务

## 故障排除

### 1. Docker容器启动失败

**症状**：`docker-compose up -d` 报错

**解决方案**：
```bash
# 查看详细日志
docker-compose logs

# 清理旧容器
docker-compose down -v
docker-compose up -d
```

### 2. 向量模型下载慢

**症状**：首次启动需要很久，日志显示"下载模型"

**解决方案**：
- 这是正常的，模型约400MB
- 可以手动下载到 `python-service/models` 目录
- 或使用Docker卷缓存模型

### 3. Supabase连接失败

**症状**：API返回500错误，日志显示数据库连接失败

**解决方案**：
1. 检查 `python-service/.env` 中的 `SUPABASE_URL` 格式
2. 确认Supabase项目已启用pgvector扩展
3. 确认执行了表迁移脚本

### 4. OpenAI API错误

**症状**：需求Formulation返回500错误

**解决方案**：
1. 检查 `OPENAI_API_KEY` 是否有效
2. 检查API额度是否充足
3. 查看OpenAI Dashboard是否有异常记录

### 5. 前端无法连接通爻服务

**症状**：灵波点击广播后报错"连接失败"

**解决方案**：
1. 确认通爻服务正在运行：`curl http://localhost:8000/health`
2. 检查防火墙设置
3. 确认 `NEXT_PUBLIC_TOWOW_API_URL` 配置正确

## 性能优化建议

### 1. 向量索引优化

已在迁移脚本中创建ivfflat索引。如果数据量大（>10万条），可以切换到HNSW索引：

```sql
DROP INDEX idx_agents_profile_vector;
CREATE INDEX idx_agents_profile_vector ON agents USING hnsw (profile_vector vector_cosine_ops);
```

### 2. Agent投影缓存

`agent_projections` 表缓存Agent投影6小时，避免频繁从SecondMe拉取。

定期清理过期数据：

```sql
SELECT cleanup_expired_projections();
```

### 3. Docker资源限制

如果性能不足，可以在 `docker-compose.yml` 中增加资源限制：

```yaml
services:
  towow-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## 监控

### 查看服务日志

```bash
# Docker方式
docker-compose logs -f towow-service

# Python方式
python main.py  # 日志直接输出到终端
```

### 性能监控

在FastAPI中可以添加Prometheus监控（TODO）。

## 下一步

1. **集成SecondMe OAuth**
   - 实现完整的授权流程
   - 获取用户Access Token
   - 调用SecondMe API

2. **实现Center协调逻辑**
   - 收集Agent Offer
   - 等待屏障（所有Offer收集完成）
   - 生成最终方案

3. **实现递归协商**
   - 检测需求缺口
   - 创建子需求
   - 递归处理

4. **WebSocket实时通信**
   - Agent实时响应
   - 用户实时查看进度
   - 推送通知

5. **回声机制**
   - 从执行结果学习
   - 更新Agent Profile
   - 优化未来匹配

## 技术支持

如遇到问题，请检查：
1. 通爻服务日志：`docker-compose logs -f towow-service`
2. Supabase Dashboard：SQL Editor查看数据
3. 浏览器开发者工具：Network查看API调用
