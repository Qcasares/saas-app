# Agentic Workflow Orchestrator

A state-machine based workflow engine for complex multi-step agent tasks.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Orchestrator                     │
├─────────────────────────────────────────────────────────────┤
│  Planner → Router → Executor → Refiner → Interface          │
└─────────────────────────────────────────────────────────────┘
```

## State Machine States

- `IDLE` - Ready to receive task
- `PLANNING` - Decomposing task into steps
- `ROUTING` - Selecting tools/agents for each step
- `EXECUTING` - Running current step
- `REFLECTING` - Evaluating output quality
- `HALTED` - Waiting for human input
- `COMPLETE` - Task finished successfully
- `FAILED` - Task failed, error logged

## Usage

```bash
# Run a complex workflow
./scripts/workflow-orchestrator.sh run "Research and summarize latest AI trends"

# Check workflow status
./scripts/workflow-orchestrator.sh status <workflow-id>

# Resume halted workflow
./scripts/workflow-orchestrator.sh resume <workflow-id>
```

## Configuration

Workflows are defined in `workflows/definitions/*.json`

## Patterns Implemented

1. **ReAct Loop** - Reasoning + Acting with tool use
2. **Planner-Executor Split** - Separate planning and execution models
3. **Hierarchical Decomposition** - Manager + specialist pattern
4. **Reflexion** - Self-critique and iteration
5. **State Machine Orchestration** - Deterministic flow control
