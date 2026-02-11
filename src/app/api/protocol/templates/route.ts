import { NextRequest, NextResponse } from 'next/server'
import { templateManager, TEMPLATE_CATEGORIES } from '@/lib/protocol/template-manager'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId') || undefined
    const action = url.searchParams.get('action')

    if (action === 'categories') {
      return NextResponse.json({ success: true, categories: TEMPLATE_CATEGORIES })
    }

    if (action === 'validate') {
      const templateId = url.searchParams.get('templateId')
      const profileData = JSON.parse(url.searchParams.get('profileData') || '{}')

      if (!templateId) {
        return NextResponse.json(
          { success: false, error: 'Template ID required' },
          { status: 400 }
        )
      }

      const validation = templateManager.validateProfileData(templateId, profileData)
      return NextResponse.json({ success: true, validation })
    }

    let templates = templateManager.getAllTemplates()

    if (categoryId) {
      templates = templateManager.getTemplatesByCategory(categoryId)
    }

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('[Template API] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, description, version, requiredFields, optionalFields, category, customMetadata } = await request.json()

    if (!id || !name || !version) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const template = templateManager.createTemplate({
      id,
      name,
      description,
      version,
      requiredFields,
      optionalFields,
      category,
      customMetadata
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('[Template API] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
