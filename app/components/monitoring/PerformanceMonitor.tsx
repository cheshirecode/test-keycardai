'use client'

import { useEffect, useRef } from 'react'
import { logger, measurePerformance } from '@/lib/logger'
import { PerformanceMonitorProps } from '@/types'

/**
 * Performance monitoring component
 * Tracks render times and reports slow components
 */
export function PerformanceMonitor({ 
  componentName, 
  threshold = 100, 
  children 
}: PerformanceMonitorProps) {
  const renderStartTime = useRef<number>()
  const componentLogger = logger.child({ component: componentName })

  useEffect(() => {
    // Track component mount time
    const mountTime = performance.now()
    componentLogger.performance('component_mount', mountTime, {
      componentName,
      timestamp: new Date().toISOString()
    })

    return () => {
      // Track component unmount
      componentLogger.debug('Component unmounted', { componentName })
    }
  }, [componentName, componentLogger])

  useEffect(() => {
    // Track render performance
    if (renderStartTime.current) {
      const renderDuration = performance.now() - renderStartTime.current
      
      if (renderDuration > threshold) {
        componentLogger.warn('Slow render detected', {
          componentName,
          renderDuration,
          threshold
        })
      } else {
        componentLogger.debug('Render completed', {
          componentName,
          renderDuration
        })
      }
    }
    
    renderStartTime.current = performance.now()
  }, [componentName, componentLogger, threshold])

  return <>{children}</>
}

/**
 * HOC for adding performance monitoring to components
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  const PerformanceWrappedComponent = (props: P) => {
    return (
      <PerformanceMonitor componentName={displayName}>
        <WrappedComponent {...props} />
      </PerformanceMonitor>
    )
  }
  
  PerformanceWrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`
  
  return PerformanceWrappedComponent
}

/**
 * Hook for measuring operation performance
 */
export function usePerformanceMeasurement(componentName: string) {
  const componentLogger = logger.child({ component: componentName })
  
  const measure = async function<T>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    return measurePerformance(
      `${componentName}.${operationName}`,
      operation,
      componentLogger
    )
  }
  
  const trackUserAction = (action: string, data?: Record<string, unknown>) => {
    componentLogger.userAction(`${componentName}.${action}`, data)
  }
  
  return { measure, trackUserAction, logger: componentLogger }
}

/**
 * Web Vitals monitoring
 */
export function WebVitalsMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track Core Web Vitals
    const trackWebVital = (metric: { name: string; value: number; id: string; delta: number; rating: string }) => {
      logger.performance(`web_vital_${metric.name}`, metric.value, {
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating
      })
    }

    // Dynamically import web-vitals to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
      onCLS(trackWebVital)
      onFCP(trackWebVital)
      onLCP(trackWebVital)
      onTTFB(trackWebVital)
    }).catch((error) => {
      logger.warn('Failed to load web-vitals', { error: String(error) })
    })

    // Track custom performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          logger.performance('page_load', navEntry.loadEventEnd - navEntry.fetchStart, {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            domInteractive: navEntry.domInteractive - navEntry.fetchStart,
            firstPaint: navEntry.fetchStart,
            type: 'navigation'
          })
        }
        
        if (entry.entryType === 'paint') {
          logger.performance(`paint_${entry.name}`, entry.startTime, {
            type: 'paint'
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['navigation', 'paint'] })
    } catch (error) {
      logger.warn('Performance observer not supported', { error: String(error) })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

export default PerformanceMonitor
