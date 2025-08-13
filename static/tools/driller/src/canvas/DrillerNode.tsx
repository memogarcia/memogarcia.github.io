import { memo, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { truncateText } from '@/utils'
import type { MapNode } from '@/types'

interface DrillerNodeData {
  node: MapNode
  onUpdate: (updates: Partial<MapNode>) => void
}

export const DrillerNode = memo(({ data, selected }: NodeProps<DrillerNodeData>) => {
  const { node, onUpdate } = data

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ title: e.target.value })
    },
    [onUpdate]
  )

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ body: e.target.value })
    },
    [onUpdate]
  )

  // Node styling based on type
  const getNodeStyle = () => {
    const baseStyle = 'px-4 py-2 shadow-md rounded-lg border-2 bg-white min-w-[200px] max-w-[300px]'
    
    const typeStyles = {
      root: 'border-red-500 bg-red-50',
      question: 'border-blue-500 bg-blue-50',
      answer: 'border-green-500 bg-green-50',
      evidence: 'border-yellow-500 bg-yellow-50',
      hypothesis: 'border-purple-500 bg-purple-50',
      cause: 'border-pink-500 bg-pink-50',
      category: 'border-cyan-500 bg-cyan-50',
      conclusion: 'border-lime-500 bg-lime-50',
    }

    const selectedStyle = selected ? 'ring-2 ring-blue-400' : ''
    
    return `${baseStyle} ${typeStyles[node.type]} ${selectedStyle}`
  }

  const displayTitle = truncateText(node.title, 60)
  const displayBody = node.body ? truncateText(node.body, 100) : ''

  return (
    <div className={getNodeStyle()}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      
      {/* Node type badge */}
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {node.type}
      </div>
      
      {/* Title */}
      {selected ? (
        <input
          type="text"
          value={node.title}
          onChange={handleTitleChange}
          className="w-full font-medium bg-transparent border-none outline-none resize-none"
          placeholder="Node title..."
        />
      ) : (
        <div className="font-medium text-gray-900 mb-1">
          {displayTitle}
        </div>
      )}
      
      {/* Body */}
      {selected ? (
        <textarea
          value={node.body || ''}
          onChange={handleBodyChange}
          className="w-full text-sm text-gray-600 bg-transparent border-none outline-none resize-none min-h-[60px]"
          placeholder="Add details..."
        />
      ) : (
        displayBody && (
          <div className="text-sm text-gray-600">
            {displayBody}
          </div>
        )
      )}
      
      {/* Attachments indicator */}
      {node.attachments && node.attachments.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          📎 {node.attachments.length} attachment{node.attachments.length !== 1 ? 's' : ''}
        </div>
      )}
      
      {/* Metadata */}
      {node.meta.tags && node.meta.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.meta.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 text-xs bg-gray-200 rounded">
              {tag}
            </span>
          ))}
          {node.meta.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-200 rounded">
              +{node.meta.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  )
})

DrillerNode.displayName = 'DrillerNode'