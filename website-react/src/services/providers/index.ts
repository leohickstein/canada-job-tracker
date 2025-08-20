import type { JobProvider } from '@/types/job'
import { AdzunaProvider } from './adzunaProvider'

// Provider registry for managing multiple job providers
export class JobProviderRegistry {
  private providers = new Map<string, JobProvider>()

  registerProvider(provider: JobProvider) {
    this.providers.set(provider.name, provider)
  }

  getProvider(name: string): JobProvider | undefined {
    return this.providers.get(name)
  }

  getAllProviders(): JobProvider[] {
    return Array.from(this.providers.values())
  }

  getEnabledProviders(): JobProvider[] {
    // For now, return all providers. Later you could add user preferences
    return this.getAllProviders()
  }
}

// Global registry instance
export const jobProviderRegistry = new JobProviderRegistry()

// Initialize providers based on environment
export function initializeProviders() {
  // Adzuna provider
  const adzunaAppId = import.meta.env.VITE_ADZUNA_APP_ID
  const adzunaAppKey = import.meta.env.VITE_ADZUNA_APP_KEY
  
  if (adzunaAppId && adzunaAppKey) {
    jobProviderRegistry.registerProvider(
      new AdzunaProvider(adzunaAppId, adzunaAppKey)
    )
  }

  // Future providers can be added here:
  // jobProviderRegistry.registerProvider(new LinkedInProvider(...))
  // jobProviderRegistry.registerProvider(new IndeedProvider(...))
}

// Export provider classes for direct use if needed
export { AdzunaProvider }