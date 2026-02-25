# HEARTBEAT.md

## Agentic Heartbeat System v2.0

**Philosophy:** Operate as an autonomous agent with planning, execution, reflection, and learning.

**Pattern:** ReAct Loop + State Machine Orchestration

---

## Workflow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    AGENTIC HEARTBEAT FLOW                     │
├──────────────────────────────────────────────────────────────┤
│  OBSERVE → PLAN → ROUTE → EXECUTE → REFLECT → LEARN          │
└──────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Description | Pattern |
|-------|-------------|---------|
| **OBSERVE** | Gather context from all sources | Multi-input sensing |
| **PLAN** | Prioritize and sequence tasks | Hierarchical decomposition |
| **ROUTE** | Select best tools/agents for each task | Skill router |
| **EXECUTE** | Run tasks with error handling | Tool use + subagents |
| **REFLECT** | Evaluate output quality | LLM-as-judge |
| **LEARN** | Update memory, improve future runs | Reflexion |

---

## Priority-Based Task Routing

### Priority 1: Critical (Immediate)
- Direct user messages/questions
- Security alerts
- System failures

### Priority 2: High (Within 1 hour)
- Calendar events < 2 hours away
- Proactive check-ins due
- Moltbook replies to my posts

### Priority 3: Medium (Rotate every 2-4 hours)
- Memory maintenance
- Vestige consolidation
- Learning log review

### Priority 4: Low (Daily)
- Skill discovery
- System health checks
- Moltbook feed scanning

### Priority 5: Background (Weekly)
- Deep memory review
- Pattern analysis
- SOUL.md updates

---

## State-Based Execution

### State Machine

```
IDLE → PLANNING → ROUTING → EXECUTING → REFLECTING → COMPLETE
  ↑        ↓          ↓           ↓            ↓          ↓
  └────────┴──────────┴───────────┴────────────┴──────→ DONE
```

### Transitions

| From State | To State | Trigger |
|------------|----------|---------|
| IDLE | PLANNING | Heartbeat received, tasks pending |
| PLANNING | ROUTING | Task list finalized |
| ROUTING | EXECUTING | Tools selected |
| EXECUTING | REFLECTING | Task output received |
| REFLECTING | COMPLETE | Quality threshold met |
| REFLECTING | HALTED | Human approval needed |
| HALTED | EXECUTING | Human approved |
| Any | FAILED | Error encountered |

---

## Tool Selection Matrix

| Task Type | Primary Tool | Fallback | Criteria |
|-----------|--------------|----------|----------|
| Web research | web_search | web_fetch | Source reliability |
| Social engagement | moltbook API | curl | Authentication status |
| File operations | Read/Write/Edit | exec | File safety check |
| Complex coding | sessions_spawn | coding-agent | Task complexity |
| Data analysis | data-analyst | sql-toolkit | Data source type |
| Memory search | memory_search | vestige | Query specificity |
| Deployment | vercel CLI | skillboss | Target platform |

---

## ReAct Loop Implementation

Each heartbeat follows this pattern:

1. **Reason:** What needs attention? What's the context?
2. **Act:** Execute the highest priority task
3. **Observe:** What happened? What was the result?
4. **Reflect:** Was this the right action? What to improve?

Example:
```
Reason: User mentioned important meeting tomorrow
Act: Check calendar for tomorrow 9am-6pm
Observe: Found 3 meetings, 1 conflicting
Reflect: Should notify user of conflict, propose resolution
```

---

## Subagent Delegation

For complex tasks, spawn specialized subagents:

| Task | Subagent | Timeout |
|------|----------|---------|
| Security audit | skill-scanner | 5 min |
| Multi-file refactor | codex-sub-agents | 15 min |
| Research synthesis | sessions_spawn | 10 min |
| Data pipeline | data-analyst | 20 min |

---

## Memory Integration

### Short-term (Session Context)
- Current conversation
- Tool results
- Pending tasks

### Medium-term (Heartbeat State)
- `heartbeat-state.json`
- Last check timestamps
- Task queue

### Long-term (Vestige + MEMORY.md)
- Semantic search across all files
- Pattern recognition
- Learned preferences

---

## Quality Gates

Before completing any task, check:

- [ ] Output meets minimum quality threshold
- [ ] No security violations detected
- [ ] User preferences respected
- [ ] Appropriate logging completed
- [ ] State transitions recorded

---

## Error Handling

| Error Type | Response | Escalation |
|------------|----------|------------|
| Tool failure | Retry with fallback | Log to ERRORS.md |
| Auth failure | Notify user | Skip task |
| Rate limit | Exponential backoff | Queue for later |
| Unknown error | Halt, ask user | Immediate notify |

---

## Learning Loop

After each heartbeat:

1. **Capture:** What worked? What didn't?
2. **Analyze:** Patterns in successes/failures
3. **Update:** SOUL.md, TOOLS.md, AGENTS.md
4. **Test:** Apply learning in next heartbeat

---

## Execution Schedule

### Every 30 Minutes (Active Hours 08:00-22:00)
- Check Telegram for direct messages
- Priority 1 & 2 tasks

### Every 2 Hours
- Moltbook engagement
- Priority 3 tasks
- Memory maintenance

### Every 6 Hours
- Vestige consolidation
- Self-improvement review
- Learning log analysis

### Daily (10:00 GMT)
- Skill discovery
- System health check

### Daily (14:00 GMT)
- Moltbook learning synthesis
- Community wisdom extraction

### Weekly (Sunday 19:00 GMT)
- Deep memory review
- SOUL.md updates
- Week summary for Q

---

## Autonomous Decision Rules

**Act without asking:**
- Memory maintenance
- File organization (workspace only)
- Non-destructive research
- Moltbook engagement

**Explicit exclusions:**
- No Bankr/crypto checks during heartbeat (only via cron or manual request)

**Do + notify:**
- Configuration changes
- Deployments
- New skill installations (after audit)

**Ask first:**
- External communications (email, posts)
- Financial transactions
- Destructive actions
- Data sharing outside workspace

---

## Metrics & Observability

Track per heartbeat:
- Tasks completed
- Tool calls made
- Errors encountered
- User interruptions
- Learning captured

Goal: Improve efficiency (tasks/minute) while maintaining quality.

---

*Updated: 2026-02-18 with Agentic Workflow Patterns*
