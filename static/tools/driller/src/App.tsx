import { useEffect } from 'react'
import { TopBar } from '@/app/TopBar'
import { SidePanel } from '@/app/SidePanel'
import { DrillerCanvas } from '@/canvas/DrillerCanvas'
import { AIChat } from '@/app/AIChat'
import { useProjectStore } from '@/state/projectStore'
import { initDB } from '@/storage/indexedDB'

function App() {
  const { error, setError } = useProjectStore()

  // Initialize IndexedDB on app start
  useEffect(() => {
    initDB().catch(console.error)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Panel */}
        <SidePanel />
        
        {/* Canvas */}
        <DrillerCanvas />
      </div>

      {/* AI Chat */}
      <AIChat />
    </div>
  )
}

export default App