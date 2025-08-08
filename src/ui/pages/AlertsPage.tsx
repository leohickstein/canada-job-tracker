import React from 'react'
export function AlertsPage(){
  return (
    <main className='container mx-auto max-w-4xl'>
      <div className='card glass p-6 text-sm meta'>
        Your GitHub Action already emails you daily. Include this link in the email for "new since yesterday": <code>{(globalThis as any).location?.origin + (globalThis as any).location?.pathname}?onlyNew=1</code>
      </div>
    </main>
  )
}
