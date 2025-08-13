// js/data.js
export const STORAGE_KEY = 'pr-checklist-v1';

export const checklistData = [
  { id:'sec1', title:'1) Code Quality & Best Practices', hint:'Review critically, remove dead code, ensure naming & structure.', items:[
    { id:'1a', text:'Reviewed code as if written by someone else (critical mindset).', hint:'Reduce bias; pretend you are the reviewer.' },
    { id:'1b', text:'Removed unused code/imports and dead files.', hint:'Dead code confuses reviewers and future you.' },
    { id:'1c', text:'Addressed code smells / duplication / long functions.', hint:'Refactor into smaller, testable units.' },
    { id:'1d', text:'Meaningful, consistent naming (variables, functions, files, icons).', hint:'Name things by intent and domain language.' },
    { id:'1e', text:'Files follow agreed project structure & conventions.', hint:'Keep cohesion; respect module boundaries.' },
  ]},
  { id:'sec2', title:'2) Functional Verification', hint:'Validate feature works and hasn’t broken neighbors.', items:[
    { id:'2a', text:'App runs locally; feature works as intended.', hint:'Exercise primary flows end-to-end.' },
    { id:'2b', text:'Happy paths and key edge cases verified.', hint:'Nulls, timeouts, failed calls, slow nets.' },
    { id:'2c', text:'No unrelated functionality broken.', hint:'Quick smoke test adjacent features.' },
    { id:'2d', text:'UI/UX validated (responsiveness if relevant).', hint:'States: loading/empty/error, dark mode.' },
  ]},
  { id:'sec3', title:'3) Pipeline & Build', hint:'Don’t send broken builds to review.', items:[
    { id:'3a', text:'CI passes (build, lint, tests).', hint:'Wait for green before requesting review.' },
    { id:'3b', text:'If CI fails due to unrelated issue, reproduced from fresh develop and noted for reviewers.', hint:'Create a tiny fresh PR proving it exists on develop.' },
  ]},
  { id:'sec4', title:'4) Merge Conflicts', hint:'Conflicts are your responsibility until merge.', items:[
    { id:'4a', text:'Rebased/synced with develop (or main integration branch).', hint:'Prefer rebase for clean history if policy allows.' },
    { id:'4b', text:'No conflicts now; will re-check daily until merge.', hint:'Conflicts late in sprint cause avoidable delays.' },
  ]},
  { id:'sec5', title:'5) Review Comments Handling', hint:'Communicate clearly; let reviewers resolve threads.', items:[
    { id:'5a', text:'Responded to every comment (e.g., “done” or rationale).', hint:'Acknowledge decisions for future readers.' },
    { id:'5b', text:'I will not mark threads as Resolved unless the reviewer asks.', hint:'The opener closes; that’s the rule.' },
    { id:'5c', text:'Escalated unclear points via quick chat/call when needed.', hint:'Asynchronous thrash is costly—clarify fast.' },
  ]},
  { id:'sec6', title:'6) Documentation & Clarity', hint:'Write it down once so no one asks twice.', items:[
    { id:'6a', text:'Updated README / API docs / inline comments as needed.', hint:'Docs are part of the deliverable.' },
    { id:'6b', text:'Added comments for non-obvious logic.', hint:'Explain the “why”, not the “what”.' },
  ]},
  { id:'sec7', title:'7) API / Data (if applicable)', hint:'Contracts and compatibility matter.', items:[
    { id:'7a', text:'Request/response contracts validated.', hint:'Align with consumer expectations and types.' },
    { id:'7b', text:'Backward compatibility considered.', hint:'Versioning, feature flags, defaults.' },
    { id:'7c', text:'Mocks/Postman collections/docs updated.', hint:'Keep your tools in sync with reality.' },
  ]},
  { id:'sec8', title:'8) Accessibility & UX (if applicable)', hint:'Build for everyone.', items:[
    { id:'8a', text:'Keyboard navigation & screen reader checked.', hint:'Focus order, aria-labels, roles.' },
    { id:'8b', text:'Contrast/readability validated.', hint:'WCAG AA where feasible.' },
  ]},
  { id:'sec9', title:'9) Security & Performance', hint:'Don’t ship secrets; don’t ship slowness.', items:[
    { id:'9a', text:'No secrets/credentials committed.', hint:'Use env vars and secret managers.' },
    { id:'9b', text:'Avoided obvious performance bottlenecks; large queries reviewed.', hint:'Measure where it matters.' },
    { id:'9c', text:'Security linting/scans run (if available).', hint:'Address findings or note deferrals.' },
  ]},
  { id:'sec10', title:'10) Ownership', hint:'It’s your PR until it lands.', items:[
    { id:'10a', text:'I will monitor this PR until merged into develop.', hint:'Be responsive to follow-ups and conflicts.' },
  ]},
];
