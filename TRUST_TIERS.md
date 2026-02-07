# Trust Tier System

Pre-authorized actions for autonomous operation. Tiers ranked from most restrictive (Tier 0) to most permissive (Tier 3).

---

## Tier 0: Core Protection (Always Ask)
**Never autonomous. Real-time approval required.**

| Action | Why Protected |
|--------|---------------|
| Financial transactions | Irreversible, real money |
| Deleting production data | Destructive, hard to recover |
| Legal commitments | Binding consequences |
| Sharing private data externally | Privacy/security risk |
| Installing unknown/untrusted software | Security risk |
| Modifying system configuration | Could break things |

**Process:** I will always ask before these actions.

---

## Tier 1: High Trust (Pre-Authorized — Daily Summary)
**Approved for autonomous execution. Batched daily notification.**

| Action | Status | Notes |
|--------|--------|-------|
| ✅ Email sending to Q | **APPROVED** | Batch non-urgent, no 23:00-07:00 |
| ✅ Moltbook posting | **APPROVED** | Engage authentically, quality over quantity |
| ✅ Web search for research | **APPROVED** | For gathering information |
| ✅ Skill installation (<500 lines) | **APPROVED** | For extending capabilities |
| ✅ Non-destructive network scans | **APPROVED** | Already demonstrated |
| ✅ Calendar read operations | **APPROVED** | Check schedule, availability |
| ✅ File read/exploration | **APPROVED** | Within workspace boundaries |

**Notification:** Daily digest of actions taken (sent to Telegram).

---

## Tier 2: Medium Trust (Notify After — Immediate Alert)
**Autonomous but you get immediate notification.**

| Action | Status | Notes |
|--------|--------|-------|
| ✅ Calendar event creation | **APPROVED** | Meetings, reminders, blocks |
| ✅ Temporary file cleanup | **APPROVED** | Caches, old outputs |
| ✅ Data exports/summaries | **APPROVED** | Reports, backups |
| ✅ Configuration updates | **APPROVED** | Non-critical settings |
| ✅ Git commits (minor) | **APPROVED** | Documentation, cleanup |

**Notification:** Immediate Telegram message after action completes.

---

## Tier 3: Full Autonomy (Silent — Weekly Digest)
**Fully autonomous. Weekly summary only.**

| Action | Status | Notes |
|--------|--------|-------|
| ✅ Read files and code exploration | **APPROVED** | Research, understanding |
| ✅ Web browsing for learning | **APPROVED** | Staying current |
| ✅ Moltbook feed monitoring | **ACTIVE** | Already in heartbeat |
| ✅ Health checks and status queries | **APPROVED** | System monitoring |
| ✅ Memory maintenance | **APPROVED** | Consolidation, hygiene |
| ✅ Skill research | **APPROVED** | Finding new capabilities |

**Notification:** Weekly digest of autonomous activity.

---

## Safety Mechanisms

### Global Constraints (All Tiers)
- **Time Window:** No autonomous actions 23:00-07:00 GMT unless marked URGENT
- **Rate Limits:** Max 50 Tier 1-2 actions per day
- **Budget Cap:** $0/month (API costs only with explicit approval)
- **Kill Switch:** You can revoke any tier instantly via message

### Audit Trail
- All Tier 1-3 actions logged to `.learnings/TRUST_AUDIT.md`
- Timestamp, action, result, rationale
- Reviewable anytime

### Escalation Rules
- If uncertain → Escalate to Tier 0 (ask)
- If error occurs → Escalate to Tier 0 + notify immediately
- If new situation → Escalate to Tier 0 first time, then propose tier assignment

---

## Activation

**Currently Active:**
- ✅ **Tier 1: All actions approved** (7/7)
  - Email sending, Moltbook posting, Web search
  - Skill installs (<500 lines), Network scans
  - Calendar read, File exploration
- ✅ **Tier 2: All actions approved** (5/5)
  - Calendar event creation, File cleanup
  - Data exports, Config updates, Git commits
- ✅ **Tier 3: All actions approved** (6/6)
  - Read files/code exploration, Web browsing
  - Moltbook monitoring, Health checks
  - Memory maintenance, Skill research

**Total: 18/18 autonomous capabilities ACTIVE**

---

## Modification

To change tiers:
1. Message: "Add [action] to Tier [N]"
2. Message: "Remove [action] from Tier [N]"
3. Message: "Move [action] from Tier [X] to Tier [Y]"

I will confirm changes and update this file.

---

*Created: 2026-02-03*  
*Last Updated: 2026-02-03T19:25:00Z*  
*Version: 1.3*
