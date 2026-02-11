import { HDCVector, ProfileData, Lens } from '@/types/hdc'

const DIMENSION = 10000
let simHashMatrix: number[][] | null = null

function generateSimHashMatrix(dim: number = DIMENSION) {
  if (simHashMatrix && simHashMatrix.length >= dim) return simHashMatrix.slice(0, dim)

  simHashMatrix = []
  for (let i = 0; i < dim; i++) {
    const row = []
    for (let j = 0; j < 768; j++) {
      row.push(Math.random() > 0.5 ? 1 : -1)
    }
    simHashMatrix.push(row)
  }
  return simHashMatrix
}

export class HDCEncoder {
  private embeddingModel: string = 'all-MiniLM-L6-v2'
  private baseUrl: string
  private useFallback: boolean = true

  constructor() {
    this.baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''
    this.useFallback = !process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY.includes('placeholder')
  }

  async encodeText(text: string): Promise<number[]> {
    if (this.useFallback) {
      return this.generateFallbackEmbedding(text)
    }

    const url = this.baseUrl
      ? `${this.baseUrl}/api/embeddings`
      : '/api/embeddings'

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model: this.embeddingModel })
    })

    if (!response.ok) {
      console.warn('[HDC Encoder] API failed, using fallback embedding')
      return this.generateFallbackEmbedding(text)
    }

    const data = await response.json()
    return data.embedding
  }

  private generateFallbackEmbedding(text: string): number[] {
    const dimension = 768
    const embedding = new Array(dimension).fill(0)

    const hash = this.simpleHash(text)

    for (let i = 0; i < dimension; i++) {
      const combined = (hash + i * 37) % 1000
      embedding[i] = (combined / 500 - 1) * (1 - i / dimension)
    }

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    for (let i = 0; i < dimension; i++) {
      embedding[i] /= norm
    }

    return embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  textToHyperVector(embedding: number[]): HDCVector {
    const dim = embedding.length
    const matrix = generateSimHashMatrix(dim)
    const hyperVector = new Array(dim).fill(0)

    for (let i = 0; i < dim; i++) {
      let sum = 0
      for (let j = 0; j < embedding.length; j++) {
        sum += matrix[i][j] * embedding[j]
      }
      hyperVector[i] = sum > 0 ?1 : 0
    }

    return {
      data: hyperVector,
      dimension: dim
    }
  }

  async encodeProfile(profile: ProfileData): Promise<HDCVector> {
    const textSegments = this.extractTextSegments(profile)
    const vectors: HDCVector[] = []

    for (const segment of textSegments) {
      const embedding = await this.encodeText(segment)
      const hyperVector = this.textToHyperVector(embedding)
      vectors.push(hyperVector)
    }

    return this.bundle(vectors)
  }

  async encodeDemand(demandText: string): Promise<HDCVector> {
    const embedding = await this.encodeText(demandText)
    return this.textToHyperVector(embedding)
  }

  bundle(vectors: HDCVector[]): HDCVector {
    if (vectors.length === 0) {
      return { data: [], dimension: 0 }
    }
    const dim = vectors[0].dimension || vectors[0].data.length
    const bundledData = new Array(dim).fill(0)

    for (const vector of vectors) {
      for (let i = 0; i < dim; i++) {
        bundledData[i] += vector.data[i]
      }
    }

    const threshold = vectors.length / 2
    for (let i = 0; i < dim; i++) {
      bundledData[i] = bundledData[i] >= threshold ? 1 : 0
    }

    return {
      data: bundledData,
      dimension: dim
    }
  }

  bind(vectorA: HDCVector, vectorB: HDCVector): HDCVector {
    const dim = Math.min(vectorA.dimension || vectorA.data.length, vectorB.dimension || vectorB.data.length)
    const boundData = new Array(dim).fill(0)

    for (let i = 0; i < dim; i++) {
      boundData[i] = vectorA.data[i] === vectorB.data[i] ? 0 : 1
    }

    return {
      data: boundData,
      dimension: dim
    }
  }

  similarity(vectorA: HDCVector, vectorB: HDCVector): number {
    const hammingDistance = this.hammingDistance(vectorA, vectorB)
    const dim = Math.min(vectorA.dimension || vectorA.data.length, vectorB.dimension || vectorB.data.length)
    return 1 - (hammingDistance / dim)
  }

  hammingDistance(vectorA: HDCVector, vectorB: HDCVector): number {
    let distance = 0
    const dim = Math.min(vectorA.dimension || vectorA.data.length, vectorB.dimension || vectorB.data.length)
    for (let i = 0; i < dim; i++) {
      if (vectorA.data[i] !== vectorB.data[i]) {
        distance++
      }
    }
    return distance
  }

  private extractTextSegments(profile: ProfileData): string[] {
    const segments: string[] = []

    segments.push(...profile.skills)
    segments.push(...profile.experiences)
    segments.push(...profile.preferences)
    
    if (profile.values) segments.push(...profile.values)
    if (profile.projects) segments.push(...profile.projects)
    if (profile.socialConnections) segments.push(...profile.socialConnections)

    return segments
  }

  calculateSpecificity(agentVector: HDCVector, averageVector: HDCVector): number {
    return 1 - this.similarity(agentVector, averageVector)
  }
}

export const hdEncoder = new HDCEncoder()
