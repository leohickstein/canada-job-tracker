import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { userInterests } from '@/services/supabaseService'
import { JobInterestsSetup } from '@/ui/components/JobInterestsSetup'
import { Settings, Briefcase, MapPin, DollarSign, Clock, RefreshCw } from 'lucide-react'

interface UserJobInterests {
  job_titles: string[]
  locations: string[]
  salary_min?: number
  job_types: string[]
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'any'
}

export function PreferencesPage() {
  const { user } = useAuth()
  const [interests, setInterests] = useState<UserJobInterests | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Load user interests on mount
  useEffect(() => {
    loadUserInterests()
  }, [user])

  const loadUserInterests = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await userInterests.get(user.id)
      if (data) {
        setInterests({
          job_titles: data.job_titles || [],
          locations: data.locations || [],
          salary_min: data.salary_min,
          job_types: data.job_types || [],
          remote_preference: data.remote_preference || 'any'
        })
        setLastUpdated(data.updated_at)
      }
    } catch (error) {
      console.error('Failed to load user interests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveInterests = async (newInterests: UserJobInterests) => {
    if (!user) return

    try {
      await userInterests.update(user.id, newInterests)
      setInterests(newInterests)
      setLastUpdated(new Date().toISOString())
      
      // Show success message
      alert('✅ Your job preferences have been updated! We\'ll start showing you more relevant opportunities.')
    } catch (error) {
      console.error('Failed to save interests:', error)
      alert('❌ Failed to save preferences. Please try again.')
    }
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-4xl py-6 px-4">
        <div className="text-center py-12">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-4">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to manage your job preferences and get personalized recommendations.
          </p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="container mx-auto max-w-4xl py-6 px-4">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your preferences...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl py-6 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Job Preferences
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Customize what jobs you see and get better recommendations
        </p>
      </div>

      {/* No Preferences State */}
      {!interests || interests.job_titles.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg rounded-2xl p-8 text-center">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-6">
            <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Set Up Your Job Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Tell us what kind of jobs you're looking for, and we'll personalize your experience with relevant opportunities.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Settings className="h-4 w-4" />
            Get Started
          </button>
        </div>
      ) : (
        /* Existing Preferences Display */
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 dark:border-slate-700/50">
              <Briefcase className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{interests.job_titles.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Job Title{interests.job_titles.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 dark:border-slate-700/50">
              <MapPin className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{interests.locations.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Location{interests.locations.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 dark:border-slate-700/50">
              <DollarSign className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {interests.salary_min ? `$${interests.salary_min.toLocaleString()}` : 'Any'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Min Salary</div>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30 dark:border-slate-700/50">
              <Settings className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {interests.remote_preference}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Work Style</div>
            </div>
          </div>

          {/* Detailed Preferences */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Current Preferences</h2>
                <button
                  onClick={() => setShowSetup(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </button>
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Last updated: {new Date(lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Job Titles */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Job Titles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.job_titles.map(title => (
                    <span key={title} className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  Preferred Locations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.locations.map(location => (
                    <span key={location} className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              {/* Employment Types */}
              {interests.job_types.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Employment Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {interests.job_types.map(type => (
                      <span key={type} className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm capitalize">
                        {type.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Salary</h4>
                  <p className="text-gray-900 dark:text-white">
                    {interests.salary_min ? `$${interests.salary_min.toLocaleString()} CAD` : 'No minimum specified'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Arrangement</h4>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {interests.remote_preference === 'any' ? 'Open to any arrangement' : interests.remote_preference}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Update your preferences regularly to see fresh opportunities</li>
              <li>• Add multiple job titles to cast a wider net</li>
              <li>• Include both specific cities and "Remote" for maximum coverage</li>
              <li>• Set a realistic salary minimum to filter out low-paying positions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      <JobInterestsSetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onSave={handleSaveInterests}
        initialInterests={interests || undefined}
        isFirstTime={!interests || interests.job_titles.length === 0}
      />
    </main>
  )
}