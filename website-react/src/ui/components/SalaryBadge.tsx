import React from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'
import type { SalaryAnalysis } from '@/types/job'

interface SalaryBadgeProps {
  analysis: SalaryAnalysis
  compact?: boolean
}

export function SalaryBadge({ analysis, compact = false }: SalaryBadgeProps) {
  if (!analysis || (analysis.confidence || 0) < 0.3) return null

  const getMarketPositionStyle = (position: SalaryAnalysis['marketPosition']) => {
    switch (position) {
      case 'excellent':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
      case 'above':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
      case 'average':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
      case 'below':
        return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
      default:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-white'
    }
  }

  const getDemandIcon = (level: SalaryAnalysis['demandLevel']) => {
    switch (level) {
      case 'very-high':
      case 'high':
        return <TrendingUp className="h-3 w-3" />
      case 'medium':
        return <Target className="h-3 w-3" />
      case 'low':
        return <TrendingDown className="h-3 w-3" />
      default:
        return <DollarSign className="h-3 w-3" />
    }
  }

  const getMarketPositionText = (position: SalaryAnalysis['marketPosition']) => {
    switch (position) {
      case 'excellent': return '💰 Excellent Pay'
      case 'above': return '📈 Above Market'
      case 'average': return '📊 Market Rate'
      case 'below': return '📉 Below Market'
      default: return '💼 Market Rate'
    }
  }

  const getDemandText = (level: SalaryAnalysis['demandLevel']) => {
    switch (level) {
      case 'very-high': return 'Very High Demand'
      case 'high': return 'High Demand'
      case 'medium': return 'Medium Demand'
      case 'low': return 'Lower Demand'
      default: return 'Unknown Demand'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {analysis.marketPosition && (
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm
            ${getMarketPositionStyle(analysis.marketPosition)}
          `}>
            {getMarketPositionText(analysis.marketPosition)}
          </span>
        )}
        {analysis.demandLevel && (analysis.demandLevel === 'high' || analysis.demandLevel === 'very-high') && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
            {getDemandIcon(analysis.demandLevel)}
            Hot
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 p-3 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Market Analysis
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {Math.round((analysis.confidence || 0) * 100)}% confidence
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {analysis.marketPosition && (
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm
            ${getMarketPositionStyle(analysis.marketPosition)}
          `}>
            {getMarketPositionText(analysis.marketPosition)}
          </span>
        )}

        {analysis.demandLevel && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
            {getDemandIcon(analysis.demandLevel)}
            {getDemandText(analysis.demandLevel)}
          </span>
        )}

        {analysis.trendDirection && analysis.trendDirection !== 'stable' && (
          <span className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm
            ${analysis.trendDirection === 'hot' || analysis.trendDirection === 'growing' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
            }
          `}>
            {analysis.trendDirection === 'hot' && '🔥'}
            {analysis.trendDirection === 'growing' && '📈'}
            {analysis.trendDirection === 'declining' && '📉'}
            {analysis.trendDirection === 'hot' ? 'Hot Trend' :
             analysis.trendDirection === 'growing' ? 'Growing' :
             analysis.trendDirection === 'declining' ? 'Declining' : ''}
          </span>
        )}
      </div>

      {analysis.averageSalary && (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Market average: ${analysis.averageSalary.toLocaleString()}
          {analysis.salaryRange && (
            <span className="ml-2">
              (Range: ${analysis.salaryRange.min.toLocaleString()} - ${analysis.salaryRange.max.toLocaleString()})
            </span>
          )}
        </div>
      )}
    </div>
  )
}