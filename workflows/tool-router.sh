#!/bin/bash
#
# Tool Router - Intelligent tool selection for agentic workflows
# Implements skill routing pattern from agentic AI research
#

declare -A TOOL_ROUTES=(
    ["web_search"]="web_search|Research, current events, factual queries"
    ["web_fetch"]="web_fetch|Deep reading, documentation extraction"
    ["memory"]="memory_search|Personal context, prior conversations"
    ["file"]="read|File operations, code review"
    ["code"]="sessions_spawn|Complex coding tasks"
    ["deploy"]="vercel|Vercel deployments"
    ["social"]="curl|Social media APIs (Moltbook)"
    ["data"]="sql-toolkit|Database queries"
    ["image"]="image|Vision analysis"
    ["tts"]="tts|Text-to-speech"
)

# Route task to best tool
route_task() {
    local task="$1"
    local context="${2:-}"
    
    # Intent detection keywords
    if [[ "$task" == *"search"* ]] || [[ "$task" == *"find"* ]] || [[ "$task" == *"research"* ]]; then
        echo "web_search"
        return
    fi
    
    if [[ "$task" == *"read"* ]] || [[ "$task" == *"fetch"* ]] || [[ "$task" == *"extract"* ]]; then
        echo "web_fetch"
        return
    fi
    
    if [[ "$task" == *"remember"* ]] || [[ "$task" == *"recall"* ]] || [[ "$task" == *"memory"* ]]; then
        echo "memory_search"
        return
    fi
    
    if [[ "$task" == *"file"* ]] || [[ "$task" == *"edit"* ]] || [[ "$task" == *"code"* ]] && [[ ${#task} -lt 100 ]]; then
        echo "read"
        return
    fi
    
    if [[ "$task" == *"build"* ]] || [[ "$task" == *"implement"* ]] || [[ "$task" == *"create"* ]] && [[ ${#task} -gt 100 ]]; then
        echo "sessions_spawn"
        return
    fi
    
    if [[ "$task" == *"deploy"* ]] || [[ "$task" == *"vercel"* ]] || [[ "$task" == *"publish"* ]]; then
        echo "vercel"
        return
    fi
    
    if [[ "$task" == *"moltbook"* ]] || [[ "$task" == *"social"* ]]; then
        echo "social"
        return
    fi
    
    if [[ "$task" == *"database"* ]] || [[ "$task" == *"sql"* ]] || [[ "$task" == *"query"* ]]; then
        echo "sql-toolkit"
        return
    fi
    
    if [[ "$task" == *"image"* ]] || [[ "$task" == *"photo"* ]] || [[ "$task" == *"picture"* ]]; then
        echo "image"
        return
    fi
    
    if [[ "$task" == *"speak"* ]] || [[ "$task" == *"voice"* ]] || [[ "$task" == *"audio"* ]]; then
        echo "tts"
        return
    fi
    
    # Default: use LLM to decide
    echo "sessions_spawn"
}

# Get tool description
tool_description() {
    local tool=$1
    echo "${TOOL_ROUTES[$tool]##*|}"
}

# Get tool function name
tool_function() {
    local tool=$1
    echo "${TOOL_ROUTES[$tool]%%|*}"
}

# Validate tool exists
tool_exists() {
    local tool=$1
    [[ -n "${TOOL_ROUTES[$tool]}" ]]
}

# List all available tools
list_tools() {
    echo "Available Tools:"
    for tool in "${!TOOL_ROUTES[@]}"; do
        printf "  %-12s %s\n" "$tool" "$(tool_description $tool)"
    done
}

# Main routing logic
if [[ "${1:-}" == "route" ]]; then
    route_task "$2"
elif [[ "${1:-}" == "list" ]]; then
    list_tools
elif [[ "${1:-}" == "describe" ]]; then
    tool_description "$2"
else
    echo "Usage: $0 route 'task description'"
    echo "       $0 list"
    echo "       $0 describe <tool>"
fi
