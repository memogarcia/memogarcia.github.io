---
title: "Mastering Claude Code: From Basic Hooks to Production Workflows"
date: 2025-01-19T10:00:00-06:00
draft: false
---

## The Problem Nobody Talks About

You've installed Claude Code. You've written some Python. Maybe you've even built a few APIs. But every time you start a new project, you're doing the same dance: manually formatting code, forgetting to run tests, missing edge cases in reviews, and switching mental contexts between documentation and implementation.

What if your AI assistant could handle all of this... automatically?

Here's what we're actually building: a task management API that progressively gains superpowers through Claude Code's configuration system. By the end, you'll have an environment where Claude automatically formats your code, reviews it for security issues, adapts its output style based on what you're doing, and even integrates with external services.

But here's the thing... most tutorials show you isolated features. This one shows you how they work together.

## What You'll Actually Learn

We're going to build a production-ready development environment, layer by layer:

1. **Hooks** that automatically format and validate your code
2. **Agents** that review your code like a senior engineer would
3. **Output styles** that adapt to whether you're exploring or shipping
4. **MCP servers** that connect to external documentation and services
5. **Orchestration** that combines everything into a workflow that actually works

Let's start from zero and build something real.

## Part 1: Foundation (Basic Hooks for Code Formatting)

First, let's create our project. We're using `uv` because it's fast and it actually works.

```bash
# Create the project structure
uv init task-api
cd task-api

# Add our dependencies
uv add fastapi uvicorn sqlalchemy pydantic-settings
uv add --dev pytest pytest-asyncio black ruff mypy
```

Now, here's our starting API. Nothing fancy, just enough to be real:

```python
# src/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List, Optional
import uuid

app = FastAPI(title="Task API")

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    completed: bool = False
    created_at: Optional[datetime] = None

# In-memory storage for now
tasks: Dict[str, Task] = {}

@app.post("/tasks", response_model=Task)
async def create_task(task: Task):
    task.id = str(uuid.uuid4())
    task.created_at = datetime.now()
    tasks[task.id] = task
    return task

@app.get("/tasks", response_model=List[Task])
async def list_tasks():
    return list(tasks.values())

@app.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]
```

### Adding Your First Hook

Now for the magic. Create a `.claude/hooks.yml` file in your project root:

```yaml
# .claude/hooks.yml
version: "1.0"

hooks:
  post_file_edit:
    - name: "Format Python Code"
      pattern: "**/*.py"
      command: "black {file_path}"
      description: "Automatically format Python files after editing"
    
    - name: "Lint Python Code"
      pattern: "**/*.py"
      command: "ruff check {file_path}"
      description: "Check for common Python issues"
      continue_on_error: true  # Don't block on linting errors
```

What's happening here? Every time Claude edits a Python file, it automatically:
1. Formats it with Black (no more formatting debates)
2. Checks it with Ruff (catches common mistakes)

But wait, there's more. Let's add a pre-commit hook that ensures tests pass:

```yaml
# .claude/hooks.yml (continued)
  pre_commit:
    - name: "Run Tests"
      command: "pytest tests/ -v"
      description: "Ensure tests pass before committing"
      continue_on_error: false  # Block commit if tests fail
    
    - name: "Type Check"
      command: "mypy src/ --ignore-missing-imports"
      description: "Verify type hints are correct"
      continue_on_error: true  # Warn but don't block
```

### Observable Results

Ask Claude to add a new endpoint:

```
Claude, add a PATCH endpoint to update task completion status
```

Watch what happens:
1. Claude writes the code
2. Black formats it automatically
3. Ruff checks for issues
4. You see the clean, validated result

No manual steps. No "oh, I forgot to format." It just works.

## Part 2: Intelligence (Code Review Agents)

Hooks handle the mechanical stuff. Now let's add intelligence.

Create `.claude/agents.yml`:

```yaml
# .claude/agents.yml
version: "1.0"

agents:
  security-reviewer:
    description: "Reviews code for security vulnerabilities"
    expertise:
      - OWASP Top 10
      - SQL injection prevention
      - Input validation
      - Authentication patterns
    activation:
      - pattern: "**/*.py"
        trigger: "on_edit"
    prompts:
      review: |
        Review this code for security issues:
        - Check for SQL injection vulnerabilities
        - Verify input validation
        - Look for authentication bypasses
        - Check for exposed sensitive data
        Provide specific, actionable feedback.

  performance-analyst:
    description: "Analyzes code for performance issues"
    expertise:
      - Database query optimization
      - Async/await patterns
      - Memory management
      - Caching strategies
    activation:
      - pattern: "**/api/**/*.py"
        trigger: "on_significant_change"  # Only on major changes
    prompts:
      analyze: |
        Analyze performance implications:
        - Database query efficiency
        - N+1 query problems
        - Memory usage patterns
        - Potential bottlenecks
        Focus on actionable improvements.
```

Now let's trigger these agents. Update your main.py with a deliberately problematic endpoint:

```python
# Add this endpoint to main.py
@app.get("/tasks/search")
async def search_tasks(q: str):
    # Deliberately problematic for demonstration
    results = []
    for task in tasks.values():
        # This is inefficient and potentially unsafe
        if q in task.title or q in task.description:
            results.append(task)
    return results
```

When you save this, watch the agents activate:

**Security Reviewer says:**
```
⚠️ Security Issue: Unbounded search query
- No input validation on 'q' parameter
- No rate limiting
- Potential for regex DoS if extended to pattern matching
Fix: Add query length limits and sanitization
```

**Performance Analyst says:**
```
⚠️ Performance Issue: O(n) search on every request
- Full table scan equivalent
- No indexing capability
- Memory inefficient for large datasets
Fix: Consider adding search indexing or pagination
```

### Agent Collaboration

Here's where it gets interesting. Agents can work together:

```yaml
# .claude/agents.yml (additional configuration)
  api-designer:
    description: "Ensures API consistency and best practices"
    collaboration:
      consults: [security-reviewer, performance-analyst]
    prompts:
      design: |
        Review API design for:
        - RESTful conventions
        - Response consistency
        - Error handling patterns
        Incorporate feedback from security and performance agents.
```

## Part 3: Adaptation (Output Styles for Different Modes)

Sometimes you want quick exploration. Sometimes you need production-ready code. Let's configure different modes.

Create `.claude/output-styles.yml`:

```yaml
# .claude/output-styles.yml
version: "1.0"

styles:
  exploration:
    description: "Quick prototyping and idea exploration"
    characteristics:
      verbosity: minimal
      comments: sparse
      error_handling: basic
      testing: skip
    format:
      code_blocks: inline
      explanations: brief
    example_trigger: "Let's explore..."

  production:
    description: "Production-ready implementation"
    characteristics:
      verbosity: comprehensive
      comments: detailed
      error_handling: robust
      testing: required
    format:
      code_blocks: full_file
      explanations: thorough
    includes:
      - Type hints
      - Docstrings
      - Error handling
      - Logging
      - Tests
    example_trigger: "Production implementation..."

  teaching:
    description: "Educational mode with heavy explanations"
    characteristics:
      verbosity: educational
      comments: extensive
      error_handling: demonstrative
      testing: explained
    format:
      code_blocks: incremental
      explanations: step_by_step
    example_trigger: "Explain how..."
```

### See the Difference

Ask Claude the same question in different modes:

**Exploration Mode:**
```python
# Quick and dirty task filtering
@app.get("/tasks/active")
async def get_active_tasks():
    return [t for t in tasks.values() if not t.completed]
```

**Production Mode:**
```python
from typing import List, Optional
from fastapi import Query
import logging

logger = logging.getLogger(__name__)

@app.get(
    "/tasks/active",
    response_model=List[Task],
    summary="Get active tasks",
    description="Retrieve all tasks that are not completed",
    response_description="List of active tasks",
)
async def get_active_tasks(
    limit: Optional[int] = Query(
        100,
        ge=1,
        le=1000,
        description="Maximum number of tasks to return"
    ),
    offset: Optional[int] = Query(
        0,
        ge=0,
        description="Number of tasks to skip"
    ),
) -> List[Task]:
    """
    Retrieve active (uncompleted) tasks with pagination support.
    
    Args:
        limit: Maximum number of tasks to return (1-1000)
        offset: Number of tasks to skip for pagination
    
    Returns:
        List of active Task objects
    
    Raises:
        HTTPException: If pagination parameters are invalid
    """
    try:
        logger.info(f"Fetching active tasks: limit={limit}, offset={offset}")
        
        active_tasks = [
            task for task in tasks.values()
            if not task.completed
        ]
        
        # Apply pagination
        paginated_tasks = active_tasks[offset:offset + limit]
        
        logger.info(f"Returning {len(paginated_tasks)} active tasks")
        return paginated_tasks
        
    except Exception as e:
        logger.error(f"Error fetching active tasks: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching tasks"
        )
```

Same functionality. Completely different approach based on context.

## Part 4: Extension (MCP Servers for External Integrations)

Now we connect to the outside world. MCP servers let Claude access external services and documentation.

Create `.claude/mcp-servers.yml`:

```yaml
# .claude/mcp-servers.yml
version: "1.0"

servers:
  postgres:
    type: database
    connection:
      host: localhost
      port: 5432
      database: tasks_db
    capabilities:
      - schema_inspection
      - query_execution
      - migration_generation
    usage:
      description: "Direct database access for schema design and queries"
      
  redis:
    type: cache
    connection:
      host: localhost
      port: 6379
    capabilities:
      - key_operations
      - cache_patterns
      - monitoring
    usage:
      description: "Cache management and session storage"

  documentation:
    type: web
    endpoints:
      fastapi: "https://fastapi.tiangolo.com/reference/"
      sqlalchemy: "https://docs.sqlalchemy.org/en/20/"
    capabilities:
      - fetch_docs
      - search_api
      - example_retrieval
    usage:
      description: "Fetch latest documentation and examples"

  github:
    type: vcs
    repository: "your-org/task-api"
    capabilities:
      - issue_creation
      - pr_management
      - code_search
    usage:
      description: "Integrate with GitHub for issue tracking"
```

### Real Database Integration

Now let's evolve our in-memory storage to a real database:

```python
# src/database.py
from sqlalchemy import create_engine, Column, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/tasks_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String)
    completed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)
```

With MCP servers configured, Claude can now:
- Generate optimal database queries
- Suggest caching strategies
- Pull latest API documentation
- Create GitHub issues for bugs

### Observable MCP Behavior

Ask Claude: "Optimize the search endpoint with database full-text search"

Claude will:
1. Connect to the postgres MCP server
2. Check available PostgreSQL extensions
3. Generate migration for full-text search
4. Implement the optimized endpoint
5. Add appropriate caching with Redis

```python
# Claude generates this with MCP assistance
from sqlalchemy import func, Index
from sqlalchemy.dialects.postgresql import TSVECTOR

class TaskModel(Base):
    __tablename__ = "tasks"
    
    # ... existing columns ...
    
    # Full-text search vector
    search_vector = Column(TSVECTOR)
    
    __table_args__ = (
        Index(
            'idx_task_search',
            'search_vector',
            postgresql_using='gin'
        ),
    )

@app.get("/tasks/search")
async def search_tasks(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db)
):
    # MCP-assisted optimal query
    results = db.query(TaskModel).filter(
        TaskModel.search_vector.match(q)
    ).limit(50).all()
    
    # Redis caching based on MCP recommendations
    cache_key = f"search:{q}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # ... rest of implementation
```

## Part 5: Orchestration (Complete Workflow)

Now let's bring it all together. Create `.claude/workflow.yml`:

```yaml
# .claude/workflow.yml
version: "1.0"

workflows:
  feature_development:
    description: "Complete feature development workflow"
    steps:
      - name: "Design"
        agent: api-designer
        style: exploration
        actions:
          - Generate endpoint specification
          - Define data models
          
      - name: "Implementation"
        style: production
        hooks:
          - Format Python Code
          - Lint Python Code
        actions:
          - Write endpoint code
          - Add error handling
          - Implement logging
          
      - name: "Testing"
        agent: test-engineer
        actions:
          - Generate unit tests
          - Create integration tests
          - Run test suite
          
      - name: "Review"
        agents: [security-reviewer, performance-analyst]
        actions:
          - Security audit
          - Performance analysis
          - Generate review report
          
      - name: "Documentation"
        style: teaching
        mcp_servers: [documentation]
        actions:
          - Generate API docs
          - Create examples
          - Update README

  hotfix:
    description: "Emergency fix workflow"
    steps:
      - name: "Identify"
        mcp_servers: [github, postgres]
        actions:
          - Analyze issue
          - Query database for impact
          
      - name: "Fix"
        style: production
        agent: security-reviewer
        priority: high
        actions:
          - Implement fix
          - Security validation
          
      - name: "Deploy"
        hooks:
          - Run Tests
          - Type Check
        actions:
          - Create hotfix PR
          - Run CI/CD checks
```

### Triggering a Complete Workflow

Now when you tell Claude: "Implement task categories feature", here's what happens:

**Step 1: Design Phase**
```python
# Claude starts in exploration mode
# Generates quick spec:
"""
Feature: Task Categories
- Each task can belong to one category
- Categories: work, personal, urgent
- Filter tasks by category
- Category statistics endpoint
"""
```

**Step 2: Implementation Phase**
```python
# Switches to production mode
# Creates migration with MCP assistance
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#gray")
    task_count = Column(Integer, default=0)

# Updates Task model
class TaskModel(Base):
    # ... existing fields ...
    category_id = Column(String, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="tasks")
```

**Step 3: Testing Phase**
```python
# Test engineer agent generates
async def test_task_categories():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create category
        category_response = await client.post(
            "/categories",
            json={"name": "work", "color": "#blue"}
        )
        assert category_response.status_code == 201
        
        # Create task with category
        task_response = await client.post(
            "/tasks",
            json={
                "title": "Review PR",
                "category_id": category_response.json()["id"]
            }
        )
        assert task_response.status_code == 201
        assert task_response.json()["category"]["name"] == "work"
```

**Step 4: Review Phase**
```
Security Review: ✅ PASSED
- Input validation present
- No SQL injection vectors
- Proper authorization checks

Performance Review: ⚠️ NEEDS OPTIMIZATION
- Consider indexing category_id
- Add eager loading for category relationship
- Implement category count caching
```

**Step 5: Documentation**
```markdown
## Task Categories

Tasks can now be organized into categories for better organization.

### Creating a Category
POST /categories
{
  "name": "work",
  "color": "#0066cc"
}

### Assigning Tasks to Categories
POST /tasks
{
  "title": "Complete project",
  "category_id": "category-123"
}

### Filtering by Category
GET /tasks?category=work

Returns all tasks in the "work" category...
```

## Troubleshooting Common Issues

### Hooks Not Firing

Check your `.claude/hooks.yml` syntax:
```yaml
# ❌ Wrong
hooks:
  post_file_edit:
    name: "Format"  # Missing list structure

# ✅ Correct  
hooks:
  post_file_edit:
    - name: "Format"  # Proper list item
```

### Agents Not Activating

Verify activation patterns:
```yaml
# ❌ Too specific
activation:
  - pattern: "/home/user/project/src/main.py"

# ✅ Flexible
activation:
  - pattern: "**/*.py"
```

### MCP Connection Failures

Test connections manually:
```bash
# Test database connection
psql -h localhost -U user -d tasks_db -c "SELECT 1"

# Test Redis
redis-cli ping
```

### Style Not Switching

Be explicit in your prompts:
```
# ❌ Ambiguous
"Add a new endpoint"

# ✅ Clear mode indication
"Production implementation: Add a new endpoint with full error handling"
```

## Advanced Patterns

### Conditional Hooks

```yaml
hooks:
  post_file_edit:
    - name: "Format Large Files"
      pattern: "**/*.py"
      condition: "file_size > 1000"  # Only for files over 1KB
      command: "black {file_path}"
```

### Agent Chaining

```yaml
agents:
  architect:
    triggers_next: [implementer, tester]
    
  implementer:
    requires_approval_from: [architect]
    triggers_next: [tester]
    
  tester:
    final: true
    generates_report: true
```

### Dynamic MCP Configuration

```yaml
servers:
  database:
    type: dynamic
    config_from_env:
      - DATABASE_URL
      - DB_POOL_SIZE
    fallback:
      type: sqlite
      path: "./dev.db"
```

## Where This Goes Next

You've built a development environment that:
- Automatically formats and validates code
- Reviews changes for security and performance
- Adapts output based on your current needs
- Integrates with external services and documentation
- Orchestrates complex workflows automatically

But here's the real power: this isn't just about saving time. It's about maintaining consistency, catching issues early, and letting you focus on the interesting problems instead of the repetitive ones.

Some ideas for extending this:
- Add monitoring MCP servers for production insights
- Create specialized agents for your domain (e.g., `payment-security-expert`)
- Build workflow templates for common tasks
- Integrate with your CI/CD pipeline

The key insight? Claude Code isn't just an AI assistant. With proper configuration, it becomes a complete development environment that understands your standards, enforces your practices, and accelerates your workflow.

Maybe you don't need all of this. Maybe you just want the formatting hooks. That's fine too. Start small, add what provides value, skip what doesn't.

But now you know what's possible.

## The Configuration Files You Need

Here's everything in one place for easy copy-paste:

### Complete Project Structure
```
task-api/
├── .claude/
│   ├── hooks.yml
│   ├── agents.yml
│   ├── output-styles.yml
│   ├── mcp-servers.yml
│   └── workflow.yml
├── src/
│   ├── main.py
│   ├── database.py
│   └── models.py
├── tests/
│   └── test_api.py
├── pyproject.toml
└── .env
```

Remember: configuration is powerful, but it's not magic. It's about encoding your best practices so they happen automatically. Start with what annoys you most, automate that, then build from there.

The best development environment is the one that gets out of your way and lets you focus on solving interesting problems.

Now go build something cool.

---

*Note: This tutorial assumes Claude Code v2.0+ with MCP support. Some features may vary based on your Claude Code version and available MCP servers.*