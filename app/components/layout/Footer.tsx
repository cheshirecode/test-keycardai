'use client'

import React from 'react'
import { getFullVersion, getBuildTime, getEnvironment } from '@/lib/version'

export function Footer() {
  const version = getFullVersion()
  const buildTime = getBuildTime()
  const environment = getEnvironment()

  const isProduction = environment === 'production'

  return (
    <footer className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="font-mono">
            v{version}
            {!isProduction && (
              <span className="ml-1 px-1 bg-yellow-100 text-yellow-800 rounded text-2xs">
                {environment}
              </span>
            )}
          </span>
          <span className="hidden sm:inline">
            Built: {new Date(buildTime).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Project Scaffolder</span>
          <span className="text-gray-300">|</span>
          <a 
            href="https://github.com/cheshirecode/test-keycardai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors"
            title="View source on GitHub"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
