import { THEME_USERS_KEY, getThemeUsageKey } from "../config/themes";
import { getCurrentThemeId } from "./theme";

const nameSpace = "decaquizzler333";

// localStorage keys: set once this browser picks a theme, and the last day its theme was counted
const THEME_USED_KEY = "themeUsed";
const THEME_COUNTED_KEY = "themeCounted";

function deleteExtraLocalStorage() {
  const date = new Date();
  const activityKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  const keys = Object.keys(localStorage);
  let i = keys.length;

  while (i--) {
    if (keys[i] !== "uniqueVisit" && keys[i] !== activityKey && keys[i] !== "favExams" && keys[i] !== "theme" && keys[i] !== THEME_USED_KEY && keys[i] !== THEME_COUNTED_KEY && !keys[i].startsWith("feedback-")) {
      localStorage.removeItem(keys[i]);
    }
  }
}

async function safeFetch(url, onSuccess) {
  try {
    const response = await fetch(url);
    if (response.status === 429) {
      // Silently ignore rate limit errors
      console.warn('Analytics rate limit reached. Activity tracking paused temporarily.');
      return;
    }
    if (response.ok && onSuccess) {
      onSuccess();
    }
  } catch (error) {
    // Silently ignore network errors for analytics
    console.warn('Analytics tracking failed:', error.message);
  }
}

export function trackVisit() {
  if (Object.keys(localStorage).length > 10) {
    deleteExtraLocalStorage();
  }

  const date = new Date();
  const activityKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  const uniqueVisitsKey = `u${activityKey}`;
  const visitKey = `v${activityKey}`;

  // Track activity (always)
  safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${activityKey}`);

  // Track unique visit (first time only)
  if (localStorage.getItem("uniqueVisit") === null) {
    safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${uniqueVisitsKey}`, () => {
      localStorage.setItem("uniqueVisit", "True");
    });
  }

  // Track daily visit (first time per day)
  if (localStorage.getItem(activityKey) === null) {
    safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${visitKey}`, () => {
      localStorage.setItem(activityKey, "True");
    });
  }

  trackThemeUsage(activityKey);
}

// Requests still in flight, so quick clicks or page changes don't count anything twice
let themeUsedPending = false;
let themeUsagePending = false;

// Counts this person once, the first time they pick a theme other than the default
export function trackThemeUsed() {
  try {
    if (themeUsedPending || localStorage.getItem(THEME_USED_KEY) !== null) return;
  } catch {
    return;
  }
  themeUsedPending = true;
  safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${THEME_USERS_KEY}`, () => {
    localStorage.setItem(THEME_USED_KEY, "True");
  }).finally(() => {
    themeUsedPending = false;
  });
}

// Once a day, people who have picked a theme count toward the theme they're on (Light included)
function trackThemeUsage(activityKey) {
  if (themeUsagePending || localStorage.getItem(THEME_USED_KEY) === null || localStorage.getItem(THEME_COUNTED_KEY) === activityKey) {
    return;
  }
  themeUsagePending = true;
  safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${getThemeUsageKey(getCurrentThemeId())}`, () => {
    localStorage.setItem(THEME_COUNTED_KEY, activityKey);
  }).finally(() => {
    themeUsagePending = false;
  });
}

// Counts a completed quiz (reaching the summary screen) toward today's total and the all-time total
export function trackQuizCompleted() {
  const date = new Date();
  const completedKey = `c${date.getFullYear()}${date.getMonth()}${date.getDate()}`;

  safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${completedKey}`);
  safeFetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/completedTotal`);
}

// Adds 1 to each counter and returns the keys that failed, so a retry never counts anything twice
export async function hitCounters(keys) {
  const succeeded = await Promise.all(keys.map(async (key) => {
    try {
      const response = await fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${key}`);
      return response.ok;
    } catch {
      return false;
    }
  }));
  return keys.filter((_, i) => !succeeded[i]);
}
