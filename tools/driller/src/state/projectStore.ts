import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { DrillerProject, MapNode, MapEdge, ModeType, NodeMeta } from '@/types'
import { generateId, getCurrentTimestamp } from '@/utils'

interface ProjectState {
  currentProject: DrillerProject | null
  selectedNodeId: string | null
  selectedEdgeId: string | null
  currentMode: ModeType | null
  isLoading: boolean
  error: string | null
}

interface ProjectActions {
  // Project management
  createProject: (name: string, rootTopic: string) => void
  loadProject: (project: DrillerProject) => void
  saveProject: () => Promise<void>
  clearProject: () => void
  
  // Node operations
  addNode: (node: Omit<MapNode, 'id' | 'meta'> & { meta?: Partial<NodeMeta> }) => string
  updateNode: (id: string, updates: Partial<MapNode>) => void
  deleteNode: (id: string) => void
  selectNode: (id: string | null) => void
  
  // Edge operations
  addEdge: (edge: Omit<MapEdge, 'id'>) => string
  updateEdge: (id: string, updates: Partial<MapEdge>) => void
  deleteEdge: (id: string) => void
  selectEdge: (id: string | null) => void
  
  // Mode management
  setMode: (mode: ModeType) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

type ProjectStore = ProjectState & ProjectActions

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentProject: null,
    selectedNodeId: null,
    selectedEdgeId: null,
    currentMode: null,
    isLoading: false,
    error: null,

    // Project management
    createProject: (name: string, rootTopic: string) => {
      const now = getCurrentTimestamp()
      const rootNodeId = generateId()
      
      const rootNode: MapNode = {
        id: rootNodeId,
        type: 'root',
        title: rootTopic,
        body: '',
        attachments: [],
        meta: {
          createdAt: now,
          updatedAt: now,
        },
        position: { x: 0, y: 0 },
      }

      const project: DrillerProject = {
        id: generateId(),
        name,
        rootNodeId,
        nodes: [rootNode],
        edges: [],
        createdAt: now,
        updatedAt: now,
      }

      set({ 
        currentProject: project,
        selectedNodeId: rootNodeId,
        selectedEdgeId: null,
        error: null,
      })
    },

    loadProject: (project: DrillerProject) => {
      set({ 
        currentProject: project,
        selectedNodeId: project.rootNodeId,
        selectedEdgeId: null,
        error: null,
      })
    },

    saveProject: async () => {
      const { currentProject } = get()
      if (!currentProject) return

      try {
        set({ isLoading: true, error: null })
        
        // Update project timestamp
        const updatedProject = {
          ...currentProject,
          updatedAt: getCurrentTimestamp(),
        }
        
        set({ currentProject: updatedProject })
        
        // Save to IndexedDB (will be implemented in storage layer)
        // await saveProjectToStorage(updatedProject)
        
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to save project' })
      } finally {
        set({ isLoading: false })
      }
    },

    clearProject: () => {
      set({
        currentProject: null,
        selectedNodeId: null,
        selectedEdgeId: null,
        currentMode: null,
        error: null,
      })
    },

    // Node operations
    addNode: (nodeData) => {
      const { currentProject } = get()
      if (!currentProject) return ''

      const now = getCurrentTimestamp()
      const nodeId = generateId()
      
      const node: MapNode = {
        ...nodeData,
        id: nodeId,
        meta: {
          ...(nodeData.meta || {}),
          createdAt: now,
          updatedAt: now,
        },
      }

      const updatedProject = {
        ...currentProject,
        nodes: [...currentProject.nodes, node],
        updatedAt: now,
      }

      set({ currentProject: updatedProject })
      return nodeId
    },

    updateNode: (id, updates) => {
      const { currentProject } = get()
      if (!currentProject) return

      const now = getCurrentTimestamp()
      const updatedProject = {
        ...currentProject,
        nodes: currentProject.nodes.map(node =>
          node.id === id
            ? { 
                ...node, 
                ...updates,
                meta: { 
                  ...node.meta, 
                  ...updates.meta,
                  updatedAt: now 
                }
              }
            : node
        ),
        updatedAt: now,
      }

      set({ currentProject: updatedProject })
    },

    deleteNode: (id) => {
      const { currentProject, selectedNodeId } = get()
      if (!currentProject) return

      const now = getCurrentTimestamp()
      const updatedProject = {
        ...currentProject,
        nodes: currentProject.nodes.filter(node => node.id !== id),
        edges: currentProject.edges.filter(edge => edge.from !== id && edge.to !== id),
        updatedAt: now,
      }

      set({ 
        currentProject: updatedProject,
        selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
      })
    },

    selectNode: (id) => {
      set({ selectedNodeId: id, selectedEdgeId: null })
    },

    // Edge operations
    addEdge: (edgeData) => {
      const { currentProject } = get()
      if (!currentProject) return ''

      const edgeId = generateId()
      const edge: MapEdge = {
        ...edgeData,
        id: edgeId,
      }

      const updatedProject = {
        ...currentProject,
        edges: [...currentProject.edges, edge],
        updatedAt: getCurrentTimestamp(),
      }

      set({ currentProject: updatedProject })
      return edgeId
    },

    updateEdge: (id, updates) => {
      const { currentProject } = get()
      if (!currentProject) return

      const updatedProject = {
        ...currentProject,
        edges: currentProject.edges.map(edge =>
          edge.id === id ? { ...edge, ...updates } : edge
        ),
        updatedAt: getCurrentTimestamp(),
      }

      set({ currentProject: updatedProject })
    },

    deleteEdge: (id) => {
      const { currentProject, selectedEdgeId } = get()
      if (!currentProject) return

      const updatedProject = {
        ...currentProject,
        edges: currentProject.edges.filter(edge => edge.id !== id),
        updatedAt: getCurrentTimestamp(),
      }

      set({ 
        currentProject: updatedProject,
        selectedEdgeId: selectedEdgeId === id ? null : selectedEdgeId,
      })
    },

    selectEdge: (id) => {
      set({ selectedEdgeId: id, selectedNodeId: null })
    },

    // Mode management
    setMode: (mode) => {
      set({ currentMode: mode })
    },

    // State management
    setLoading: (loading) => {
      set({ isLoading: loading })
    },

    setError: (error) => {
      set({ error })
    },
  }))
)