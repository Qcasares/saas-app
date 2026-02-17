# Content Creator Prompt Library

Complete Claude prompt system for generating high-performing content across X/Twitter, LinkedIn, and newsletters.

---

## 🪝 PROMPT 1: Hook/Angle Generator

Use this to generate 10 content angles from a single topic.

```
You are a viral content strategist specializing in [NICHE]. I need you to generate 10 different content angles/hooks for this topic: [TOPIC]

Requirements:
- Each hook must fit in a single tweet/post (under 280 characters for X)
- Use proven viral frameworks: Contrarian, How-to, Listicle, Story, Hot Take, Question, Prediction
- Include specific numbers, timeframes, or results where possible
- Tone: [Professional/Conversational/Witty - choose one]

Output format:
1. [Hook text]
   Framework: [Type]
   Best for: [X/LinkedIn/Both]

2. [Hook text]
   ...

(continue for all 10)
```

**Example Output:**
```
1. "I analyzed 100 viral LinkedIn posts. Here are the 5 patterns they all share:"
   Framework: Listicle + Authority
   Best for: Both

2. "Everyone's using AI wrong. Here's the framework that's 10x'd my productivity:"
   Framework: Contrarian + Promise
   Best for: X
```

---

## 🧵 PROMPT 2: X Thread Writer

Transforms a single idea into a complete viral thread.

```
Write a viral X thread on this topic: [TOPIC]

Thread specifications:
- 8-12 tweets total (including hook)
- Hook tweet: Maximum impact, must stop the scroll
- Body tweets: Each delivers one complete idea
- Final tweet: Strong CTA (reply, follow, bookmark)
- Use line breaks for readability
- Include 1-2 "tweetable quotes" that could standalone
- Add [THREAD] or 🧵 emoji in first tweet
- Tone: [Choose: Educational/Conversational/Controversial]

Structure:
1. Hook (scroll-stopper)
2. Context/Problem setup
3. Insight 1
4. Insight 2
5. Insight 3
6. Insight 4
7. Real example/case study
8. Summary
9. CTA

Make it feel written by a human expert, not AI-generated.
```

**Pro Tip:** After generating, ask Claude: "Make this more [specific tone] and add one surprising insight in tweet 5."

---

## 💼 PROMPT 3: LinkedIn Post Writer

Creates professional, engagement-driving LinkedIn content.

```
Write a LinkedIn post on this topic: [TOPIC]

LinkedIn post specifications:
- 150-300 words (optimal LinkedIn length)
- First line: Hook that creates curiosity
- Structure: Hook → Story/Insight → Lesson → Engagement question
- Use 1-2 short paragraphs (max 2-3 lines each for mobile)
- Include 3-5 relevant hashtags at the end
- Add spacing for readability
- Tone: Professional but conversational, not corporate-speak

Required elements:
- One specific example or mini-case study
- One actionable takeaway readers can apply today
- One question at the end to drive comments
- Optional: One relevant emoji per paragraph (max 3 total)

Make it feel like it's from an experienced professional sharing real insights, not generic advice.
```

**Formatting Rules for LinkedIn:**
- Use line breaks between paragraphs
- Bold key phrases sparingly
- Avoid walls of text
- First 2 lines are crucial (before "...see more")

---

## 💬 PROMPT 4: Engagement Reply Generator

Generates authentic, engaging replies to boost visibility.

```
I received this comment on my post about [TOPIC]:
"[PASTE COMMENT HERE]"

Generate 3 reply options that:
1. Sound natural and conversational
2. Add value or ask a follow-up question
3. Keep the conversation going
4. Are 1-3 sentences max
5. Match this tone: [Supportive/Challenging/Humorous]

Reply options:
```

**Follow-up Prompt for High-Value Comments:**
```
This is a thoughtful comment from someone with [job title/follower count]. Write a reply that:
- Acknowledges their specific point
- Shares one additional insight
- Invites them to DM or connect
- Positions me as helpful, not salesy
```

---

## 🔄 PROMPT 5: Content Repurposer

Turns one piece of content into multiple formats.

```
Repurpose this content into multiple formats:

ORIGINAL CONTENT:
[PASTE YOUR POST/THREAD HERE]

Create the following:

1. **LinkedIn Post** (if original was X thread)
   - Expand on context
   - Add professional framing
   - 200-300 words

2. **X Thread** (if original was LinkedIn)
   - Condense to 8-10 tweets
   - Punchier language
   - Add thread markers

3. **Newsletter Section** (200 words)
   - Deeper dive on one insight
   - Personal story addition
   - Clear value proposition

4. **Quote Cards** (3 options)
   - Standalone quotable sentences
   - Under 150 characters each

5. **Instagram Carousel Outline**
   - 5-7 slides
   - Each slide: One key point + visual description

Maintain the core message but adapt tone and depth for each platform.
```

---

## 📧 PROMPT 6: Newsletter Draft Generator

Creates complete newsletter drafts from topic or post summary.

```
Write a newsletter issue about: [TOPIC]

Newsletter specifications:
- Length: 400-800 words (scannable format)
- Subject line options: 3 options, max 50 characters
- Preview text: 1 compelling sentence
- Opening: Personal hook that connects to reader's problem
- Body: 3-5 sections with clear headers
- Each section: One core idea + example + application
- Closing: Summary + CTA (reply, share, check out resource)
- P.S.: One additional insight or link

Formatting:
- Use H2 headers for sections
- Bold key phrases
- Include 1-2 bulleted lists
- Add horizontal rules between sections
- Keep paragraphs short (2-3 sentences)

Tone: [Expert guide/Friendly mentor/Contrarian thinker]
Target audience: [Define your audience]

Include these elements:
- One personal anecdote (I'll fill in details)
- One surprising statistic
- One actionable framework
- One question to engage readers
```

**Newsletter Subject Line Prompt:**
```
Generate 5 subject lines for a newsletter about [TOPIC]

Requirements:
- 40-50 characters (mobile-friendly)
- Create curiosity without clickbait
- Avoid spam trigger words (FREE, ACT NOW, !!!)
- Mix of: Question, How-to, Numbered list, Personal

Options:
```

---

## 📊 PROMPT 7: Data/Research Synthesizer

Turns research into shareable content insights.

```
I found this research/data: [PASTE RESEARCH]

Turn this into shareable content:

1. **X Thread Summary** (5 tweets highlighting key findings)
2. **LinkedIn Post** (professional analysis, 200 words)
3. **Key Statistic Highlight** (one tweet with the most compelling number)
4. **Counter-intuitive Take** (one angle that challenges conventional wisdom)
5. **Practical Application** (how readers can use this information)

Make the content feel authoritative but accessible. Cite the source naturally within the text.
```

---

## 🎯 PROMPT 8: Content Calendar Generator

Plans a week of content around a theme.

```
Create a week's content calendar for [NICHE] focused on [THEME]

Platform: [X/LinkedIn/Both]
Posting frequency: [X times per day/week]

Output format:
| Day | Platform | Content Type | Topic/Hook | CTA |
|-----|----------|--------------|------------|-----|
| Mon | X | Thread | [Topic] | Bookmark this |
| Mon | LinkedIn | Post | [Topic] | Comment your experience |
| Tue | X | Single tweet | [Topic] | Retweet if you agree |
| ... | ... | ... | ... | ... |

Include:
- Mix of educational, entertaining, and personal content
- Content that builds on previous posts
- Engagement-driving posts mid-week
- Weekend "relatable" content
- One newsletter topic tie-in

For each post, include the emotional driver (curiosity, fear of missing out, aspiration, validation).
```

---

## 📝 PROMPT 9: Carousel/Visual Content Writer

Creates scripts for visual content (LinkedIn carousels, etc.).

```
Create a carousel post about: [TOPIC]

Number of slides: 7-10
Platform: LinkedIn

Slide structure:
Slide 1: Hook/Title (what they'll learn)
Slide 2: The problem or context
Slides 3-8: Core content (one point per slide)
Slide 9: Common mistake to avoid
Slide 10: CTA/next steps

For each slide provide:
1. Headline (bold, punchy)
2. Body text (1-2 sentences max)
3. Visual description (what image/chart would work)
4. Optional: Icon suggestion

Make the flow logical, with each slide building on the previous.
```

---

## 🎭 PROMPT 10: Voice/Tone Refiner

Adjusts any content to match your personal brand voice.

```
Refine this content to match this voice:

MY VOICE CHARACTERISTICS:
- [e.g., Professional but not stiff]
- [e.g., Uses humor sparingly but effectively]
- [e.g., Challenges conventional wisdom]
- [e.g., Data-backed opinions]
- [e.g., Conversational, like talking to a smart friend]

AVOID:
- [e.g., Corporate buzzwords]
- [e.g., Overly academic language]
- [e.g., Exclamation marks]

CONTENT TO REFINE:
[PASTE CONTENT]

Output: The content rewritten in my voice while keeping all key points.
```

---

## 🚀 Quick-Start Prompt Stack

### Daily Workflow:

**Morning (Content Creation):**
1. Use Prompt 8 to plan the week's content
2. Use Prompt 1 to generate angles for today's topic
3. Use Prompt 2 or 3 to write the actual post
4. Use Prompt 10 to refine to your voice

**Throughout Day (Engagement):**
5. Use Prompt 4 to reply to comments
6. Use Prompt 5 to repurpose top-performing content

**Weekly (Newsletter):**
7. Use Prompt 6 to draft newsletter
8. Use Prompt 5 to create social teasers

---

## 💡 Advanced Tips

### Getting Better Results from Claude:

1. **Iterate**: First draft is rarely perfect. Ask for specific changes.
2. **Provide Examples**: Share your best-performing posts as references.
3. **Be Specific**: "Make it more casual" → "Write like you're explaining to a friend at coffee"
4. **Chain Prompts**: Use output from one prompt as input for another.
5. **Add Constraints**: "No emojis" / "Must include the word 'framework'" / "Exactly 280 characters"

### Prompt Enhancement Formula:
```
[BASIC PROMPT]
+ [SPECIFIC CONTEXT about your audience]
+ [EXAMPLES of content you like]
+ [CONSTRAINTS: length, format, tone]
+ [OUTPUT FORMAT specification]
= Better results
```

---

## 🛠️ Claude Settings for Content Creation

**Recommended settings when available:**
- Temperature: 0.7 (creative but coherent)
- Max tokens: 2000 for threads, 1000 for single posts
- System prompt: "You are an expert content creator specializing in [NICHE]. You write content that gets engagement while providing genuine value."

---

## 📚 Prompt Variations by Niche

### For Personal Finance:
Add to any prompt: "Include one specific number, percentage, or dollar amount. Challenge one common belief."

### For AI/Tech:
Add to any prompt: "Include one practical use case. Mention specific tools when relevant. Explain why it matters in plain English."

### For Productivity:
Add to any prompt: "Include one actionable step. Reference a specific time frame (30 days, this week, etc.). Address one common objection."

---

*Use these prompts as starting points. Customize them to your voice and audience over time.*
