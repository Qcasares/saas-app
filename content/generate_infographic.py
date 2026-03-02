#!/usr/bin/env python3
"""Generate professional infographic using CellCog."""

import os

# Set API key
os.environ["CELLCOG_API_KEY"] = "sk_29bd351755c5386d073e44af635d7397945c8a151e7a582831c5838c15842199"

from cellcog import CellCogClient

client = CellCogClient()

prompt = """
Create a professional infographic with the following exact specifications:

TITLE: "THE HYBRID TRADER FRAMEWORK"

DESIGN REQUIREMENTS:
- Dark professional background (deep charcoal/slate gradient)
- Split layout showing Human vs Agent capabilities side by side
- Clean, modern typography suitable for LinkedIn
- Professional color palette

LAYOUT STRUCTURE:

LEFT SIDE (Orange color theme - #FF6B35 or similar warm orange):
- Header: "HUMAN"
- Four capabilities listed vertically:
  * Strategy
  * Risk Judgment
  * Intuition
  * System Design

RIGHT SIDE (Cyan/Teal color theme - #00D4AA or similar cool cyan):
- Header: "AGENT"
- Four capabilities listed vertically:
  * Surveillance
  * Detection
  * Execution Speed
  * Data Processing

CENTER OVERLAP (Purple color theme - #8B5CF6 or similar purple):
- Shows the intersection of Human + Agent
- Three elements:
  * Conviction Calibration
  * Position Sizing
  * Edge Validation
- Visual should show these as overlapping/connecting both sides

BOTTOM:
- Tagline: "Not replacement. Extension."
- Centered, professional font

OVERALL STYLE:
- Modern, minimalist design
- High contrast for readability
- Suitable for professional social media (LinkedIn)
- 1080x1080px or 1200x1200px square format
- Clean lines, subtle gradients, professional aesthetic

DELIVERABLE:
Generate a single high-quality PNG image file of this infographic.
"""

result = client.create_chat(
    prompt=prompt,
    notify_session_key="agent:main:subagent:e8455d8e-7b74-42d6-8e41-4d5f917351ac",
    task_label="hybrid-trader-infographic",
    chat_mode="agent"
)

print(f"Chat ID: {result['chat_id']}")
print(f"Status: {result['status']}")
print(f"Explanation: {result['explanation']}")
