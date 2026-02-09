import { API_CONFIG } from './constants'
import type { OAuthTokens } from '@/types'

export interface Note {
  id: string
  title: string
  content: string
  tags?: string[]
  created_at: number
  updated_at: number
}

export async function createNote(
  tokens: OAuthTokens,
  data: { title: string; content: string; tags?: string[] }
): Promise<Note> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create note')
  }

  return response.json()
}

export async function getNotes(tokens: OAuthTokens): Promise<Note[]> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/notes`, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch notes')
  }

  const data = await response.json()
  return data.notes || data || []
}

export async function updateNote(
  tokens: OAuthTokens,
  noteId: string,
  data: { title?: string; content?: string; tags?: string[] }
): Promise<Note> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access_token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update note')
  }

  return response.json()
}

export async function deleteNote(tokens: OAuthTokens, noteId: string): Promise<void> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete note')
  }
}
