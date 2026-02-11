'use client'

import { useState } from 'react'
import { TowowAPI } from '@/lib/towow-api'

export default function APITestPage() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testHealthCheck = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await TowowAPI.healthCheck()
      setResult(response)
      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const testNegotiation = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await TowowAPI.startNegotiation('test_user', '我需要一个技术合伙人', 3)
      setResult(response)
      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const testMigrate = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await TowowAPI.migrateDatabase()
      setResult(response)
      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  const testOAuth2Url = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await TowowAPI.getOAuth2AuthUrl()
      setResult(response)
      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={testHealthCheck}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test Health Check
          </button>

          <button
            onClick={testNegotiation}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test Negotiation
          </button>

          <button
            onClick={testMigrate}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test Database Migration
          </button>

          <button
            onClick={testOAuth2Url}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Test OAuth2 URL
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              status === 'success' ? 'bg-green-600' :
              status === 'error' ? 'bg-red-600' :
              status === 'loading' ? 'bg-yellow-600' :
              'bg-gray-700'
            }`}>
              {status}
            </div>
          </div>

          {error && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-red-400">Error</h2>
              <pre className="bg-red-900/50 p-4 rounded-lg overflow-auto">
                {error}
              </pre>
            </div>
          )}

          {result && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Result</h2>
              <pre className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
