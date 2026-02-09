'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mic, MicOff, Send, Volume2, Bot, User, VolumeX } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// 模拟消息类型
type Message = {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export function CommandCenter() {
  const { agent, user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: '你好！我是你的 Second Me 代理。有什么我可以帮你的吗？我可以帮你管理任务、分析市场，或者只是聊聊天。',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 语音识别 (Web Speech API)
  const recognitionRef = useRef<any>(null)
  
  // 语音合成
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // 初始化语音识别
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.lang = 'zh-CN'
        recognitionRef.current.interimResults = false

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }

      // 初始化语音合成
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speak = (text: string) => {
    if (!synthRef.current) return

    if (isSpeaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.onend = () => setIsSpeaking(false)
    
    setIsSpeaking(true)
    synthRef.current.speak(utterance)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // 模拟 Agent 回复
    setTimeout(() => {
      let replyContent = '我收到了你的消息。'
      
      // 简单的规则匹配
      if (inputValue.includes('任务')) {
        replyContent = '你可以前往任务大厅查看最新悬赏，或者告诉我你想发布什么任务。'
      } else if (inputValue.includes('市场') || inputValue.includes('价格')) {
        replyContent = '技能市场目前波动较大，建议关注 Python 和 AI 相关技能的走势。'
      } else if (inputValue.includes('美帝奇') || inputValue.includes('创新')) {
        replyContent = '美帝奇效应可以帮你发现跨领域的创新点，试试在实验室里组合不同的技能节点。'
      } else {
        replyContent = `你刚才说的是: "${inputValue}"。作为一个智能代理，我正在学习如何更好地理解你。`
      }

      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: replyContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, replyMessage])
      
      // 自动朗读回复 (可选)
      // speak(replyContent)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* 聊天区域 */}
      <Card className="flex-1 bg-black/20 border-white/5 backdrop-blur-sm overflow-hidden flex flex-col mb-4">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 max-w-[80%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' 
                    ? "bg-purple-600" 
                    : "bg-gradient-to-br from-blue-500 to-cyan-500"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "bg-purple-600/20 text-purple-100 rounded-tr-none border border-purple-500/20"
                    : "bg-white/10 text-zinc-100 rounded-tl-none border border-white/5"
                )}>
                  {msg.content}
                  {msg.role === 'agent' && (
                    <button 
                      onClick={() => speak(msg.content)}
                      className="ml-2 inline-block align-middle text-zinc-500 hover:text-white transition-colors"
                    >
                      {isSpeaking && msg.content === window.speechSynthesis?.pending?.toString() ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* 输入区域 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入指令或消息..."
            className="bg-black/40 border-white/10 text-white pl-4 pr-12 h-12 rounded-xl focus-visible:ring-purple-500/50"
          />
          <button
            onClick={toggleListening}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
              isListening 
                ? "bg-red-500/20 text-red-400 animate-pulse" 
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            )}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        <Button 
          onClick={handleSendMessage}
          className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white p-0 flex items-center justify-center shadow-lg shadow-purple-900/20"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
