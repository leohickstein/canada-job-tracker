// Minimal SearchPage snippet to ensure the filter panel uses the stronger style.
// Merge by replacing your current container class for the filters card.
import React from 'react'
import { Filters } from '@/ui/components/Filters'
import { Results } from '@/ui/components/Results'

export default function SearchPage(){
  return (
    <main className="mx-auto max-w-7xl grid grid-cols-12 gap-4 px-4 py-6">
      <aside className="col-span-12 lg:col-span-3">
        {/* Ensure this card container has 'filter-panel' */}
        <div className="card glass filter-panel p-4">
          <Filters />
        </div>
      </aside>
      <section className="col-span-12 lg:col-span-9">
        <Results />
      </section>
    </main>
  )
}
