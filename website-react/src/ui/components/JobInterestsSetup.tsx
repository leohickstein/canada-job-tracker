import React, { useState } from 'react'
import { X, Plus, MapPin, Briefcase, DollarSign, Settings } from 'lucide-react'

interface JobInterestsSetupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (interests: UserJobInterests) => void
  initialInterests?: Partial<UserJobInterests>
  isFirstTime?: boolean
}

interface UserJobInterests {
  job_titles: string[]
  locations: string[]
  salary_min?: number
  job_types: string[]
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'any'
}

export function JobInterestsSetup({ isOpen, onClose, onSave, initialInterests, isFirstTime = false }: JobInterestsSetupProps) {
  const [jobTitles, setJobTitles] = useState<string[]>(initialInterests?.job_titles || [])
  const [locations, setLocations] = useState<string[]>(initialInterests?.locations || [])
  const [salaryMin, setSalaryMin] = useState<number>(initialInterests?.salary_min || 0)
  const [jobTypes, setJobTypes] = useState<string[]>(initialInterests?.job_types || [])
  const [remotePreference, setRemotePreference] = useState<'remote' | 'hybrid' | 'onsite' | 'any'>(
    initialInterests?.remote_preference || 'any'
  )

  const [newJobTitle, setNewJobTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')

  if (!isOpen) return null

  const popularJobTitles = [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 
    'Marketing Manager', 'Sales Representative', 'Business Analyst', 'DevOps Engineer',
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer'
  ]

  const popularLocations = [
    'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB', 
    'Ottawa, ON', 'Edmonton, AB', 'Mississauga, ON', 'Winnipeg, MB',
    'Remote', 'Hybrid'
  ]

  const jobTypeOptions = [
    'full-time', 'part-time', 'contract', 'temporary', 'internship'
  ]

  const addJobTitle = (title: string) => {
    if (title && !jobTitles.includes(title)) {
      setJobTitles([...jobTitles, title])
      setNewJobTitle('')
    }
  }

  const addLocation = (location: string) => {
    if (location && !locations.includes(location)) {
      setLocations([...locations, location])
      setNewLocation('')
    }
  }

  const removeJobTitle = (title: string) => {
    setJobTitles(jobTitles.filter(t => t !== title))
  }

  const removeLocation = (location: string) => {
    setLocations(locations.filter(l => l !== location))
  }

  const toggleJobType = (type: string) => {
    setJobTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSave = () => {
    if (jobTitles.length === 0) {
      alert('Please add at least one job title you\'re interested in.')
      return
    }

    const interests: UserJobInterests = {
      job_titles: jobTitles,
      locations: locations.length > 0 ? locations : ['Canada'], // Default to Canada
      salary_min: salaryMin > 0 ? salaryMin : undefined,
      job_types: jobTypes.length > 0 ? jobTypes : ['full-time'], // Default to full-time
      remote_preference: remotePreference
    }

    onSave(interests)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isFirstTime ? '🎯 Tell us what you\'re looking for' : '⚙️ Update Your Job Preferences'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isFirstTime 
                  ? 'Help us find the perfect jobs for you by sharing your interests'
                  : 'Modify your preferences to see more relevant opportunities'
                }
              </p>
            </div>
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Job Titles Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Job Titles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">What roles are you interested in?</p>
              </div>
            </div>

            {/* Popular Job Titles */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular choices:</p>
              <div className="flex flex-wrap gap-2">
                {popularJobTitles.map(title => (
                  <button
                    key={title}
                    onClick={() => addJobTitle(title)}
                    disabled={jobTitles.includes(title)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      jobTitles.includes(title)
                        ? 'bg-blue-500 text-white cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800'
                    }`}
                  >
                    {jobTitles.includes(title) ? '✓ ' : '+ '}{title}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Job Title Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Add a custom job title..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && addJobTitle(newJobTitle)}
              />
              <button
                onClick={() => addJobTitle(newJobTitle)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Job Titles */}
            {jobTitles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your selections:</p>
                <div className="flex flex-wrap gap-2">
                  {jobTitles.map(title => (
                    <div key={title} className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-full">
                      <span className="text-sm">{title}</span>
                      <button
                        onClick={() => removeJobTitle(title)}
                        className="text-blue-200 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Locations Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Locations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Where would you like to work?</p>
              </div>
            </div>

            {/* Popular Locations */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular locations:</p>
              <div className="flex flex-wrap gap-2">
                {popularLocations.map(location => (
                  <button
                    key={location}
                    onClick={() => addLocation(location)}
                    disabled={locations.includes(location)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      locations.includes(location)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800'
                    }`}
                  >
                    {locations.includes(location) ? '✓ ' : '+ '}{location}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Location Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add a custom location..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && addLocation(newLocation)}
              />
              <button
                onClick={() => addLocation(newLocation)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Locations */}
            {locations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your selections:</p>
                <div className="flex flex-wrap gap-2">
                  {locations.map(location => (
                    <div key={location} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full">
                      <span className="text-sm">{location}</span>
                      <button
                        onClick={() => removeLocation(location)}
                        className="text-green-200 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Salary Minimum */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minimum Salary</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Annual salary expectation (CAD)</p>
                </div>
              </div>
              <input
                type="number"
                value={salaryMin || ''}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                placeholder="e.g., 60000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Remote Preference */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Style</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">How do you prefer to work?</p>
                </div>
              </div>
              <select
                value={remotePreference}
                onChange={(e) => setRemotePreference(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="any">Any work arrangement</option>
                <option value="remote">Remote only</option>
                <option value="hybrid">Hybrid (remote + office)</option>
                <option value="onsite">On-site only</option>
              </select>
            </div>
          </div>

          {/* Job Types */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employment Type</h3>
            <div className="flex flex-wrap gap-3">
              {jobTypeOptions.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobTypes.includes(type)}
                    onChange={() => toggleJobType(type)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{type.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {jobTitles.length} job title{jobTitles.length !== 1 ? 's' : ''} • {locations.length || 1} location{(locations.length || 1) !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-3">
              {!isFirstTime && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={jobTitles.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isFirstTime ? '🚀 Start Finding Jobs' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}