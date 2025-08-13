import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProjectStore } from '@/state/projectStore'
import { getAllModes, suggestMode } from '@/modes'
import { detectInputType } from '@/utils'
import { aiProvider } from '@/ai'
import { exportCanvasImage, exportCanvasPDF, exportProjectJSON, exportMarkdownSummary } from '@/export'
import type { ModeType } from '@/types'

export function TopBar() {
  const { 
    currentProject, 
    currentMode, 
    setMode, 
    createProject, 
    saveProject,
    setError 
  } = useProjectStore()
  
  const [showNewProject, setShowNewProject] = useState(!currentProject)
  const [projectName, setProjectName] = useState('')
  const [rootTopic, setRootTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const modes = getAllModes()

  const handleCreateProject = () => {
    if (!projectName.trim() || !rootTopic.trim()) {
      setError('Please provide both project name and root topic')
      return
    }

    createProject(projectName.trim(), rootTopic.trim())
    
    // Auto-suggest mode based on input
    const inputType = detectInputType(rootTopic)
    const suggestedMode = suggestMode(inputType)
    setMode(suggestedMode)
    
    setShowNewProject(false)
    setProjectName('')
    setRootTopic('')
  }

  const handleGenerateFindings = async () => {
    if (!currentProject) return

    try {
      setIsGenerating(true)
      const summary = await aiProvider.generateSynthesis(currentProject)
      
      // Update project with generated summary
      const updatedProject = {
        ...currentProject,
        summary,
      }
      
      // This would normally save to the store, but for now just trigger export
      exportMarkdownSummary(updatedProject)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate findings')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportCanvas = async (format: 'png' | 'pdf') => {
    const canvasElement = document.querySelector('.react-flow') as HTMLElement
    if (!canvasElement) {
      setError('Canvas not found for export')
      return
    }

    try {
      if (format === 'png') {
        await exportCanvasImage(canvasElement, 'png')
      } else {
        await exportCanvasPDF(canvasElement)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export canvas')
    }
  }

  const handleExportProject = () => {
    if (!currentProject) return
    exportProjectJSON(currentProject)
  }

  if (showNewProject) {
    return (
      <div className="h-16 border-b border-gray-200 px-4 flex items-center gap-4 bg-white">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
          
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-48"
          />
          
          <Input
            placeholder="Root topic, error, or question to analyze"
            value={rootTopic}
            onChange={(e) => setRootTopic(e.target.value)}
            className="flex-1 max-w-md"
          />
          
          <Button onClick={handleCreateProject}>
            Create Project
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {currentProject?.name || 'Driller'}
        </h1>
        
        {currentProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewProject(true)}
          >
            New Project
          </Button>
        )}
      </div>

      {currentProject && (
        <div className="flex items-center gap-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mode:</span>
            <select
              value={currentMode || ''}
              onChange={(e) => setMode(e.target.value as ModeType)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Select Mode</option>
              {Object.entries(modes).map(([key, mode]) => (
                <option key={key} value={key}>
                  {mode.name}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Findings */}
          <Button
            onClick={handleGenerateFindings}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? 'Generating...' : 'Generate Findings'}
          </Button>

          {/* Export Menu */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Export:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCanvas('png')}
            >
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCanvas('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProject}
            >
              JSON
            </Button>
          </div>

          {/* Save */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveProject()}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  )
}