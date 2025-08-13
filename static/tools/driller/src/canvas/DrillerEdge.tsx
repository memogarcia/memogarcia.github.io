import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import type { MapEdge } from '@/types'

interface DrillerEdgeData {
  edge: MapEdge
}

export const DrillerEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<DrillerEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edge = data?.edge

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
        stroke="#374151"
        strokeWidth={2}
      />
      
      {edge?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="bg-white px-2 py-1 rounded border border-gray-300 text-gray-700 font-medium shadow-sm"
          >
            {edge.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

DrillerEdge.displayName = 'DrillerEdge'