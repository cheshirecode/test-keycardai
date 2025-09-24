'use client'

import React, { useState, useEffect } from 'react'
import { templates } from '../../../lib/templates'
import { ProjectInfo } from '../../../types/mcp'
import { MCPClient } from '../../../lib/mcp-client'

interface ProjectPreviewProps {
  project: ProjectInfo
}

export function ProjectPreview({ project }: ProjectPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [gitInfo, setGitInfo] = useState<{
    repositoryUrl: string
    branchName: string
    cloneCommand: string
  } | null>(null)
  const mcpClient = new MCPClient()
  const template = templates[project.template]

  // Generate git info when project is completed
  useEffect(() => {
    if (project.status === 'completed') {
      const timestamp = Date.now()
      const sanitizedName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const branchName = `project-${sanitizedName}-${timestamp}`
      const repositoryUrl = `https://github.com/your-username/${branchName}`
      const cloneCommand = `git clone ${repositoryUrl}`

      setGitInfo({
        repositoryUrl,
        branchName,
        cloneCommand
      })
    }
  }, [project.status, project.name])

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)

    try {
      const result = await mcpClient.call('download_project_zip', {
        projectPath: project.path,
        projectName: project.name
      }) as {
        success: boolean
        message: string
        downloadUrl?: string
        projectName?: string
        fileCount?: number
        totalSize?: number
        files?: string[]
      }

      if (result.success) {
        // Trigger actual download
        if (result.downloadUrl) {
          const link = document.createElement('a')
          link.href = result.downloadUrl
          link.download = `${project.name}.zip`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        alert(`Project downloaded! ${result.message}`)
      } else {
        alert(`Download failed: ${result.message}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Download failed: ${errorMessage}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

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

      {/* Project Access Options */}
      {project.status === 'completed' && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Project Access Options</h4>
          <div className="space-y-3">
            {/* Download ZIP */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-900">📦 Download as ZIP</h5>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading ? 'Creating ZIP...' : 'Download ZIP'}
                </button>
              </div>
              <p className="text-sm text-blue-700">
                Download your project as a compressed ZIP file with all source code.
              </p>
            </div>

            {/* GitHub Repository Info */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-3">🌿 GitHub Repository</h5>
              {gitInfo ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-purple-800 mb-1">Repository URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-2 py-1 bg-white rounded text-sm text-purple-900 border">
                        {gitInfo.repositoryUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(gitInfo.repositoryUrl)}
                        className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800 mb-1">Clone Command:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-2 py-1 bg-white rounded text-sm text-purple-900 border">
                        {gitInfo.cloneCommand}
                      </code>
                      <button
                        onClick={() => copyToClipboard(gitInfo.cloneCommand)}
                        className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600">
                    💡 Use the clone command to get your project code locally
                  </p>
                </div>
              ) : (
                <p className="text-sm text-purple-700">
                  Repository info will be available once project is created.
                </p>
              )}
            </div>

            {/* Traditional Next Steps */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">💻 Traditional Setup</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                <li>cd {project.name}</li>
                <li>npm install</li>
                <li>npm run dev</li>
                <li>Open in your editor</li>
                <li>Start coding! 🚀</li>
              </ol>
            </div>
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
