import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useProjectStore } from '@/state/projectStore'
import { DrillerNode } from './DrillerNode'
import { DrillerEdge } from './DrillerEdge'

const nodeTypes: NodeTypes = {
  driller: DrillerNode,
}

const edgeTypes: EdgeTypes = {
  driller: DrillerEdge,
}

export function DrillerCanvas() {
  const { currentProject, addEdge: addProjectEdge, updateNode } = useProjectStore()

  // Convert project nodes/edges to ReactFlow format
  const reactFlowNodes = useMemo(() => {
    if (!currentProject) return []
    
    return currentProject.nodes.map(node => ({
      id: node.id,
      type: 'driller',
      position: node.position,
      data: {
        node,
        onUpdate: (updates: Partial<typeof node>) => updateNode(node.id, updates),
      },
    }))
  }, [currentProject, updateNode])

  const reactFlowEdges = useMemo(() => {
    if (!currentProject) return []
    
    return currentProject.edges.map(edge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: 'driller',
      label: edge.label,
      data: { edge },
    }))
  }, [currentProject])

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges)

  // Update ReactFlow state when project changes
  useMemo(() => {
    setNodes(reactFlowNodes)
    setEdges(reactFlowEdges)
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addProjectEdge({
          from: params.source,
          to: params.target,
          label: 'connected to',
        })
      }
    },
    [addProjectEdge]
  )

  const onNodeDrag = useCallback(
    (_event: any, node: Node) => {
      updateNode(node.id, { position: node.position })
    },
    [updateNode]
  )

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Loaded</h3>
          <p className="text-gray-600">Create a new project to start analyzing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDrag}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const nodeData = node.data?.node
            if (!nodeData) return '#e5e7eb'
            
            const colors = {
              root: '#ef4444',
              question: '#3b82f6',
              answer: '#10b981',
              evidence: '#f59e0b',
              hypothesis: '#8b5cf6',
              cause: '#ec4899',
              category: '#06b6d4',
              conclusion: '#84cc16',
            }
            
            return colors[nodeData.type as keyof typeof colors] || '#e5e7eb'
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}