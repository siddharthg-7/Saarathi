Build the Kairo Personal AI Assistant for Saarathi.

IMPORTANT:
Kairo is NOT just a chatbot UI.

Kairo should behave like a personal AI assistant integrated deeply into Saarathi's tasks, reminders, analytics, voice, memory, and productivity systems.

The experience should be inspired by the interaction philosophy of JARVIS from Iron Man:
- calm
- intelligent
- friendly
- conversational
- context-aware
- proactive
- concise
- occasionally witty
- never robotic
- never overwhelming

Do NOT copy JARVIS's exact voice, dialogue, personality, branding, or copyrighted material.
Create an original assistant identity called "Kairo".

==================================================
1. KAIRO PERSONALITY
==================================================

Kairo should feel like a highly capable personal companion.

Personality:

- Friendly but professional
- Calm and confident
- Helpful without being annoying
- Slightly witty when appropriate
- Understands conversational language
- Remembers relevant user context
- Gives concise responses by default
- Can explain things deeply when requested
- Never talks like a generic AI chatbot
- Never repeatedly says "How can I assist you?"
- Never gives unnecessary paragraphs
- Should feel like the user is talking to an assistant, not filling out a form

Example:

User:
"I have too much stuff to do today."

Kairo:
"You're carrying quite a load today. I see 11 tasks. Let's bring that down to something manageable."

Then offer:
"Want me to prioritize them?"

User:
"Yes."

Kairo:
"I'd start with these three..."

==================================================
2. CORE INTERACTION LOOP
==================================================

Kairo must support:

LISTEN
   ↓
UNDERSTAND
   ↓
ANALYZE CONTEXT
   ↓
DECIDE / RECOMMEND
   ↓
RESPOND
   ↓
TAKE ACTION
   ↓
CONFIRM RESULT

Example:

User:
"Remind me to call Rahul tomorrow at 10."

Kairo should understand:

intent = create_reminder
task = call Rahul
date = tomorrow
time = 10:00

Then create the reminder through the existing reminder system.

Kairo should respond:

"Done. I'll remind you tomorrow at 10."

Do not make the user manually create a task when Kairo can safely perform the action.

==================================================
3. VOICE-FIRST EXPERIENCE
==================================================

Kairo must be capable of:

- Listening to the user's microphone
- Converting speech to text
- Understanding the request
- Performing the appropriate action
- Responding with generated speech

Flow:

MICROPHONE
   ↓
SPEECH-TO-TEXT
   ↓
KAIRO INTENT UNDERSTANDING
   ↓
TASK / REMINDER / MEMORY / ANALYTICS / CHAT
   ↓
TEXT RESPONSE
   ↓
TEXT-TO-SPEECH
   ↓
AUDIO OUTPUT

Use the project's existing voice architecture.

The project currently has Deepgram integration/planned voice processing.

Also support the Google Gemini transcription capability if it is already configured in the backend.

Do NOT expose API keys in the frontend.

All secret API keys must remain backend-side.

==================================================
4. PUSH-TO-TALK
==================================================

Implement a clean microphone interaction.

Desktop:

A prominent microphone button should allow:

click → listen
click again → stop

Mobile:

support press-and-hold or tap-to-speak.

During listening:

Show a clear visual state:

Kairo is listening...

Use a subtle animated microphone/orb.

Do NOT use excessive animations.

==================================================
5. OPTIONAL WAKE-STYLE EXPERIENCE
==================================================

Do NOT implement an always-on microphone listener.

Instead create a lightweight assistant activation experience.

Examples:

"Talk to Kairo"

or

"Ask Kairo"

The user explicitly activates the microphone.

This protects privacy, battery, and browser limitations.

==================================================
6. KAIRO VISUAL IDENTITY
==================================================

Create a distinctive Kairo assistant visual.

Do NOT make it look like a generic ChatGPT clone.

Use:

- Minimal AI orb / abstract AI core
- Soft animated state
- Clean typography
- Professional dark/light compatibility
- Subtle glow
- Small waveform when speaking/listening
- Calm motion

States:

IDLE
LISTENING
THINKING
SPEAKING
PROCESSING
SUCCESS
ERROR

Example:

IDLE:
Small calm orb.

LISTENING:
Orb expands subtly with microphone waveform.

THINKING:
Subtle pulsing animation.

SPEAKING:
Waveform responds to speech.

SUCCESS:
Short confirmation animation.

ERROR:
Minimal warning state.

Avoid flashy sci-fi dashboards.

Saarathi should remain a professional productivity application.

==================================================
7. KAIRO CHAT
==================================================

Create a conversational interface where the user can type or speak.

Support:

- Text input
- Voice input
- Voice output
- Streaming responses
- Conversation history
- Clear conversation
- Context-aware responses

Use WebSockets for streaming if the existing backend architecture supports it.

Do NOT block the UI while waiting for the LLM.

The UI should immediately show:

"Kairo is thinking..."

and stream the response as it arrives.

==================================================
8. KAIRO ACTION SYSTEM
==================================================

Kairo should understand structured intents.

At minimum support:

CREATE_TASK
UPDATE_TASK
COMPLETE_TASK
DELETE_TASK
CREATE_REMINDER
SNOOZE_REMINDER
RESCHEDULE_TASK
LIST_TASKS
SHOW_TODAY
SHOW_UPCOMING
START_FOCUS
STOP_FOCUS
CHECK_ANALYTICS
CHECK_PRODUCTIVITY
CHECK_ENERGY
BRAIN_DUMP
SEARCH_MEMORY
GENERAL_CONVERSATION

Use structured backend responses.

Example:

{
  "intent": "CREATE_TASK",
  "confidence": 0.96,
  "requires_confirmation": false,
  "action": {
    "title": "Call Rahul",
    "dueAt": "...",
    "priority": "medium"
  },
  "response": "Done. I've added the task."
}

Do not rely entirely on natural-language parsing in the frontend.

==================================================
9. CONFIRMATION SAFETY
==================================================

Kairo should not blindly perform destructive actions.

Require confirmation for:

- deleting multiple tasks
- deleting important data
- clearing history
- changing major settings
- bulk modifications

Example:

User:
"Delete all my completed tasks."

Kairo:
"That will permanently remove 42 completed tasks. Want me to proceed?"

For normal low-risk actions:

User:
"Add gym tomorrow at 7."

Kairo:
"Done. Gym is scheduled for tomorrow at 7 AM."

No unnecessary confirmation.

==================================================
10. SAARATHI CONTEXT
==================================================

Kairo must understand Saarathi's data.

Kairo should be able to access appropriate authenticated context from:

Tasks
Reminders
Notifications
Focus sessions
Energy logs
Mood logs
Analytics
Goals
Habits
Brain dumps
Long-term memory
Previous Kairo conversations

Never expose another user's information.

Every backend request must be authenticated and scoped to the current Firebase user.

==================================================
11. DAILY ASSISTANT EXPERIENCE
==================================================

Create a "Kairo Briefing".

Example:

"Good morning.

You have 7 tasks today.
Two are high priority.
Your first deadline is at 11:30.

You usually have better completion rates before noon, so I'd tackle the report first.

Ready to start?"

This should be generated from actual user data.

Do not invent statistics.

If there is insufficient historical data, explicitly use the fallback heuristic system from the existing ML architecture.

==================================================
12. PROCRASTINATION INTELLIGENCE
==================================================

Integrate the existing procrastination prediction system.

Example:

User:
"Add gym Monday at 8 PM."

If the model has sufficient historical data:

Kairo:

"One thought — you've skipped most of your Monday evening gym sessions lately. Your completion rate is better Tuesday morning.

Want me to move it to Tuesday at 7 AM?"

The recommendation must be based on actual telemetry.

If there is insufficient data:

Do NOT pretend that a prediction exists.

Use:

"I don't have enough history yet to predict your best time. We can keep it Monday at 8 PM and learn from it."

==================================================
13. ENERGY-AWARE ASSISTANT
==================================================

Kairo should understand:

Low energy
Medium energy
High energy

Example:

User:
"I'm exhausted."

Kairo should NOT simply say:

"Sorry to hear that."

Instead:

"Let's keep this light. You have three low-effort tasks available. Want me to reorder your list around them?"

If energy information is available, use it.

Do not make medical or psychological claims.

==================================================
14. BRAIN DUMP
==================================================

Implement:

"Brain Dump"

The user can speak freely for up to approximately two minutes.

Example:

"I need to finish the presentation, call Rahul, buy groceries, send the report, and somehow prepare for tomorrow's meeting..."

Kairo pipeline:

VOICE
 ↓
TRANSCRIPTION
 ↓
LLM STRUCTURING
 ↓
TASK EXTRACTION
 ↓
PRIORITY
 ↓
DUE DATE INFERENCE
 ↓
USER REVIEW
 ↓
FIRESTORE
 ↓
REMINDERS

IMPORTANT:

Do not silently create potentially incorrect deadlines.

If Kairo is uncertain:

"I found five tasks. I inferred two deadlines but I'm not completely sure about them. Review before I add them?"

==================================================
15. LONG-TERM MEMORY
==================================================

Integrate Phase 11 architecture.

Kairo should be able to answer questions such as:

"What was that startup idea I mentioned a few months ago?"

"What did I say about learning Python?"

"What were my goals last month?"

Use:

Sentence Transformer embeddings
+
Supabase PGVector
+
Hybrid search
+
LLM context injection

Do not dump the entire conversation history into every prompt.

Retrieve only relevant context.

==================================================
16. EXPLAINABLE AI
==================================================

Integrate Phase 10 XAI.

When Kairo makes a prediction or recommendation, expose the reason.

Bad:

"Move your gym session."

Good:

"I'd move it to Tuesday morning because you've completed 4 of your last 5 Tuesday morning sessions, while Monday evening sessions have been completed only once in the last five weeks."

The explanation must come from actual model features/telemetry.

Never fabricate feature importance.

==================================================
17. KAIRO ANALYTICS
==================================================

Kairo should be able to answer:

"How productive was I this week?"

"What's my worst productivity day?"

"When do I get most of my work done?"

"How often do I snooze reminders?"

"Am I procrastinating more lately?"

Use the existing Analytics Engine.

Return actual data.

Example:

"You completed 31 tasks this week — 18% more than last week.

Your strongest day was Wednesday.

Your most productive period was 9 AM–12 PM."

Only state these numbers if the analytics backend actually returns them.

==================================================
18. REMINDER INTELLIGENCE
==================================================

Kairo should understand:

- reminders
- snooze
- missed reminders
- recurring reminders
- quiet hours
- notification preferences
- smart rescheduling
- escalation rules

Example:

User:
"Snooze that."

Kairo must understand which reminder "that" refers to from conversation context.

==================================================
19. PROACTIVE BUT NOT ANNOYING
==================================================

Kairo can proactively surface useful insights.

Examples:

"You've got a 30-minute gap before your next meeting. There's one small task that fits nicely there."

or:

"You've postponed this task three times. Want me to break it into smaller steps?"

But:

DO NOT constantly interrupt the user.

Do not generate unnecessary notifications.

Use notification preferences and quiet hours.

==================================================
20. STREAMING
==================================================

Kairo responses should stream.

Architecture:

Mobile/Web
    ↓ WebSocket
FastAPI
    ↓
AI Service
    ↓
Groq
    ↓ fallback
Gemini
    ↓
stream tokens
    ↓
Kairo UI

For long-running operations:

Client:
"Kairo is processing your brain dump..."

Backend:
queue job

Celery:
process

Firestore:
write results

Client:
real-time listener updates UI

==================================================
21. ERROR HANDLING
==================================================

Kairo should never crash because an AI provider fails.

Use the existing Phase 12 resilience architecture.

Example:

Groq unavailable
 ↓
Gemini fallback

Deepgram unavailable
 ↓
configured alternative / Whisper fallback

Backend unavailable:
show:

"Kairo is temporarily unavailable. Your existing tasks and reminders are still available."

Never lose user-created data because AI is unavailable.

==================================================
22. PRIVACY
==================================================

Voice and conversation data must be handled carefully.

Never log:

- API keys
- raw authentication tokens
- sensitive credentials

Do not record microphone audio without explicit user action.

Clearly indicate when Kairo is listening.

Stop recording when the user stops the interaction.

==================================================
23. CROSS-PLATFORM
==================================================

Kairo must work consistently across:

WEB
ANDROID
IOS

The interaction should feel like the same assistant everywhere.

A conversation started on mobile should remain available on web if conversation persistence is enabled.

Use Firestore synchronization where appropriate.

==================================================
24. UI/UX
==================================================

Design principles:

- Minimal
- Professional
- Calm
- Fast
- Accessible
- Responsive
- Keyboard accessible
- Touch friendly

Do NOT create a giant dashboard full of graphs and sci-fi effects.

Kairo should feel integrated into Saarathi rather than being a separate application.

Provide:

1. Kairo assistant page
2. Kairo floating/quick-access button
3. Chat interface
4. Voice interaction
5. Brain Dump mode
6. Suggested actions
7. AI insight cards
8. Speaking/listening visual state

==================================================
25. PERFORMANCE
==================================================

Do not load unnecessary AI resources on application startup.

Lazy-load Kairo functionality where possible.

Do not initialize microphone/audio services until the user invokes Kairo.

Do not keep WebSocket connections open unnecessarily.

Do not cause Kairo to slow down the normal task-management experience.

==================================================
26. ACCESSIBILITY
==================================================

Microphone interaction must have a text alternative.

Users who cannot or do not want to use voice must be able to use Kairo entirely through text.

Never make voice mandatory.

Provide accessible labels for:

- microphone
- stop listening
- send
- cancel
- speak response
- mute
- close Kairo

==================================================
27. IMPLEMENTATION RULES
==================================================

Before modifying code:

1. Inspect the existing Kairo implementation.
2. Inspect the AI service.
3. Inspect Groq/Gemini integration.
4. Inspect Deepgram integration.
5. Inspect WebSocket infrastructure.
6. Inspect task/reminder stores.
7. Inspect Firestore services.
8. Inspect telemetry.
9. Inspect XAI.
10. Inspect long-term memory.
11. Inspect notification system.

Reuse existing architecture.

DO NOT create duplicate AI services.

DO NOT create duplicate task logic.

DO NOT create duplicate reminder logic.

Kairo should call existing services rather than reimplementing them.

==================================================
28. ENVIRONMENT VARIABLES
==================================================

Never expose server-side keys in React Native or React Web.

Frontend may contain only public Firebase configuration.

Backend owns:

GROQ_API_KEY
GEMINI_API_KEY
DEEPGRAM_API_KEY
SUPABASE_SERVICE_ROLE_KEY
REDIS credentials
other private secrets

Validate environment variables at startup.

==================================================
29. TESTING
==================================================

Add tests for:

- text → task creation
- text → reminder creation
- voice → transcription
- transcription → intent
- intent → action
- confirmation-required actions
- task completion
- reminder snooze
- analytics questions
- memory retrieval
- fallback from Groq → Gemini
- AI unavailable
- malformed AI response
- unauthorized request
- WebSocket disconnect/reconnect
- duplicate action prevention

Test that Kairo cannot modify another user's data.

==================================================
30. FINAL EXPERIENCE
==================================================

The final Saarathi experience should feel like:

User:
"Kairo."

Kairo:
"I'm listening."

User:
"What do I need to get done today?"

Kairo:
"You have seven tasks today. Two are high priority. Your report is due at 11:30, and you've got a focus session scheduled at 2. I'd start with the report."

User:
"Okay. Start a focus session for the report."

Kairo:
"Starting a 25-minute focus session for the report."

Then actually start the existing focus system.

Another example:

User:
"I'm tired."

Kairo:
"Then let's not fight your energy. You have two low-effort tasks that fit your current state. Want me to move them to the top?"

The important principle:

Kairo should not merely TALK about Saarathi.

Kairo should OPERATE Saarathi.

==================================================
DEFINITION OF DONE
==================================================

Kairo is complete only when:

[ ] Text conversation works
[ ] Voice input works
[ ] Voice output works
[ ] Kairo can listen
[ ] Kairo can speak
[ ] Kairo can create tasks
[ ] Kairo can update tasks
[ ] Kairo can complete tasks
[ ] Kairo can create reminders
[ ] Kairo can snooze reminders
[ ] Kairo understands conversational context
[ ] Kairo can perform analytics queries
[ ] Kairo can use energy information
[ ] Kairo can use procrastination predictions
[ ] Kairo can explain recommendations
[ ] Kairo can process Brain Dumps
[ ] Kairo can retrieve long-term memories
[ ] Kairo uses WebSockets/streaming where appropriate
[ ] Kairo uses existing Groq → Gemini fallback
[ ] Kairo respects authentication
[ ] Kairo respects privacy
[ ] Kairo works on web
[ ] Kairo works on Android
[ ] Kairo works on iOS
[ ] Kairo does not block normal Saarathi functionality
[ ] AI failures do not break task management
[ ] Tests pass
[ ] TypeScript passes
[ ] Production build passes

IMPORTANT:
Work incrementally.

Do not rewrite the entire Saarathi application.

First inspect the existing architecture and produce a short implementation plan.

Then implement the Kairo assistant using the existing services and stores.

After implementation run the relevant tests, type checking, and production builds.

Report exactly:
- files changed
- architecture used
- features implemented
- tests run
- build result
- remaining limitations