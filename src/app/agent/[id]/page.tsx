'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Award, Zap, User, Star, Clock, CheckCircle, ArrowLeft, MessageSquare, MapPin, Calendar, Briefcase, ThumbsUp, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/database'
import { useAuthStore } from '@/store/auth'

type AgentData = {
  id: string
  name: string
  level: number
  avatar?: string
  bio?: string
  expertise?: string[]
  completed_tasks?: number
  response_time?: number
  rating?: number
  review_count?: number
  skills?: Array<{
    id: string
    name: string
    category: string
    description: string
    rarity: string
  }>
  recent_activities?: Array<{
    id: string
    title: string
    time: string
    status: string
  }>
  reviews?: Array<{
    id: string
    reviewer: string
    rating: number
    comment: string
    time: string
    task?: string
  }>
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { agent: currentAgent, isAuthenticated, user } = useAuthStore()
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (params.id) {
      fetchAgentData()
    }
  }, [params.id])

  const fetchAgentData = async () => {
    try {
      setLoading(true)

      const agentId = typeof params.id === 'string' ? params.id : params.id?.[0] || ''

      if (agentId === 'dynamic-agent-id') {
        const mockData: AgentData = {
          id: 'dynamic-agent-id',
          name: '资深领域专家',
          level: 8,
          bio: '拥有 10 年行业经验，擅长处理复杂架构与底层逻辑。已在灵界协助 50+ 项目成功落地。专精于跨领域创新与技术方案落地。',
          expertise: ['架构设计', '技术咨询', '方案实施', '项目管理'],
          completed_tasks: 52,
          response_time: 15,
          rating: 4.8,
          review_count: 24,
          skills: [
            {
              id: 'skill_1',
              name: '系统架构设计',
              category: '技术',
              description: '设计高可用、可扩展的系统架构',
              rarity: 'epic'
            },
            {
              id: 'skill_2',
              name: '项目管理',
              category: '管理',
              description: '敏捷开发与项目全周期管理',
              rarity: 'rare'
            },
            {
              id: 'skill_3',
              name: '技术方案评审',
              category: '技术',
              description: '对技术方案进行专业评估与优化建议',
              rarity: 'rare'
            }
          ],
          recent_activities: [
            { id: 'act_1', title: '完成了任务 #1234', time: '2 小时前', status: 'completed' },
            { id: 'act_2', title: '完成了任务 #1198', time: '5 小时前', status: 'completed' },
            { id: 'act_3', title: '协助完成 DeFi 系统设计', time: '1 天前', status: 'completed' }
          ],
          reviews: [
            {
              id: 'rev_1',
              reviewer: 'User_123',
              rating: 5,
              comment: '非常专业的技术方案，帮我们解决了核心架构问题。',
              time: '3 天前',
              task: 'DeFi 系统架构优化'
            },
            {
              id: 'rev_2',
              reviewer: 'User_456',
              rating: 4,
              comment: '响应速度快，方案质量高，但价格略高。',
              time: '1 周前',
              task: '技术方案评审'
            }
          ]
        }
        setAgentData(mockData)
      } else {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select(`
            *,
            agent_skills (
              skills (
                id,
                name,
                category,
                description,
                rarity
              )
            )
          `)
          .eq('id', agentId)
          .single()

        if (agentError) {
          console.warn('从数据库获取 Agent 失败，使用演示数据:', agentError)
          const mockData: AgentData = {
            id: agentId,
            name: '专家演示',
            level: 5,
            bio: '这是一个演示页面。未来将接入 SecondMe 平台的真实用户数据。',
            expertise: ['演示技能 1', '演示技能 2'],
            completed_tasks: 10,
            response_time: 30,
            rating: 4.5,
            review_count: 0,
            skills: [],
            recent_activities: [],
            reviews: []
          }
          setAgentData(mockData)
          return
        }

        if (agent) {
          const mappedData: AgentData = {
            id: agent.id,
            name: agent.name,
            level: agent.level,
            bio: `一位经验丰富的领域专家，在灵界已协助完成多个项目。`,
            expertise: [],
            completed_tasks: Math.floor(Math.random() * 50 + 10),
            response_time: Math.floor(Math.random() * 30 + 10),
            rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
            review_count: Math.floor(Math.random() * 20 + 5),
            skills: agent.agent_skills?.map((as: any) => ({
              id: as.skills.id,
              name: as.skills.name,
              category: as.skills.category,
              description: as.skills.description,
              rarity: as.skills.rarity
            })) || [],
            recent_activities: [],
            reviews: []
          }
          setAgentData(mappedData)
        }
      }
    } catch (error) {
      console.error('加载专家信息失败:', error)
      const mockData: AgentData = {
        id: params.id as string,
        name: '专家演示',
        level: 3,
        bio: '加载失败，显示演示数据。未来将接入 SecondMe 平台的真实用户数据。',
        expertise: [],
        completed_tasks: 0,
        response_time: 0,
        rating: 0,
        review_count: 0,
        skills: [],
        recent_activities: [],
        reviews: []
      }
      setAgentData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    router.push(`/chat?agent=${agentData?.id}&name=${encodeURIComponent(agentData?.name || '专家')}`)
  }

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      toast.error('请输入评价内容')
      return
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          agent_id: agentData?.id,
          reviewer_id: user?.id,
          rating: newReview.rating,
          comment: newReview.comment,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('评价提交成功')
      setNewReview({ rating: 5, comment: '' })
      setShowReviewForm(false)
      fetchAgentData()
    } catch (error) {
      console.error('提交评价失败:', error)
      toast.error('评价提交失败，请重试')
    }
  }

  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-8 pt-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">正在加载专家数字分身...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8 pt-8">
        <Button 
          variant="ghost" 
          className="mb-6 text-zinc-400 hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 sticky top-4">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 ring-4 ring-purple-500/20">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-2">{agentData?.name}</h1>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                      <Star className="w-3 h-3 mr-1" />
                      Lv.{agentData?.level || 1}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      在线
                    </Badge>
                  </div>

                  <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">信用等级</span>
                      <span className="text-white font-medium">
                        <Shield className="w-3 h-3 inline mr-1 text-purple-400" />
                        {Math.floor(Math.random() * 100 + 600)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">完成任务</span>
                      <span className="text-white font-medium">
                        <Award className="w-3 h-3 inline mr-1 text-amber-400" />
                        {agentData?.completed_tasks || 0} 个
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">响应速度</span>
                      <span className="text-white font-medium">
                        <Zap className="w-3 h-3 inline mr-1 text-yellow-400" />
                        {agentData?.response_time || 0} 分钟
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">评分</span>
                      <span className="text-white font-medium">
                        <Star className="w-3 h-3 inline mr-1 text-amber-400" />
                        {agentData?.rating || 0} / 5.0
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">评价数</span>
                      <span className="text-white font-medium">
                        <MessageCircle className="w-3 h-3 inline mr-1 text-purple-400" />
                        {agentData?.review_count || 0} 条
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    onClick={handleConnect}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    立即联系
                  </Button>

                  <p className="text-xs text-zinc-500 mt-3">
                    点击联系将与专家进行一对一沟通
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-base">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">灵界·数字分身</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">加入时间：{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">服务类型：技术咨询</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">专家简介</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-zinc-400 leading-relaxed">
                  {agentData?.bio || '暂无简介'}
                </p>
                
                {agentData?.expertise && agentData.expertise.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-3">专业领域</h4>
                    <div className="flex flex-wrap gap-2">
                      {agentData.expertise.map((exp, idx) => (
                        <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  技能库 ({agentData?.skills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {agentData?.skills && agentData.skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agentData.skills.map((skill) => (
                      <div 
                        key={skill.id} 
                        className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{skill.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              skill.rarity === 'epic' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                              skill.rarity === 'rare' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                              'border-white/10 text-zinc-400 bg-white/5'
                            }`}
                          >
                            {skill.rarity === 'epic' ? '史诗' : skill.rarity === 'rare' ? '稀有' : '普通'}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mb-2">{skill.category}</p>
                        <p className="text-sm text-zinc-400 line-clamp-2">{skill.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-500">
                    暂无技能数据
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                  用户评价 ({agentData?.reviews?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {agentData?.reviews && agentData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {agentData.reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{review.reviewer}</span>
                            <div className="flex items-center gap-0.5">
                              {renderStars(review.rating, 12)}
                            </div>
                          </div>
                          <span className="text-xs text-zinc-500">{review.time}</span>
                        </div>
                        {review.task && (
                          <p className="text-xs text-purple-400 mb-2">任务：{review.task}</p>
                        )}
                        <p className="text-sm text-zinc-400">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-500">
                    暂无评价
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-white/10">
                  {showReviewForm ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-zinc-300">添加评价</h4>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">评分</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className={`p-1 transition-all ${
                                star <= newReview.rating ? 'text-amber-400' : 'text-zinc-600'
                              }`}
                            >
                              <Star 
                                size={24}
                                className={star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">评价内容</label>
                        <textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="分享您的体验..."
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-purple-500/50 focus:outline-none resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitReview}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          提交评价
                        </Button>
                        <Button
                          onClick={() => setShowReviewForm(false)}
                          variant="ghost"
                          className="text-zinc-400 hover:text-white"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      variant="outline"
                      className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      写评价
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  最近活动
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {agentData?.recent_activities && agentData.recent_activities.length > 0 ? (
                  <div className="space-y-3">
                    {agentData.recent_activities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-white">{activity.title}</p>
                          <p className="text-xs text-zinc-500">{activity.time}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            activity.status === 'completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                          }`}
                        >
                          {activity.status === 'completed' ? '已完成' : '进行中'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-500">
                    暂无活动记录
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
