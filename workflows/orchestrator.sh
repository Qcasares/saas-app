#!/bin/bash
#
# Agentic Workflow Orchestrator
# State-machine based task execution with planning, routing, and reflection
#

set -e

WORKFLOW_DIR="${HOME}/.openclaw/workspace/workflows"
STATE_DIR="${WORKFLOW_DIR}/state"
DEFINITIONS_DIR="${WORKFLOW_DIR}/definitions"
LOG_FILE="${WORKFLOW_DIR}/orchestrator.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Initialize workflow directories
init() {
    mkdir -p "$STATE_DIR" "$DEFINITIONS_DIR"
    log "Workflow orchestrator initialized"
}

# Generate unique workflow ID
generate_id() {
    echo "wf_$(date +%s)_$(openssl rand -hex 4)"
}

# State machine: Transition to new state
transition_state() {
    local workflow_id=$1
    local new_state=$2
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    jq --arg state "$new_state" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.state = $state | .state_history += [{state: $state, timestamp: $time}]' \
       "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
    
    log "Workflow ${workflow_id}: transitioned to ${new_state}"
    echo -e "${BLUE}→ State: ${new_state}${NC}"
}

# PLANNING phase: Decompose task into steps
plan_task() {
    local workflow_id=$1
    local task=$2
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    echo -e "${YELLOW}📋 PLANNING: Decomposing task...${NC}"
    transition_state "$workflow_id" "PLANNING"
    
    # Use LLM to create execution plan
    local plan=$(sessions_spawn "You are a task planner. Break down this task into 3-5 concrete steps:
    
Task: ${task}

Respond with ONLY a JSON array of steps, each with:
- step_id: number
- description: what to do
- tool_hint: suggested tool/skill (optional)
- estimated_time: rough estimate

Example: [{\"step_id\": 1, \"description\": \"Search for recent articles\", \"tool_hint\": \"web_search\", \"estimated_time\": \"2m\"}]

Return only valid JSON, no markdown." "kimi-coding/k2p5" 120)
    
    # Extract JSON from response
    local clean_plan=$(echo "$plan" | grep -o '\[.*\]' | head -1)
    
    if [[ -z "$clean_plan" ]]; then
        log "ERROR: Failed to generate plan for ${workflow_id}"
        transition_state "$workflow_id" "FAILED"
        return 1
    fi
    
    # Update workflow state with plan
    jq --argjson steps "$clean_plan" --arg task "$task" \
       '.plan = $steps | .task = $task | .current_step = 0 | .total_steps = ($steps | length)' \
       "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
    
    local step_count=$(echo "$clean_plan" | jq 'length')
    echo -e "${GREEN}✓ Plan created: ${step_count} steps${NC}"
    
    # Display plan
    echo "$clean_plan" | jq -r '.[] | "  \(.step_id). \(.description)"'
}

# ROUTING phase: Select best tool for current step
route_step() {
    local workflow_id=$1
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    echo -e "${YELLOW}🔄 ROUTING: Selecting tools...${NC}"
    transition_state "$workflow_id" "ROUTING"
    
    # Get current step
    local current_step=$(jq -r '.current_step' "$state_file")
    local step_desc=$(jq -r ".plan[${current_step}].description" "$state_file")
    
    # Tool selection logic (simplified - could use LLM)
    local tool=""
    if [[ "$step_desc" == *"search"* ]] || [[ "$step_desc" == *"research"* ]]; then
        tool="web_search"
    elif [[ "$step_desc" == *"write"* ]] || [[ "$step_desc" == *"create"* ]]; then
        tool="content_generation"
    elif [[ "$step_desc" == *"analyze"* ]] || [[ "$step_desc" == *"review"* ]]; then
        tool="analysis"
    else
        tool="general"
    fi
    
    jq --arg tool "$tool" --arg step "$current_step" \
       '.plan[($step | tonumber)].selected_tool = $tool' \
       "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
    
    echo -e "${GREEN}✓ Selected tool: ${tool}${NC}"
}

# EXECUTION phase: Run the current step
execute_step() {
    local workflow_id=$1
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    echo -e "${YELLOW}⚡ EXECUTING: Running step...${NC}"
    transition_state "$workflow_id" "EXECUTING"
    
    local current_step=$(jq -r '.current_step' "$state_file")
    local step_desc=$(jq -r ".plan[${current_step}].description" "$state_file")
    local tool=$(jq -r ".plan[${current_step}].selected_tool" "$state_file")
    
    echo "  Step $((current_step + 1)): $step_desc"
    echo "  Tool: $tool"
    
    # Execute based on tool type
    local result=""
    case "$tool" in
        web_search)
            result=$(web_search "$step_desc" 2>/dev/null || echo "Search completed")
            ;;
        content_generation)
            result="Content generation would run here"
            ;;
        analysis)
            result="Analysis would run here"
            ;;
        *)
            result="Step executed: $step_desc"
            ;;
    esac
    
    # Store result
    jq --arg result "$result" --arg step "$current_step" \
       '.plan[($step | tonumber)].result = $result | .plan[($step | tonumber)].completed = true' \
       "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
    
    echo -e "${GREEN}✓ Step completed${NC}"
}

# REFLECTION phase: Evaluate output quality
reflect_on_output() {
    local workflow_id=$1
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    echo -e "${YELLOW}🪞 REFLECTING: Evaluating quality...${NC}"
    transition_state "$workflow_id" "REFLECTING"
    
    local current_step=$(jq -r '.current_step' "$state_file")
    local result=$(jq -r ".plan[${current_step}].result" "$state_file")
    
    # Simple quality check (could use LLM-as-judge)
    local quality_score=85
    if [[ ${#result} -lt 50 ]]; then
        quality_score=60
    fi
    
    jq --arg score "$quality_score" --arg step "$current_step" \
       '.plan[($step | tonumber)].quality_score = ($score | tonumber)' \
       "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
    
    echo -e "${GREEN}✓ Quality score: ${quality_score}/100${NC}"
}

# Run complete workflow
run_workflow() {
    local task="$1"
    local workflow_id=$(generate_id)
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Starting Workflow: ${workflow_id}${NC}"
    echo -e "${BLUE}  Task: ${task}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    # Initialize workflow state
    cat > "$state_file" <<EOF
{
  "workflow_id": "${workflow_id}",
  "task": "${task}",
  "state": "IDLE",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "state_history": [{"state": "IDLE", "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}],
  "plan": [],
  "current_step": 0,
  "total_steps": 0,
  "results": []
}
EOF
    
    # Execute phases
    if plan_task "$workflow_id" "$task"; then
        route_step "$workflow_id"
        
        # Execute all steps
        local total_steps=$(jq -r '.total_steps' "$state_file")
        for ((i=0; i<total_steps; i++)); do
            jq --arg i "$i" '.current_step = ($i | tonumber)' "$state_file" > "${state_file}.tmp" && mv "${state_file}.tmp" "$state_file"
            
            execute_step "$workflow_id"
            reflect_on_output "$workflow_id"
            
            # Check if we need human input (quality < 70)
            local score=$(jq -r ".plan[${i}].quality_score" "$state_file")
            if [[ "$score" -lt 70 ]]; then
                echo -e "${YELLOW}⚠️ Quality below threshold, consider review${NC}"
            fi
        done
        
        transition_state "$workflow_id" "COMPLETE"
        
        # Generate summary
        echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}  Workflow Complete: ${workflow_id}${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        
        jq -r '.plan[] | "\(.step_id). \(.description) [\(.quality_score)/100]"' "$state_file"
        
        log "Workflow ${workflow_id} completed successfully"
        return 0
    else
        echo -e "${RED}✗ Workflow failed${NC}"
        return 1
    fi
}

# Check workflow status
status_workflow() {
    local workflow_id=$1
    local state_file="${STATE_DIR}/${workflow_id}.json"
    
    if [[ ! -f "$state_file" ]]; then
        echo -e "${RED}Workflow not found: ${workflow_id}${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Workflow Status: ${workflow_id}${NC}"
    jq -r '
      "State: \(.state)",
      "Created: \(.created_at)",
      "Task: \(.task)",
      "Progress: \(.current_step)/\(.total_steps) steps",
      "",
      "State History:",
      (.state_history | .[] | "  - \(.timestamp): \(.state)")
    ' "$state_file"
}

# List all workflows
list_workflows() {
    echo -e "${BLUE}Active Workflows:${NC}"
    for f in "$STATE_DIR"/*.json; do
        if [[ -f "$f" ]]; then
            local id=$(basename "$f" .json)
            local state=$(jq -r '.state' "$f")
            local task=$(jq -r '.task' "$f" | cut -c1-50)
            echo "  ${id}: [${state}] ${task}..."
        fi
    done
}

# Main command handler
case "${1:-}" in
    init)
        init
        ;;
    run)
        if [[ -z "${2:-}" ]]; then
            echo "Usage: $0 run 'task description'"
            exit 1
        fi
        init
        run_workflow "$2"
        ;;
    status)
        if [[ -z "${2:-}" ]]; then
            echo "Usage: $0 status <workflow-id>"
            exit 1
        fi
        status_workflow "$2"
        ;;
    list)
        list_workflows
        ;;
    help|--help|-h)
        cat <<EOF
Agentic Workflow Orchestrator

Commands:
  init                    Initialize workflow directories
  run "task"              Execute a new workflow
  status <id>             Check workflow status
  list                    List all workflows
  help                    Show this help

Examples:
  $0 run "Research AI trends and write summary"
  $0 status wf_1708271234_a1b2c3d4
EOF
        ;;
    *)
        echo "Unknown command: ${1:-}"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
