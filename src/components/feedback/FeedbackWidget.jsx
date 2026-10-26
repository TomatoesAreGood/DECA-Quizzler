import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FEEDBACK_SURVEY,
  getFeedbackOptionKey,
  getFeedbackResponsesKey,
  getFeedbackStorageKey,
} from '../../config/feedback';
import { hitCounters } from '../../utils/analytics';

// Pages that run a quiz, where the button would get in the way
const HIDDEN_PATHS = ['/quiz', '/favorites'];

// How long the thank-you note shows, then how long it takes to fade out (matches .feedback-widget in index.css)
const THANKS_MS = 1000;
const FADE_MS = 700;

const hasAnswered = (survey) => {
  try {
    return localStorage.getItem(getFeedbackStorageKey(survey)) !== null;
  } catch {
    return false;
  }
};

export function FeedbackWidget({ survey = FEEDBACK_SURVEY }) {
  const location = useLocation();
  const [answered, setAnswered] = useState(() => hasAnswered(survey));
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | sending | error | sent
  // Counters that still need sending after only some of them went through
  const [unsentKeys, setUnsentKeys] = useState(null);
  const [fadingOut, setFadingOut] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const closeAndRefocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Close on Escape or a click outside the panel
  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAndRefocus();
    };
    const handlePointerDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  // Leaving the page closes the panel
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // The thank-you note fades out on its own, taking the button with it
  useEffect(() => {
    if (status !== 'sent') return;
    const fadeTimeout = setTimeout(() => setFadingOut(true), THANKS_MS);
    const closeTimeout = setTimeout(() => setOpen(false), THANKS_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [status]);

  const toggleOption = (optionId) => {
    setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    if (status === 'error') setStatus('idle');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (selected.length === 0 || status === 'sending') return;

    setStatus('sending');
    const keys = unsentKeys ?? [
      ...survey.options.filter((option) => selected.includes(option.id)).map((option) => getFeedbackOptionKey(survey, option)),
      getFeedbackResponsesKey(survey),
    ];
    const failed = await hitCounters(keys);

    if (failed.length === 0) {
      try {
        localStorage.setItem(getFeedbackStorageKey(survey), 'sent');
      } catch {
        // Without storage the button just comes back on the next visit
      }
      setUnsentKeys(null);
      setAnswered(true);
      setStatus('sent');
    } else {
      // If some counters went through, lock the choices and only retry the rest
      setUnsentKeys(failed.length === keys.length ? unsentKeys : failed);
      setStatus('error');
    }
  };

  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (HIDDEN_PATHS.includes(path) || (answered && !open)) return null;

  const choicesLocked = unsentKeys !== null || status === 'sending';

  return (
    <div className={`feedback-widget${fadingOut ? ' is-fading-out' : ''}`}>
      {open && (
        <div className="feedback-panel" role="dialog" aria-label="Feedback" ref={panelRef} tabIndex={-1}>
          <div className="feedback-panel-header">
            <span className="feedback-eyebrow">Help improve the website</span>
            <button type="button" className="feedback-close" aria-label="Close feedback" onClick={closeAndRefocus}>
              ×
            </button>
          </div>

          {status === 'sent' ? (
            <p className="feedback-thanks" role="status">Thanks! Your feedback was sent.</p>
          ) : (
            <form onSubmit={submit}>
              <p className="feedback-question">{survey.question}</p>
              <p className="feedback-hint">Pick as many as you like.</p>
              <div className="feedback-options">
                {survey.options.map((option) => {
                  const checked = selected.includes(option.id);
                  return (
                    <label key={option.id} className={`feedback-option${checked ? ' is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={choicesLocked}
                        onChange={() => toggleOption(option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {status === 'error' && (
                <p className="feedback-error" role="alert">Couldn't send your feedback. Please try again.</p>
              )}
              <button type="submit" className="feedback-submit" disabled={selected.length === 0 || status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        ref={buttonRef}
        className="feedback-button"
        aria-label="Give feedback"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
    </div>
  );
}
