const nameSpace = "decaquizzler333";

function deleteExtraLocalStorage() {
  const date = new Date();
  const activityKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  const keys = Object.keys(localStorage);
  let i = keys.length;

  while (i--) {
    if (keys[i] !== "uniqueVisit" && keys[i] !== activityKey && keys[i] !== "favExams") {
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
}
