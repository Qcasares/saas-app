#!/bin/bash
#
# Reflexion Module - Self-critique and improvement for agentic workflows
# Implements Reflexion pattern from agentic AI research
#

REFLEXION_DIR="${HOME}/.openclaw/workspace/.learnings"
REFLEXION_LOG="${REFLEXION_DIR}/reflexion.log"

# Ensure directory exists
mkdir -p "$REFLEXION_DIR"

# Log a reflection
log_reflection() {
    local context="$1"
    local action="$2"
    local outcome="$3"
    local critique="$4"
    local improvement="$5"
    
    local entry=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "context": "$context",
  "action": "$action",
  "outcome": "$outcome",
  "critique": "$critique",
  "improvement": "$improvement",
  "applied": false
}
EOF
)
    
    echo "$entry" >> "$REFLEXION_LOG"
    echo "Reflection logged"
}

# Generate self-critique for a completed task
critique_task() {
    local task="$1"
    local result="$2"
    local expected="${3:-}"
    
    echo "=== Self-Critique ==="
    echo "Task: $task"
    echo "Result: ${result:0:100}..."
    
    # Quality dimensions
    local completeness=0
    local accuracy=0
    local efficiency=0
    
    # Completeness check
    if [[ -n "$result" ]] && [[ ${#result} -gt 50 ]]; then
        completeness=80
    elif [[ -n "$result" ]]; then
        completeness=50
    else
        completeness=20
    fi
    
    # Accuracy check (if expected provided)
    if [[ -n "$expected" ]]; then
        if [[ "$result" == *"$expected"* ]]; then
            accuracy=90
        else
            accuracy=40
        fi
    else
        accuracy=70
    fi
    
    # Efficiency heuristic
    efficiency=75
    
    local overall=$(( (completeness + accuracy + efficiency) / 3 ))
    
    echo "Scores:"
    echo "  Completeness: ${completeness}/100"
    echo "  Accuracy: ${accuracy}/100"
    echo "  Efficiency: ${efficiency}/100"
    echo "  Overall: ${overall}/100"
    
    # Generate critique based on scores
    local critique=""
    local improvement=""
    
    if [[ $overall -lt 60 ]]; then
        critique="Output quality below acceptable threshold. May need tool retry or human input."
        improvement="Add validation step, request clarification, or escalate to user."
    elif [[ $completeness -lt 70 ]]; then
        critique="Response incomplete. Missing details or truncated."
        improvement="Break into smaller subtasks or increase context window."
    elif [[ $accuracy -lt 60 ]]; then
        critique="Potential accuracy issues. Output may not match requirements."
        improvement="Add verification step or cross-reference with sources."
    else
        critique="Task completed satisfactorily."
        improvement="Document successful pattern for future reuse."
    fi
    
    echo "Critique: $critique"
    echo "Improvement: $improvement"
    
    # Log the reflection
    log_reflection "$task" "executed" "$result" "$critique" "$improvement"
    
    return $(( 100 - overall ))  # Return inverse as exit code (0 = perfect)
}

# Review recent reflections for patterns
review_reflections() {
    local days="${1:-7}"
    
    echo "=== Reflection Review (Last ${days} days) ==="
    
    if [[ ! -f "$REFLEXION_LOG" ]]; then
        echo "No reflections found"
        return
    fi
    
    # Count reflections
    local count=$(grep -c '"timestamp"' "$REFLEXION_LOG" 2>/dev/null || echo "0")
    echo "Total reflections: $count"
    
    # Extract patterns (simple grep approach)
    echo ""
    echo "Common critiques:"
    grep '"critique"' "$REFLEXION_LOG" | sed 's/.*"critique": "\([^"]*\)".*/  - \1/' | sort | uniq -c | sort -rn | head -5
    
    echo ""
    echo "Suggested improvements:"
    grep '"improvement"' "$REFLEXION_LOG" | sed 's/.*"improvement": "\([^"]*\)".*/  - \1/' | sort | uniq -c | sort -rn | head -5
}

# Apply learning from reflections
apply_learning() {
    echo "=== Applying Learned Improvements ==="
    
    # This would integrate with SOUL.md updates
    # For now, just identify top improvement areas
    
    if [[ -f "$REFLEXION_LOG" ]]; then
        local top_issue=$(grep '"critique"' "$REFLEXION_LOG" | \
            sed 's/.*"critique": "\([^"]*\)".*/\1/' | \
            sort | uniq -c | sort -rn | head -1 | \
            sed 's/^ *[0-9]* *//')
        
        echo "Top issue to address: $top_issue"
        echo "Consider updating SOUL.md with handling pattern for this issue."
    fi
}

# Main command handler
case "${1:-}" in
    critique)
        critique_task "$2" "$3" "${4:-}"
        ;;
    review)
        review_reflections "${2:-7}"
        ;;
    apply)
        apply_learning
        ;;
    log)
        log_reflection "$2" "$3" "$4" "$5" "$6"
        ;;
    *)
        cat <<EOF
Reflexion Module - Self-critique for agentic workflows

Commands:
  critique "task" "result" ["expected"]   - Generate self-critique
  review [days]                          - Review recent reflections
  apply                                  - Apply learned improvements
  log context action outcome critique improvement

Examples:
  $0 critique "Research AI trends" "Found 5 articles..."
  $0 review 7
EOF
        ;;
esac
