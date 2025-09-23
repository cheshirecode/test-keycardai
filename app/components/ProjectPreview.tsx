'use client'

import { templates } from '@/lib/templates'
import { ProjectInfo } from '@/types/mcp'

interface ProjectPreviewProps {
  project: ProjectInfo
}

export function ProjectPreview({ project }: ProjectPreviewProps) {
  const template = templates[project.template]

  const getStatusIcon = () => {
    switch (project.status) {
      case 'creating':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      case 'completed':
        return <span className="text-green-500">✓</span>
      case 'error':
        return <span className="text-red-500">✗</span>
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (project.status) {
      case 'creating':
        return 'Creating...'
      case 'completed':
        return 'Ready to code!'
      case 'error':
        return 'Creation failed'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (project.status) {
      case 'creating':
        return 'border-blue-200 bg-blue-50'
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      {/* Project Info */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">{template?.description || 'Unknown template'}</p>
        <p className="text-xs text-gray-500">Path: {project.path}</p>
      </div>

      {/* File Structure */}
      {template && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">File Structure</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {Object.keys(template.files).sort().map((filePath) => {
                const isDirectory = filePath.endsWith('/')
                const icon = isDirectory ? '📁' : '📄'
                const displayPath = filePath.replace(/\/$/, '')

                return (
                  <div key={filePath} className="flex items-center space-x-2">
                    <span className="text-blue-400">{icon}</span>
                    <span className={isDirectory ? 'text-yellow-300' : 'text-gray-300'}>
                      {displayPath}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dependencies */}
      {template && (template.dependencies.length > 0 || template.devDependencies.length > 0) && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Dependencies</h4>
          <div className="space-y-2">
            {template.dependencies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Runtime:</p>
                <div className="flex flex-wrap gap-1">
                  {template.dependencies.slice(0, 6).map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {dep}
                    </span>
                  ))}
                  {template.dependencies.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{template.dependencies.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {template.devDependencies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Development:</p>
                <div className="flex flex-wrap gap-1">
                  {template.devDependencies.slice(0, 4).map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {dep}
                    </span>
                  ))}
                  {template.devDependencies.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{template.devDependencies.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {project.status === 'completed' && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
              <li>cd {project.name}</li>
              <li>npm run dev</li>
              <li>Open in your editor</li>
              <li>Start coding! 🚀</li>
            </ol>
          </div>
        </div>
      )}

      {/* Error Message */}
      {project.status === 'error' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            Project creation failed. Please try again or check the console for more details.
          </p>
        </div>
      )}
    </div>
  )
}
