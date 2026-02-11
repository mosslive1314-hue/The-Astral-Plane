import { ProfileData, HDCVector, Lens } from '@/types/hdc'
import { hdEncoder } from './encoder'

export interface ExperienceData {
  sessionId: string
  role: string
  task: string
  outcome: string
  performance: Record<string, any>
  timestamp: string
}

export abstract class ProfileDataSource {
  abstract getProfile(userId: string): Promise<ProfileData>
  abstract updateProfile(userId: string, experienceData: ExperienceData[]): Promise<boolean>
  abstract validateSource(): boolean
}

export class SecondMeDataSource extends ProfileDataSource {
  private token: string

  constructor(token: string) {
    super()
    this.token = token
  }

  async getProfile(userId: string): Promise<ProfileData> {
    const response = await fetch('/api/secondme/user/info', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch SecondMe profile')
    }

    const data = await response.json()

    return {
      userId: data.userId || userId,
      displayName: data.name || data.nickname || 'Unknown',
      skills: data.skills || [],
      experiences: this.extractExperiences(data),
      preferences: data.preferences || [],
      values: data.values || [],
      projects: data.projects || [],
      socialConnections: [],
      metadata: {
        source: 'secondme',
        avatar: data.avatar,
        bio: data.bio,
        email: data.email
      }
    }
  }

  async updateProfile(userId: string, experienceData: ExperienceData[]): Promise<boolean> {
    return true
  }

  validateSource(): boolean {
    return !!this.token
  }

  private extractExperiences(data: any): string[] {
    const experiences: string[] = []

    if (data.bio) {
      experiences.push(data.bio)
    }

    if (data.shades && Array.isArray(data.shades)) {
      experiences.push(...data.shades)
    }

    return experiences
  }
}

export class TemplateDataSource extends ProfileDataSource {
  private templateData: any

  constructor(templateData: any) {
    super()
    this.templateData = templateData
  }

  async getProfile(userId: string): Promise<ProfileData> {
    return {
      userId,
      displayName: this.templateData.displayName || 'Unknown',
      skills: this.templateData.skills || [],
      experiences: this.templateData.experiences || [],
      preferences: this.templateData.preferences || [],
      values: this.templateData.values || [],
      projects: this.templateData.projects || [],
      socialConnections: [],
      metadata: {
        source: 'template',
        description: this.templateData.description
      }
    }
  }

  async updateProfile(userId: string, experienceData: ExperienceData[]): Promise<boolean> {
    return true
  }

  validateSource(): boolean {
    return !!this.templateData && !!this.templateData.displayName
  }
}

export class Projector {
  static async project(
    dataSource: ProfileDataSource,
    userId: string,
    lens: Lens = { type: 'full_dimension' }
  ): Promise<HDCVector> {
    const profileData = await dataSource.getProfile(userId)

    if (lens.type === 'full_dimension') {
      return hdEncoder.encodeProfile(profileData)
    } else if (lens.type === 'focus') {
      return this.projectFocused(profileData, lens.domain)
    }

    throw new Error(`Unknown lens type: ${lens.type}`)
  }

  private static async projectFocused(
    profileData: ProfileData,
    domain?: string
  ): Promise<HDCVector> {
    if (!domain) {
      return hdEncoder.encodeProfile(profileData)
    }

    const focusedProfile: ProfileData = {
      ...profileData,
      skills: profileData.skills.filter(s => this.isRelevant(s, domain)),
      experiences: profileData.experiences.filter(e => this.isRelevant(e, domain)),
      preferences: profileData.preferences.filter(p => this.isRelevant(p, domain))
    }

    return hdEncoder.encodeProfile(focusedProfile)
  }

  private static isRelevant(text: string, domain: string): boolean {
    const keywords = this.getDomainKeywords(domain)
    const lowerText = text.toLowerCase()
    return keywords.some(keyword => lowerText.includes(keyword))
  }

  private static getDomainKeywords(domain: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'css', 'html', 'ui', 'ux'],
      'backend': ['python', 'node', 'java', 'go', 'api', 'database', 'server'],
      'ai': ['machine learning', 'deep learning', 'llm', 'ai', 'neural', 'model'],
      'design': ['ui', 'ux', 'figma', 'sketch', 'design', 'visual'],
      'data': ['sql', 'nosql', 'analytics', 'data', 'etl', 'pipeline']
    }

    return keywordMap[domain.toLowerCase()] || []
  }
}
