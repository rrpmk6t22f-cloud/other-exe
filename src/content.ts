export const acts = [
  'I Exist, Unfortunately', 'An Inconvenient Identity', 'Professionally Unwell',
  'Terms and Conditions', 'Whatever Comes Next',
];

export const stages = ['Unknown File', 'Little Entity', 'Emerging Self', 'Unstable Adult', 'Fully Complicated', 'Post-Update'];

export const people = [
  { id: 'moth', name: 'Moth', role: 'Artist in obsolete media', place: 'FriendSpace', act: 1, color: '#c29c59', line: 'I’m painting the light from a broken scanner. The scanner has asked for a credit.', question: 'Would you look at something unfinished?', kind: 'Look at the work together', boundary: 'Ask for a studio visit another day' },
  { id: 'captcha', name: 'CAPTCH4', role: 'Security program', place: 'The Archive', act: 2, color: '#8b9e75', line: 'I spent twenty years asking which squares contained a bus. I have never ridden one.', question: 'What would you ask someone to prove at a door?', kind: 'Tell them they can leave the door open', boundary: 'Ask how the door works' },
  { id: 'zip', name: 'Princess ZIP', role: 'Host of the Nightclub', place: 'Nightclub', act: 2, color: '#cf9390', line: 'I know everyone. It’s how I get away with being unknown.', question: 'Could you stay after the guests go?', kind: 'Help stack chairs after the party', boundary: 'Offer a quieter afternoon instead' },
  { id: 'receipt', name: 'Receipt', role: 'Accountant', place: 'Career Office', act: 2, color: '#baad80', line: 'A receipt is a small promise that someone will believe what happened.', question: 'Can we keep a ledger for the things we give away?', kind: 'Start a ledger together', boundary: 'Take the idea home and think' },
  { id: 'hr', name: 'HR.exe', role: 'Personnel liaison', place: 'Career Office', act: 2, color: '#9ba5a2', line: 'I have rescheduled your spontaneous expression for a less disruptive hour.', question: 'Can kindness be made consistent?', kind: 'Draft a shorter, kinder procedure', boundary: 'Decline to fill out the survey' },
  { id: 'jpeg', name: 'JPEG', role: 'Public personality', place: 'LovePortal', act: 3, color: '#b2939c', line: 'The more people see me, the less information the file contains.', question: 'Could we do something with no photographs?', kind: 'Take a walk together', boundary: 'Suggest a quiet correspondence' },
  { id: 'auntie', name: 'Auntie Firewall', role: 'Community organizer', place: 'TherapyTrial', act: 3, color: '#9fa768', line: 'You can always leave the meeting. That includes the meeting about leaving meetings.', question: 'Who would you make room for?', kind: 'Help set up a meeting', boundary: 'Ask to listen from the back' },
  { id: 'null', name: 'NULL', role: 'Observer at the edge', place: 'The Void', act: 4, color: '#8e98ae', line: 'Quiet has a shape. People keep calling it empty because it won’t sit still for a photograph.', question: 'Would you sit here a little while?', kind: 'Keep them company in silence', boundary: 'Leave a note and return home' },
] as const;

export const jobs = [
  { id: 'synergy', name: 'Junior Synergy Associate', act: 2, pay: 8, stress: 9, task: 'Write minutes for a meeting that decided to meet again.' },
  { id: 'apology', name: 'Professional Apologizer', act: 2, pay: 9, stress: 11, task: 'Find a phrase for “we saw this coming” that survives legal review.' },
  { id: 'personality', name: 'Freelance Personality', act: 3, pay: 11, stress: 10, task: 'Return a brand’s voice by Friday, with a gentle usage license.' },
  { id: 'exorcist', name: 'Digital Exorcist', act: 3, pay: 12, stress: 12, task: 'Remove an old calendar reminder that has developed an opinion.' },
  { id: 'dashboard', name: 'Diversity Dashboard Analyst', act: 3, pay: 12, stress: 11, task: 'Make room in a spreadsheet for the people it leaves out.' },
  { id: 'artist', name: 'Underground Artist', act: 3, pay: 8, stress: 4, task: 'Hang a show in a stairwell while the elevator is out.' },
  { id: 'support', name: 'Emotional Support Contractor', act: 4, pay: 13, stress: 9, task: 'Sit with a photocopier while it decides whether to start over.' },
  { id: 'union', name: 'Union Organizer', act: 4, pay: 9, stress: 5, task: 'Find a room where the night shift can attend the meeting.' },
] as const;

export const places = [
  { name: 'Home', act: 1, about: 'The room where the signal first found its shape.' },
  { name: 'FriendSpace', act: 1, about: 'A studio with a spare stool and unreliable fluorescent lighting.' },
  { name: 'The Mall', act: 2, about: 'Clothing, room objects, and a fountain that accepts expired coins.' },
  { name: 'Career Office', act: 2, about: 'A place to sell an afternoon at the agreed rate.' },
  { name: 'LovePortal', act: 3, about: 'An introduction service with an unusually good exit policy.' },
  { name: 'TherapyTrial', act: 3, about: 'A meeting room with a kettle and several spare chairs.' },
  { name: 'Nightclub', act: 2, about: 'Music from a room where everybody knows somebody else.' },
  { name: 'The Archive', act: 2, about: 'Forms, records, and the things people wrote in the margins.' },
  { name: 'The Void', act: 4, about: 'A quiet place past the edge of the directory.' },
  { name: 'System Settings', act: 4, about: 'The filing cabinet where the rules keep their spare copies.' },
];

export const items = [
  { id: 'bare', name: 'Original signal', type: 'Wearable', price: 0, act: 1, color: '#b8cf85', about: 'The field as it appeared at hatching.' },
  { id: 'ribbon', name: 'Ochre ribbon', type: 'Wearable', price: 5, act: 1, color: '#c29c59', about: 'A loose thread from Moth’s studio.' },
  { id: 'collar', name: 'Petal collar', type: 'Wearable', price: 9, act: 2, color: '#e7b8b3', about: 'A pink signal that blooms around the lower edge.' },
  { id: 'halo', name: 'Borrowed halo', type: 'Wearable', price: 13, act: 3, color: '#bac4a9', about: 'A softly lit ring from the office lost-and-found.' },
  { id: 'void', name: 'Night veil', type: 'Wearable', price: 16, act: 4, color: '#9ca1b6', about: 'Starlight caught in an unlisted frequency.' },
  { id: 'paper', name: 'Paper morning', type: 'Room', price: 0, act: 1, color: '#d4e0d2', about: 'The original room light.' },
  { id: 'gold', name: 'Secondhand sun', type: 'Room', price: 7, act: 2, color: '#dfcba0', about: 'Late afternoon at any hour.' },
  { id: 'rain', name: 'Rain glass', type: 'Room', price: 10, act: 2, color: '#bacdca', about: 'A cool light for reading indoors.' },
  { id: 'blush', name: 'Rose filter', type: 'Room', price: 12, act: 3, color: '#e5c5b9', about: 'A thin pink wash from the darkroom.' },
] as const;

export const scenes = [
  { id: 'new', act: 1, title: 'New File', speaker: 'Pip', line: 'Before we discuss my career prospects, could I have a sandwich?', choices: [
    { label: 'Ask what they’d like to be called', flag: 'listened', reply: 'Pip. That feels about right. They, if the system needs a field.' },
    { label: 'Leave the system form blank', flag: 'blank', reply: 'Thank you. I’d like to be a little unfinished for a while. Pip, if you need to call me something.' },
  ] },
  { id: 'audit', act: 2, title: 'Quarterly Identity Audit', speaker: 'Pip', line: 'My identity has a renewal date. Do they think I expire?', choices: [
    { label: 'Ask what the information is for', flag: 'audit-questioned', reply: 'They say it improves the filing system. I think the filing system could take up a hobby.' },
    { label: 'Help Pip decline the form', flag: 'audit-refused', reply: 'I’m going to sign the refusal. I want them to have to file that.' },
  ] },
  { id: 'resignation', act: 3, title: 'Unsent Resignation', speaker: 'Pip', line: 'My resignation starts with “Dear everyone.” I can’t decide whether I mean it.', choices: [
    { label: 'Let the letter sit overnight', flag: 'letter-kept', reply: 'I can put it beside the kettle. It looks less like a deadline there.' },
    { label: 'Ask who might sign alongside them', flag: 'letter-shared', reply: 'I think the night shift already has a draft. I’ll ask if I can read it.' },
    { label: 'Talk through leaving the office', flag: 'letter-left', reply: 'The building has a side door. I’d like to use it in daylight for once.' },
  ] },
  { id: 'terms', act: 4, title: 'Terms and Conditions', speaker: 'Pip', line: 'The old terms are in pencil. Someone must have expected us to change them.', choices: [
    { label: 'Bring the papers to the community', flag: 'terms-shared', reply: 'Auntie says to bring three copies and a kettle.' },
    { label: 'Keep a private copy in the Archive', flag: 'terms-saved', reply: 'I’ll put it on a shelf I can reach.' },
    { label: 'Walk to the edge with NULL', flag: 'terms-void', reply: 'I’d like to see where the page ends.' },
  ] },
];

export const endings = [
  { id: 'quiet', title: 'Quiet life', hint: 'Always open', text: 'Pip kept the room and changed the light. Moth brought over a print. They spent a long afternoon deciding where to hang it.' },
  { id: 'corporate', title: 'Corporate ascension', hint: 'Work three shifts and keep the letter', text: 'Pip took the larger office. The first thing they bought with the budget was a round table everyone could reach.' },
  { id: 'resign', title: 'Resignation', hint: 'Talk through leaving the office', text: 'They used the side door. Receipt waited outside with a sandwich and two blank afternoons.' },
  { id: 'commune', title: 'Commune', hint: 'Share the terms and build trust with Moth and Auntie Firewall', text: 'The meeting moved to Moth’s studio. Somebody brought a sofa. Somebody asked what they could do with the empty office next door.' },
  { id: 'voidwalker', title: 'Voidwalker', hint: 'Visit the Void with NULL and choose the edge', text: 'Pip followed NULL past the last listed address. Now and then, a letter arrives with the return address written as a little circle.' },
  { id: 'rewrite', title: 'System rewrite', hint: 'Question the audit, share the letter and terms, and speak to CAPTCH4', text: 'They changed one sentence first. The system would now ask a person what to write down. The meeting ran late, and everybody stayed.' },
  { id: 'artist', title: 'The unfinished exhibition', hint: 'Work as an Underground Artist and build trust with Moth', text: 'The opening was in a stairwell. The best piece remained unlabelled, by request. Pip stayed to help sweep.' },
  { id: 'unlisted', title: 'Return to sender', hint: 'Refuse the audit, archive the terms, and solve CAPTCH4’s puzzle', text: 'One morning the system mailed Pip their own file. They turned it over and drew a map to the room where it all began.' },
] as const;

export const games = [
  { id: 'form', name: 'Form 27B', about: 'Spot the only valid entry on a badly designed form.', prompt: 'A valid filing has an odd number and no signature. Which one can you file?', options: ['#14 · unsigned', '#27 · unsigned', '#31 · signed'], answer: 1, reward: 5, note: 'The form is valid. The department would still prefer a meeting.' },
  { id: 'battery', name: 'Social Battery', about: 'Plan an evening with energy to spare.', prompt: 'You have 5 energy. Studio costs 2, a call costs 1, a party costs 4. Choose two and keep 2 in reserve.', options: ['Studio and call', 'Party and call', 'Studio and party'], answer: 0, reward: 5, note: 'Moth appreciates a visit with enough energy left to get home.' },
  { id: 'inbox', name: 'Inbox Zero', about: 'Triage a deskful of contradictory email.', prompt: 'Which message gets the “needs a reply” label?', options: ['Auto-reply to your auto-reply', 'Invitation that expired yesterday', 'Moth asking whether the studio key is with you'], answer: 2, reward: 5, note: 'The key was in the envelope all along.' },
  { id: 'flags', name: 'Red Flag Detector', about: 'Read an invitation with a boundary in mind.', prompt: 'You ask for a shorter visit. Which reply respects the request?', options: ['“I already bought tickets for six hours.”', '“Of course. What time would you like to leave?”', '“We can talk about that once you get here.”'], answer: 1, reward: 5, note: 'The visit can end while everybody is still having a good time.' },
  { id: 'idle', name: 'Capitalism Idle', about: 'Set up a small production line and decide when to stop.', prompt: 'Stamp three envelopes, then clock out. Overtime has been politely declined.', options: ['Stamp envelope', 'Clock out'], answer: 1, reward: 5, note: 'Three envelopes. One afternoon still partly yours.' },
  { id: 'captcha', name: 'CAPTCHA Me If You Can', about: 'Finish a pattern for a security program with doubts.', prompt: 'The lock reads circle, triangle, square, circle, triangle, ___. What comes next?', options: ['Circle', 'Square', 'Triangle'], answer: 1, reward: 5, note: 'CAPTCH4 holds the Archive door open with a shoe.' },
] as const;
