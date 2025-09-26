/**
 * Version utilities for getting app version and build information
 */

// Get package.json version at build time
export const getAppVersion = () => {
  return process.env.PACKAGE_VERSION || 
         process.env.npm_package_version || 
         '0.1.0'
}

// Get git commit hash (short version)
export const getCommitHash = () => {
  // Priority order: Vercel environment variables, then our custom ones, then fallback
  const fullHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 
                   process.env.VERCEL_GIT_COMMIT_SHA ||
                   process.env.GIT_COMMIT_SHA ||
                   'dev'
  
  return fullHash === 'dev' ? 'dev' : fullHash.substring(0, 7)
}

// Get full version string: version-commit
export const getFullVersion = () => {
  const version = getAppVersion()
  const commit = getCommitHash()
  return `${version}-${commit}`
}

// Get build timestamp
export const getBuildTime = () => {
  return process.env.BUILD_TIME || new Date().toISOString()
}

// Get deployment environment
export const getEnvironment = () => {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV // 'production', 'preview', or 'development'
  }
  return process.env.NODE_ENV || 'development'
}
