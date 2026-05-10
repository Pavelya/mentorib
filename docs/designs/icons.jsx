// Mentor IB icon set — Lucide line family
// Source: src/components/ui/icon.tsx in Pavelya/mentorib@main
// The app uses lucide-react. These are inline copies of the same paths so any
// HTML kit can render them without a bundler. Stroke 1.75, viewBox 0 0 24 24,
// currentColor, round caps/joins.

const _svg = (children) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

// Subjects
function EnglishIcon() { return _svg(<><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></>); }
function MathAAIcon() { return _svg(<path d="M18 7V4H6l6 8-6 8h12v-3"/>); }
function MathAIIcon() { return _svg(<><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/></>); }
function BiologyIcon() { return _svg(<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></>); }
function ChemistryIcon() { return _svg(<><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></>); }
function PhysicsIcon() { return _svg(<><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></>); }
function HistoryIcon() { return _svg(<><path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/></>); }
function BusinessIcon() { return _svg(<><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></>); }
function EconomicsIcon() { return _svg(<><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></>); }
function PsychologyIcon() { return _svg(<><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M3.477 10.896a4 4 0 0 1 2.526-5.77"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.402 6.5A3 3 0 1 1 12 5"/></>); }
function TokIcon() { return _svg(<><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></>); }

// Roles & status
function StudentRoleIcon() { return _svg(<><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></>); }
function TutorRoleIcon() { return _svg(<><path d="M2 3h20"/><path d="M21 3v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3"/><path d="m7 21 5-6 5 6"/><path d="M12 15v6"/></>); }
function ReviewedIcon() { return _svg(<><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></>); }
function CheckIcon() { return _svg(<path d="M20 6 9 17l-5-5"/>); }
function ClockIcon() { return _svg(<><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></>); }
function PauseIcon() { return _svg(<><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></>); }

// Subject map keyed by IB subject key (matches iconRegistry in icon.tsx)
const SubjectIcons = {
  english: EnglishIcon,
  math_aa: MathAAIcon,
  math_ai: MathAIIcon,
  biology: BiologyIcon,
  chemistry: ChemistryIcon,
  physics: PhysicsIcon,
  history: HistoryIcon,
  business: BusinessIcon,
  economics: EconomicsIcon,
  psychology: PsychologyIcon,
  tok: TokIcon,
};

if (typeof window !== "undefined") {
  Object.assign(window, {
    EnglishIcon, MathAAIcon, MathAIIcon, BiologyIcon, ChemistryIcon, PhysicsIcon,
    HistoryIcon, BusinessIcon, EconomicsIcon, PsychologyIcon, TokIcon,
    StudentRoleIcon, TutorRoleIcon, ReviewedIcon, CheckIcon, ClockIcon, PauseIcon,
    SubjectIcons,
  });
}
