// Feedback survey opened from the ? button in the bottom right corner.
// Set FEEDBACK_ENABLED to false to hide the button everywhere. Results stay on the traffic page.
export const FEEDBACK_ENABLED = false;

// Changing `id` starts a new survey: answers are counted separately and everyone sees the button again.
// Keep option ids short and stable, since they name the counters.
export const FEEDBACK_SURVEY = {
  id: 'features1',
  question: 'What feature or improvement would you like most on the website?',
  options: [
    { id: 'dark-mode', label: 'Dark mode / custom themes' },
    { id: 'wordle', label: "Wordle mini game (play today's Wordle on the site)" },
    { id: 'cleaner-ui', label: 'Cleaner website UI' },
    { id: 'more-exams', label: 'More exams' },
    { id: 'sound-effects', label: 'Sound effects' },
  ],
};

// Counter keys: one per option, plus one counting submitted responses
export const getFeedbackOptionKey = (survey, option) => `fb-${survey.id}-${option.id}`;
export const getFeedbackResponsesKey = (survey) => `fb-${survey.id}-responses`;

// Remembers in localStorage that this browser already answered the survey
export const getFeedbackStorageKey = (survey) => `feedback-${survey.id}`;
