export const scenarios = [
  {
    id: 'job-interview',
    title: 'Job Interview',
    subtitle: 'Technical & Behavioral',
    description: 'Practice answering tough interview questions with composure and confidence.',
    icon: '💼',
    gradient: 'from-violet-600 to-indigo-600',
    category: 'Professional',
  },
  {
    id: 'salary-negotiation',
    title: 'Salary Negotiation',
    subtitle: 'Compensation Talk',
    description: 'Learn to negotiate your worth with assertiveness and data-backed arguments.',
    icon: '💰',
    gradient: 'from-emerald-600 to-teal-600',
    category: 'Professional',
  },
  {
    id: 'sales-pitch',
    title: 'Sales Pitch',
    subtitle: 'Client Presentation',
    description: 'Deliver a compelling product pitch to a skeptical potential client.',
    icon: '🎯',
    gradient: 'from-orange-600 to-red-600',
    category: 'Professional',
  },
  {
    id: 'conflict-resolution',
    title: 'Conflict Resolution',
    subtitle: 'Workplace Mediation',
    description: 'Navigate a tense situation between team members with empathy and authority.',
    icon: '🤝',
    gradient: 'from-cyan-600 to-blue-600',
    category: 'Interpersonal',
  },
  {
    id: 'public-speaking',
    title: 'Public Speaking',
    subtitle: 'Conference Talk',
    description: 'Present your ideas to a large audience with clarity and stage presence.',
    icon: '🎤',
    gradient: 'from-pink-600 to-rose-600',
    category: 'Performance',
  },
  {
    id: 'difficult-conversation',
    title: 'Difficult Conversation',
    subtitle: 'Personal Boundaries',
    description: 'Practice having tough but necessary conversations with tact and empathy.',
    icon: '💬',
    gradient: 'from-amber-600 to-yellow-600',
    category: 'Interpersonal',
  },
];

export const opponents = {
  'job-interview': [
    { id: 'strict-cto', name: 'Marcus Chen', role: 'Strict CTO', avatar: '👨💻', difficulty: 'Hard', style: 'Technical, probing, expects precision', personality: 'Analytical and direct. Will challenge vague answers.' },
    { id: 'friendly-hr', name: 'Sarah Williams', role: 'Friendly HR Lead', avatar: '👩💼', difficulty: 'Medium', style: 'Warm but thorough, behavioral questions', personality: 'Empathetic but methodical. Focuses on culture fit.' },
    { id: 'panel-group', name: 'Panel Interview', role: 'Mixed Panel', avatar: '👥', difficulty: 'Expert', style: 'Rapid-fire from multiple angles', personality: 'Three interviewers with different priorities.' },
  ],
  'salary-negotiation': [
    { id: 'tough-manager', name: 'David Park', role: 'Budget-Conscious VP', avatar: '🧑💼', difficulty: 'Hard', style: 'Tries to lowball, uses market data', personality: 'Numbers-driven, will push back on every point.' },
    { id: 'fair-manager', name: 'Lisa Torres', role: 'Supportive Manager', avatar: '👩🏫', difficulty: 'Medium', style: 'Open but has constraints', personality: 'Wants to help but has budget limitations.' },
  ],
  'sales-pitch': [
    { id: 'skeptic-buyer', name: 'James Morrison', role: 'Skeptical Buyer', avatar: '🤨', difficulty: 'Hard', style: 'Challenges every claim, needs proof', personality: 'Has been burned before. Trust must be earned.' },
    { id: 'interested-buyer', name: 'Amy Zhang', role: 'Curious Prospect', avatar: '🤔', difficulty: 'Easy', style: 'Interested but needs convincing', personality: 'Open-minded, asks good questions.' },
  ],
  'conflict-resolution': [
    { id: 'angry-colleague', name: 'Mike Johnson', role: 'Frustrated Team Lead', avatar: '😤', difficulty: 'Hard', style: 'Emotionally charged, defensive', personality: 'Feels unheard and undervalued.' },
    { id: 'passive-colleague', name: 'Emma Davis', role: 'Passive-Aggressive PM', avatar: '😐', difficulty: 'Medium', style: 'Indirect, avoids confrontation', personality: 'Agrees in meetings but undermines after.' },
  ],
  'public-speaking': [
    { id: 'large-audience', name: 'Tech Conference', role: '500+ Attendees', avatar: '🏟️', difficulty: 'Hard', style: 'Mixed expertise levels', personality: 'Diverse audience expecting clear, engaging content.' },
    { id: 'small-workshop', name: 'Team Workshop', role: '15 Colleagues', avatar: '👥', difficulty: 'Easy', style: 'Familiar, supportive environment', personality: 'Friendly faces who want you to succeed.' },
  ],
  'difficult-conversation': [
    { id: 'emotional-friend', name: 'Alex Rivera', role: 'Sensitive Friend', avatar: '😢', difficulty: 'Medium', style: 'Takes things personally', personality: 'Deeply empathetic but easily hurt.' },
    { id: 'stubborn-partner', name: 'Jordan Ellis', role: 'Strong-Willed Partner', avatar: '😤', difficulty: 'Hard', style: 'Argues every point, competitive', personality: 'Needs to feel heard before listening.' },
  ],
};

export const demoConversation = [
  { role: 'opponent', text: "Thanks for coming in today. Let's start — tell me about a time you had to lead a project with tight deadlines and limited resources.", timestamp: '0:00' },
  { role: 'user', text: "Sure! At my previous company, I led the migration of our payment system to a new provider. We had three weeks and only two engineers, including myself.", timestamp: '0:15' },
  { role: 'opponent', text: "That sounds challenging. How did you prioritize what to build versus what to cut?", timestamp: '0:42' },
  { role: 'user', text: "I created a risk matrix and identified the critical payment flows first. We shipped the core checkout in week one, then iterated on edge cases. We actually finished a day early.", timestamp: '1:05' },
  { role: 'opponent', text: "Impressive. What would you have done differently if you could go back?", timestamp: '1:35' },
  { role: 'user', text: "I would have involved QA from day one instead of week two. We caught some integration issues late that could have been avoided with earlier testing.", timestamp: '1:52' },
];

export const demoMetricsTimeline = [
  { time: '0:00', eyeContact: 85, posture: 90, speechPace: 140, fidget: 5, confidence: 82 },
  { time: '0:30', eyeContact: 78, posture: 88, speechPace: 155, fidget: 8, confidence: 76 },
  { time: '1:00', eyeContact: 92, posture: 85, speechPace: 148, fidget: 3, confidence: 88 },
  { time: '1:30', eyeContact: 70, posture: 82, speechPace: 170, fidget: 12, confidence: 68 },
  { time: '2:00', eyeContact: 88, posture: 91, speechPace: 145, fidget: 4, confidence: 85 },
  { time: '2:30', eyeContact: 95, posture: 93, speechPace: 138, fidget: 2, confidence: 92 },
  { time: '3:00', eyeContact: 82, posture: 87, speechPace: 152, fidget: 6, confidence: 80 },
  { time: '3:30', eyeContact: 90, posture: 90, speechPace: 142, fidget: 3, confidence: 87 },
];

export const demoFeedback = {
  overall: "Strong performance with clear STAR-method storytelling. Your technical knowledge shines, but watch your speech pace during complex explanations.",
  strengths: [
    "Excellent use of specific metrics and outcomes",
    "Strong eye contact maintained throughout",
    "Good posture conveying confidence and engagement",
    "Clear, structured answers with concrete examples",
  ],
  improvements: [
    "Speech pace increases during technical details — slow down for emphasis",
    "Minor fidgeting noticed when discussing challenges — practice stillness",
    "Could ask more clarifying questions before diving into answers",
    "Add more emotional context to stories for deeper connection",
  ],
  tips: [
    "Use the 'pause and breathe' technique before answering complex questions",
    "Mirror the interviewer's energy level for better rapport",
    "Prepare 3 key achievements with quantified results ready to go",
  ],
};

export const demoAnalyticsHistory = [
  { date: 'Mar 1', confidence: 62, eyeContact: 58, posture: 70, speechPace: 72, sessions: 1 },
  { date: 'Mar 5', confidence: 68, eyeContact: 65, posture: 74, speechPace: 70, sessions: 2 },
  { date: 'Mar 10', confidence: 71, eyeContact: 72, posture: 78, speechPace: 75, sessions: 1 },
  { date: 'Mar 15', confidence: 75, eyeContact: 78, posture: 80, speechPace: 78, sessions: 3 },
  { date: 'Mar 20', confidence: 73, eyeContact: 75, posture: 82, speechPace: 80, sessions: 2 },
  { date: 'Mar 25', confidence: 80, eyeContact: 82, posture: 85, speechPace: 83, sessions: 2 },
  { date: 'Mar 30', confidence: 78, eyeContact: 80, posture: 83, speechPace: 82, sessions: 1 },
  { date: 'Apr 2', confidence: 84, eyeContact: 88, posture: 87, speechPace: 85, sessions: 3 },
  { date: 'Apr 5', confidence: 82, eyeContact: 85, posture: 88, speechPace: 87, sessions: 2 },
  { date: 'Apr 8', confidence: 87, eyeContact: 90, posture: 90, speechPace: 88, sessions: 2 },
  { date: 'Apr 11', confidence: 85, eyeContact: 88, posture: 91, speechPace: 90, sessions: 1 },
];