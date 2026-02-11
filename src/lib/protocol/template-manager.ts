import { SceneTemplate } from '@/types/scene'

export interface TemplateCategory {
  id: string
  name: string
  description: string
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'hackathon', name: '黑客松', description: '黑客松活动场景' },
  { id: 'startup', name: '创业社区', description: '创业社区场景' },
  { id: 'enterprise', name: '企业内部', description: '企业内部协作场景' },
  { id: 'education', name: '教育', description: '教育培训场景' },
  { id: 'creative', name: '创意', description: '创意协作场景' }
]

export class TemplateManager {
  private templates: Map<string, SceneTemplate> = new Map()

  registerTemplate(template: SceneTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplate(templateId: string): SceneTemplate | undefined {
    return this.templates.get(templateId)
  }

  getAllTemplates(): SceneTemplate[] {
    return Array.from(this.templates.values())
  }

  getTemplatesByCategory(categoryId: string): SceneTemplate[] {
    return this.getAllTemplates().filter(
      t => t.customMetadata?.category === categoryId
    )
  }

  createTemplate(config: {
    id: string
    name: string
    description: string
    version: string
    requiredFields: string[]
    optionalFields: string[]
    category?: string
    customMetadata?: Record<string, any>
  }): SceneTemplate {
    const template: SceneTemplate = {
      id: config.id,
      name: config.name,
      description: config.description,
      version: config.version,
      requiredFields: config.requiredFields,
      optionalFields: config.optionalFields,
      customMetadata: {
        ...config.customMetadata,
        category: config.category
      }
    }

    this.registerTemplate(template)
    return template
  }

  validateProfileData(templateId: string, profileData: Record<string, any>): {
    valid: boolean
    missingFields: string[]
    errors: string[]
  } {
    const template = this.getTemplate(templateId)
    if (!template) {
      return {
        valid: false,
        missingFields: [],
        errors: ['Template not found']
      }
    }

    const missingFields: string[] = []
    const errors: string[] = []

    for (const field of template.requiredFields) {
      if (!(field in profileData) || profileData[field] === undefined || profileData[field] === null) {
        missingFields.push(field)
      }
    }

    return {
      valid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors
    }
  }

  initializeDefaultTemplates(): void {
    this.createTemplate({
      id: 'hackathon-basic',
      name: '黑客松基础模板',
      description: '适用于黑客松活动的基础场景模板',
      version: '1.0.0',
      category: 'hackathon',
      requiredFields: ['skills', 'experienceLevel'],
      optionalFields: ['projectHistory', 'preferredRoles', 'availability'],
      customMetadata: {
        category: 'hackathon',
        maxParticipants: 50,
        suggestedK: 5
      }
    })

    this.createTemplate({
      id: 'startup-community',
      name: '创业社区模板',
      description: '适用于创业社区协作的场景模板',
      version: '1.0.0',
      category: 'startup',
      requiredFields: ['skills', 'industryExperience'],
      optionalFields: ['startupExperience', 'preferredFocus', 'timeCommitment'],
      customMetadata: {
        category: 'startup',
        maxParticipants: 100,
        suggestedK: 10
      }
    })

    this.createTemplate({
      id: 'enterprise-internal',
      name: '企业内部协作模板',
      description: '适用于企业内部团队协作的场景模板',
      version: '1.0.0',
      category: 'enterprise',
      requiredFields: ['department', 'role', 'skills'],
      optionalFields: ['projects', 'expertiseAreas', 'mentorship'],
      customMetadata: {
        category: 'enterprise',
        maxParticipants: 200,
        suggestedK: 15
      }
    })

    this.createTemplate({
      id: 'education-workshop',
      name: '教育工作坊模板',
      description: '适用于教育培训工作坊的场景模板',
      version: '1.0.0',
      category: 'education',
      requiredFields: ['teachingExperience', 'subjectExpertise'],
      optionalFields: ['learningGoals', 'preferredTeachingStyle', 'materials'],
      customMetadata: {
        category: 'education',
        maxParticipants: 30,
        suggestedK: 5
      }
    })

    this.createTemplate({
      id: 'creative-collab',
      name: '创意协作模板',
      description: '适用于创意项目协作的场景模板',
      version: '1.0.0',
      category: 'creative',
      requiredFields: ['creativeSkills', 'portfolio'],
      optionalFields: ['collaborationStyle', 'preferredTools', 'inspiration'],
      customMetadata: {
        category: 'creative',
        maxParticipants: 20,
        suggestedK: 8
      }
    })
  }

  getSuggestedKForTemplate(templateId: string): number | null {
    const template = this.getTemplate(templateId)
    return template?.customMetadata?.suggestedK || null
  }

  getMaxParticipantsForTemplate(templateId: string): number | null {
    const template = this.getTemplate(templateId)
    return template?.customMetadata?.maxParticipants || null
  }
}

export const templateManager = new TemplateManager()
