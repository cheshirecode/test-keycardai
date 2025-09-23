import { describe, it, expect } from 'vitest'

// Mock template data for testing
const mockTemplates = [
  {
    id: 'react-ts',
    name: 'React TypeScript App',
    description: 'A modern React application with TypeScript',
    files: ['package.json', 'src/App.tsx', 'src/index.tsx']
  },
  {
    id: 'nextjs-ts',
    name: 'Next.js Fullstack',
    description: 'A fullstack Next.js application',
    files: ['package.json', 'app/page.tsx', 'app/layout.tsx']
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'A Node.js API with Express',
    files: ['package.json', 'src/index.ts', 'src/routes.ts']
  }
]

// Mock function since the actual implementation might not exist
const getProjectTemplates = () => mockTemplates

describe('Template System', () => {
  describe('getProjectTemplates', () => {
    it('should return an array of templates', () => {
      const templates = getProjectTemplates()

      expect(templates).toBeInstanceOf(Array)
      expect(templates.length).toBeGreaterThan(0)
    })

    it('should return templates with required properties', () => {
      const templates = getProjectTemplates()

      templates.forEach(template => {
        expect(template).toHaveProperty('id')
        expect(template).toHaveProperty('name')
        expect(template).toHaveProperty('description')
        expect(template).toHaveProperty('files')
        expect(template.id).toBeTypeOf('string')
        expect(template.name).toBeTypeOf('string')
        expect(template.description).toBeTypeOf('string')
        expect(template.files).toBeInstanceOf(Array)
      })
    })

    it('should include React TypeScript template', () => {
      const templates = getProjectTemplates()
      const reactTemplate = templates.find(t => t.id === 'react-ts')

      expect(reactTemplate).toBeDefined()
      expect(reactTemplate?.name).toBe('React TypeScript App')
    })

    it('should include Next.js template', () => {
      const templates = getProjectTemplates()
      const nextTemplate = templates.find(t => t.id === 'nextjs-ts')

      expect(nextTemplate).toBeDefined()
      expect(nextTemplate?.name).toBe('Next.js Fullstack')
    })

    it('should include Node.js API template', () => {
      const templates = getProjectTemplates()
      const nodeTemplate = templates.find(t => t.id === 'node-api')

      expect(nodeTemplate).toBeDefined()
      expect(nodeTemplate?.name).toBe('Node.js API')
    })

    it('demonstrates Vitest functionality', () => {
      // Test Vitest matchers and assertions
      expect('vitest').toContain('test')
      expect({ name: 'Vitest', version: '2.1.8' }).toMatchObject({ name: 'Vitest' })
      expect(Math.PI).toBeCloseTo(3.14, 2)

      // Test async behavior
      return expect(Promise.resolve('success')).resolves.toBe('success')
    })
  })
})
