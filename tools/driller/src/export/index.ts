import { toPng, toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import type { DrillerProject } from '@/types'

export async function exportCanvasImage(
  canvasElement: HTMLElement,
  format: 'png' | 'jpeg' = 'png',
  filename?: string
): Promise<void> {
  try {
    const dataUrl = format === 'png' 
      ? await toPng(canvasElement, { quality: 1.0 })
      : await toJpeg(canvasElement, { quality: 0.95 })
    
    const link = document.createElement('a')
    link.download = filename || `driller-canvas.${format}`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Failed to export canvas image:', error)
    throw new Error('Failed to export canvas image')
  }
}

export async function exportCanvasPDF(
  canvasElement: HTMLElement,
  filename?: string
): Promise<void> {
  try {
    const canvas = await toPng(canvasElement, { quality: 1.0 })
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvasElement.offsetWidth, canvasElement.offsetHeight]
    })
    
    pdf.addImage(
      canvas, 
      'PNG', 
      0, 
      0, 
      canvasElement.offsetWidth, 
      canvasElement.offsetHeight
    )
    
    pdf.save(filename || 'driller-canvas.pdf')
  } catch (error) {
    console.error('Failed to export canvas PDF:', error)
    throw new Error('Failed to export canvas PDF')
  }
}

export function exportProjectJSON(
  project: DrillerProject,
  filename?: string
): void {
  try {
    const dataStr = JSON.stringify(project, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const link = document.createElement('a')
    link.download = filename || `${project.name}.json`
    link.href = dataUri
    link.click()
  } catch (error) {
    console.error('Failed to export project JSON:', error)
    throw new Error('Failed to export project JSON')
  }
}

export function exportMarkdownSummary(
  project: DrillerProject,
  filename?: string
): void {
  try {
    let markdown = `# ${project.name}\n\n`
    markdown += `**Created:** ${new Date(project.createdAt).toLocaleDateString()}\n`
    markdown += `**Last Updated:** ${new Date(project.updatedAt).toLocaleDateString()}\n\n`
    
    if (project.summary) {
      markdown += project.summary
    } else {
      markdown += '## Nodes\n\n'
      project.nodes.forEach(node => {
        markdown += `### ${node.title} (${node.type})\n`
        if (node.body) {
          markdown += `${node.body}\n\n`
        }
        if (node.attachments && node.attachments.length > 0) {
          markdown += '**Attachments:**\n'
          node.attachments.forEach(attachment => {
            markdown += `- ${attachment.title || attachment.kind}: ${attachment.content || attachment.url || 'N/A'}\n`
          })
          markdown += '\n'
        }
      })
      
      markdown += '## Connections\n\n'
      project.edges.forEach(edge => {
        const fromNode = project.nodes.find(n => n.id === edge.from)
        const toNode = project.nodes.find(n => n.id === edge.to)
        if (fromNode && toNode) {
          markdown += `- **${fromNode.title}** ${edge.label || '→'} **${toNode.title}**\n`
        }
      })
    }
    
    const dataUri = 'data:text/markdown;charset=utf-8,'+ encodeURIComponent(markdown)
    
    const link = document.createElement('a')
    link.download = filename || `${project.name}.md`
    link.href = dataUri
    link.click()
  } catch (error) {
    console.error('Failed to export markdown summary:', error)
    throw new Error('Failed to export markdown summary')
  }
}

export function generateSummaryMarkdown(project: DrillerProject): string {
  if (project.summary) {
    return project.summary
  }
  
  // Generate a basic summary from the project structure
  let summary = `# ${project.name} - Analysis Summary\n\n`
  
  const rootNode = project.nodes.find(n => n.id === project.rootNodeId)
  if (rootNode) {
    summary += `## Problem Statement\n${rootNode.title}\n\n`
    if (rootNode.body) {
      summary += `${rootNode.body}\n\n`
    }
  }
  
  // Group nodes by type
  const nodesByType = project.nodes.reduce((acc, node) => {
    if (node.type !== 'root') {
      if (!acc[node.type]) acc[node.type] = []
      acc[node.type]!.push(node)
    }
    return acc
  }, {} as Record<string, typeof project.nodes>)
  
  Object.entries(nodesByType).forEach(([type, nodes]) => {
    summary += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`
    nodes.forEach(node => {
      summary += `- **${node.title}**`
      if (node.body) {
        summary += `: ${node.body}`
      }
      summary += '\n'
    })
    summary += '\n'
  })
  
  summary += `## Analysis Structure\n\n`
  summary += `This analysis includes ${project.nodes.length} nodes and ${project.edges.length} connections, exploring the relationships between different aspects of the problem.\n\n`
  
  return summary
}