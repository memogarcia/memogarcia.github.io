# CLAUDE

NEVER RUN `hugo commands`!!

## Repository Specifications

### Project Type
- **Hugo Static Site**: Personal blog/website (memo.mx)
- **Content Focus**: DevOps, cloud computing, Kubernetes, Python, systems thinking
- **Theme**: PaperMod with custom cyberpunk styling
- **Deployment**: Static site generation with GitHub Pages


### Content Structure
- **Posts**: `/content/posts/` - Technical blog posts and articles
- **Tools**: `/static/tools/` - Interactive JavaScript applications
- **Images**: `/content/img/` - Blog post images and assets
- **Context**: `/context/understanding/` - Ignore this

### Interactive Tools
- **Planner**: Project management canvas tool
- **Timer**: Pomodoro/focus timer
- **Reminder**: Task reminder system  
- **Eisenhower**: Priority matrix tool

## Specialized Agents for This Repository

### Primary Agents

#### `me-as-a-writer`
**Use for**: All blog content, technical documentation, and philosophical tech discussions
- Creates content in Memo Garcia's distinctive style
- Blends technical expertise with philosophical insights
- Self-deprecating humor and genuine accessibility
- Makes complex infrastructure topics approachable

#### `full-stack-developer` 
**Use for**: Interactive tools development and enhancement
- End-to-end development of JavaScript applications
- Integration of new features in existing tools
- CSS styling and responsive design improvements

#### `ui-designer`
**Use for**: Visual design and user experience improvements
- Cyberpunk theme consistency
- Interactive tool interface design
- Mobile responsiveness optimization

### Supporting Agents

#### `devrel-advocate`
**Use for**: Content strategy and community engagement
- Blog post planning and outlines
- Technical tutorial development
- API documentation for tools

#### `react-pro`
**Use for**: Advanced JavaScript/React components
- Complex interactive features
- State management in tools
- Component architecture improvements

#### `deployment-engineer`
**Use for**: Hugo build optimization and deployment
- CI/CD pipeline improvements
- Performance optimization
- Static site generation enhancements

#### `performance-engineer` 
**Use for**: Site speed and optimization
- Hugo build performance
- JavaScript tool optimization
- Image and asset optimization

#### `code-reviewer`
**Use for**: Quality assurance on all code changes
- JavaScript/CSS code review
- Hugo template validation
- Performance impact assessment

### Workflow-Specific Agents

#### For Blog Posts
1. `me-as-a-writer` - Content creation
2. `code-reviewer` - Technical accuracy
3. `deployment-engineer` - Build validation
4. `tech-blogger` - Tech blog creation

#### For Interactive Tools
1. `full-stack-developer` - Feature development
2. `ui-designer` - Design consistency
3. `performance-engineer` - Optimization
4. `code-reviewer` - Code quality

#### For Documentation
1. `me-as-a-writer` - Technical writing
2. `devrel-advocate` - Structure and accessibility
3. `api-documenter` - Technical specifications
4. `tech-blogger` - Tech blog creation

## MCP Server Integration

### Available MCP Servers

#### `context7`
**Use for**: Library documentation and code examples
- Retrieve up-to-date docs for any framework/library mentioned in blog posts
- Get code examples for JavaScript frameworks used in interactive tools
- Research latest APIs and best practices for technical content

#### `fetch`
**Use for**: Web content research and analysis
- Research latest trends in DevOps/cloud computing for blog posts
- Fetch documentation from external sources
- Analyze competitor blogs and technical resources
- Image processing for blog assets

#### `puppeteer`
**Use for**: Web automation and screenshots
- Generate screenshots of interactive tools for blog posts
- Test responsive design across different viewport sizes
- Automate testing of deployed tools
- Create visual assets for documentation

#### `sequential-thinking`
**Use for**: Complex problem-solving and planning
- Breaking down complex blog post topics into structured thinking
- Planning multi-step technical implementations
- Analyzing complex DevOps/cloud architecture topics
- Reflective problem-solving for interactive tool features

#### `shadcn-ui`
**Use for**: UI component research (when applicable)
- Reference modern component patterns for JavaScript tools
- Study accessibility patterns for interactive applications
- Research design system approaches

### MCP Integration Patterns

#### For Technical Blog Posts
1. `context7` - Research latest framework docs
2. `fetch` - Gather external technical resources
3. `me-as-a-writer` - Create content with current information

#### For Interactive Tool Development
1. `context7` - Get library documentation for dependencies
2. `puppeteer` - Test and screenshot functionality
3. `full-stack-developer` - Implement with latest best practices

#### For Content Research
1. `fetch` - Analyze industry trends and resources
2. `context7` - Verify technical accuracy of libraries/frameworks
3. `me-as-a-writer` - Synthesize into engaging content

### Best Practices
- Always use `context7` before writing about specific libraries/frameworks
- Use `fetch` to verify external links and gather supplementary research
- Leverage `puppeteer` for visual documentation of interactive tools
- Combine MCP servers with specialized agents for comprehensive solutions
