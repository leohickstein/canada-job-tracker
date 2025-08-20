// Utility to clear localStorage job data when debugging
export function clearJobTrackerData() {
  const keys = [
    'jobtracker:v5',
    'jobtracker:v4', 
    'jobtracker-persist',
    'jobtracker_theme'
  ]
  
  keys.forEach(key => localStorage.removeItem(key))
  console.log('Cleared all job tracker localStorage data:', keys)
  console.log('App now uses database-only storage for user data!')
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearJobTrackerData = clearJobTrackerData
  console.log('Debug: Run clearJobTrackerData() to clear localStorage')
}