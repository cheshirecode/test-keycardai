/**
 * ChatMessageItem Component
 * Renders individual chat messages with debugging info
 * Single responsibility: Individual message display
 */

import { ChatMessageItemProps } from '@/types'

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] space-y-3 ${message.role === 'user' ? '' : ''}`}>
        {/* Debugging & Transparency Section - Show FIRST for agent messages */}
        {message.role === 'assistant' && (message.chainOfThought || message.mcpLogs) && (
          <div className="space-y-2">
            {/* Chain of Thought Section */}
            {message.chainOfThought && (
              <details className="group" open>
                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-blue-50 transition-colors border border-blue-200 min-w-0">
                  🤔 <span className="text-blue-700 font-medium min-w-[120px] inline-block">AI Reasoning</span>
                  <span className="text-gray-500 text-xs">Chain of Thought</span>
                </summary>
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-xs text-blue-900 border-l-4 border-blue-400">
                  <div className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                    💭 <span>How I&apos;m thinking about this...</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed bg-white p-2 rounded border">
                    {message.chainOfThought}
                  </div>
                </div>
              </details>
            )}

            {/* MCP Logs Section */}
            {message.mcpLogs && message.mcpLogs.length > 0 && (
              <details className="group" open>
                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100 flex items-center gap-2 p-2 rounded hover:bg-green-50 transition-colors border border-green-200 min-w-0">
                  🔧 <span className="text-green-700 font-medium min-w-[120px] inline-block">MCP Server Logs</span>
                  <span className="text-gray-500 text-xs">({message.mcpLogs.length} entries)</span>
                </summary>
                <div className="mt-2 p-3 bg-green-50 rounded-md text-xs border-l-4 border-green-400">
                  <div className="font-medium text-green-800 mb-2 flex items-center gap-1">
                    🔍 <span>Tool execution logs...</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {message.mcpLogs.map((log, index) => (
                      <div key={index} className={`p-2 rounded border text-xs ${
                        log.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        log.type === 'request' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        log.type === 'response' ? 'bg-green-50 border-green-200 text-green-800' :
                        'bg-gray-50 border-gray-200 text-gray-800'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-1">
                            {log.type === 'error' ? '❌' :
                             log.type === 'request' ? '📤' :
                             log.type === 'response' ? '📥' : 'ℹ️'}
                            {log.tool && `${log.tool}`}
                            <span className="text-xs opacity-75">({log.type})</span>
                          </span>
                          <span className="text-xs opacity-60">
                            {log.duration && `${log.duration}ms`}
                          </span>
                        </div>
                        <div className="text-xs">
                          {log.message}
                          {log.data !== undefined && (
                            <details className="mt-1">
                              <summary className="cursor-pointer opacity-75 hover:opacity-100">
                                📋 Data
                              </summary>
                              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Main Message Content */}
        <div
          className={`p-3 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {message.role === 'user' ? 'You' : '🤖 Agent'}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="text-xs opacity-75 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}
