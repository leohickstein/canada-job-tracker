import React, { useState } from 'react'
import { Bell, Copy, Check, Mail, Github, ExternalLink, Sparkles } from 'lucide-react'

export function AlertsPage(){
  const [copied, setCopied] = useState(false)
  const alertUrl = (globalThis as any).location?.origin + (globalThis as any).location?.pathname + '?onlyNew=1'
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(alertUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = alertUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="border-b border-white/30 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                Job Alerts
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Stay updated with the latest job opportunities. Configure your automated alerts and never miss out on new positions.
            </p>
          </div>
        </div>
      </div>

      <main className='container mx-auto max-w-4xl px-4 py-8 space-y-6'>
        {/* Main Alert Card */}
        <div className='relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg'>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/30 dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/20 pointer-events-none" />
          
          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Daily Email Notifications
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Your GitHub Action is already configured to send you daily email updates with new job postings.
                </p>
              </div>
            </div>

            {/* Feature List */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Automated daily delivery
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Only new positions (≤ 24h)
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Filtered by your preferences
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Direct links to apply
                </span>
              </div>
            </div>

            {/* Quick Access URL */}
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Quick Access Link
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Include this link in your daily emails to jump straight to new job listings:
              </p>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-700 font-mono text-sm">
                <code className="flex-1 text-slate-800 dark:text-slate-200 break-all">
                  {alertUrl}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    copied 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Guide Card */}
        <div className='relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg'>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20 pointer-events-none" />
          
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <Github className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-800 dark:text-white">
                GitHub Action Setup
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Your automated job alerts are powered by GitHub Actions. The system runs daily and sends you personalized job recommendations.
            </p>
            
            <a 
              href="https://github.com/features/actions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ExternalLink className="h-4 w-4" />
              Learn about GitHub Actions
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}