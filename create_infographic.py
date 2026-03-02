#!/usr/bin/env python3
"""Generate professional infographic using CellCog SDK."""
import os
import sys

# Set API key
os.environ["CELLCOG_API_KEY"] = "sk_29bd351755c5386d073e44af635d7397945c8a151e7a582831c5838c15842199"

from cellcog import CellCogClient

client = CellCogClient()

# Verify API key is configured
status = client.get_account_status()
print(f"CellCog status: {status}")

if not status.get("configured"):
    print("ERROR: CellCog API key not configured properly")
    sys.exit(1)

# Create the infographic prompt
prompt = """Create a professional infographic with the following specifications:

TITLE: "THE COST OF HESITATION"

DESIGN REQUIREMENTS:
- Dark professional background (#0a0a0f or similar deep charcoal)
- Subtle trading chart elements (faint candlestick patterns or price lines) in the background
- Three main panels arranged horizontally, each showing a different cost of hesitation:

PANEL 1:
- Header: "1 SECOND DELAY"
- Subtext: "12% worse fill price"
- Visual: Clock or timer icon with downward arrow

PANEL 2:
- Header: "SECOND-GUESSING"  
- Subtext: "Missed entry entirely"
- Visual: Crossed-out trade entry or missed opportunity icon

PANEL 3:
- Header: "ANALYSIS PARALYSIS"
- Subtext: "Watching from sidelines"
- Visual: Person at computer with charts but no action

BOTTOM SECTION:
- Quote: "Your edge isn't your model. It's your conviction at execution."
- Typography: Clean, modern sans-serif font

COLOR SCHEME:
- Primary: Deep dark background (#0a0a0f)
- Accent 1: Cyan (#00d4ff or similar)
- Accent 2: Orange (#ff6b35 or similar)
- Text: White/off-white for readability
- Panels: Slightly lighter dark cards with subtle borders

STYLE:
- Clean, minimal, professional design suitable for LinkedIn
- Modern fintech/trading aesthetic
- High contrast for readability
- Professional typography hierarchy
- Subtle gradients or glow effects on accents

OUTPUT:
Generate a high-quality PNG image (1920x1080 or similar 16:9 ratio) saved as \"infographic-cost-hesitation.png\""""

# Create the task
result = client.create_chat(
    prompt=prompt,
    notify_session_key="agent:main:subagent:3bfbe45f-0704-4e5a-bb32-665e878c85e1",
    task_label="infographic-cost-hesitation",
    chat_mode="agent"
)

print(f"Chat created: {result['chat_id']}")
print(f"Status: {result['status']}")
print(f"Explanation: {result['explanation']}")
