import { useCallback, useMemo, useRef, useState } from 'react';
import * as api from '../lib/api';

const SAVE_FAILED = "Couldn't save your progress. Answers from here on might not be saved.";

// savedCurrent: the current question the server has for this attempt ("examCode#number"), so the same
// one isn't sent twice
const newQuiz = () => ({ attemptId: null, stopped: false, savedCurrent: null });

const questionKey = ({ examCode, questionNum }) => `${examCode}#${questionNum}`;

// The current question a new attempt was created with, if its start body had one
const startBodyCurrent = (body) =>
  body.currentExamCode ? questionKey({ examCode: body.currentExamCode, questionNum: body.currentQuestionNum }) : null;

// Saves quiz progress to the server for a signed-in user. Saves run one at a time in the order they
// were made, so an answer is never saved before its attempt exists, and a quiz is never marked
// completed before its last answer is saved.
//
// The attempt is created when the first answer is saved, not when the page opens, so just looking at
// an exam doesn't start (or replace) an attempt.
export function useAttemptSync() {
  const queue = useRef(Promise.resolve());
  // The quiz being saved. reset() swaps in a new one; saves already queued for the old quiz still
  // finish against the old quiz's attempt.
  const quiz = useRef(newQuiz());
  const [saveError, setSaveError] = useState(null);

  // force: run even after saving stopped (used to start over)
  const enqueue = useCallback((task, { force = false } = {}) => {
    const target = quiz.current;
    queue.current = queue.current
      .then(() => (force || !target.stopped ? task(target) : undefined))
      .catch((err) => {
        console.error('Could not save quiz progress:', err);
        // 404/409: the attempt was deleted, or completed or restarted somewhere else (e.g. another tab)
        if (err.status === 404 || err.status === 409) target.stopped = true;
        if (target === quiz.current) setSaveError(SAVE_FAILED);
      });
  }, []);

  // Starts tracking a different quiz. Call before loading a new exam.
  const reset = useCallback(() => {
    quiz.current = newQuiz();
    setSaveError(null);
  }, []);

  // Continue saving to an attempt loaded from the server
  const resumeAttempt = useCallback((attempt) => {
    quiz.current.attemptId = attempt.id;
    quiz.current.savedCurrent = attempt.currentExamCode
      ? questionKey({ examCode: attempt.currentExamCode, questionNum: attempt.currentQuestionNum })
      : null;
  }, []);

  // Starts a new attempt right away (starting over). The server completes any in-progress attempt at
  // the same exam. Saves queued before this still go to the old attempt.
  const startNow = useCallback((body) => {
    setSaveError(null);
    enqueue(async (target) => {
      try {
        target.attemptId = (await api.startAttempt(body)).id;
        target.stopped = false;
        target.savedCurrent = startBodyCurrent(body);
      } catch (err) {
        // Saving more answers to the old attempt would mix the two runs, so stop instead
        target.attemptId = null;
        target.stopped = true;
        throw err;
      }
    }, { force: true });
  }, [enqueue]);

  // Saves an answer. getStartBody() gives the new attempt's settings if none exists yet; it's called
  // when the save runs, so it sees the latest settings.
  const saveAnswer = useCallback((answer, getStartBody) => {
    enqueue(async (target) => {
      if (!target.attemptId) {
        try {
          const body = getStartBody();
          target.attemptId = (await api.startAttempt(body)).id;
          target.savedCurrent = startBodyCurrent(body);
        } catch (err) {
          target.stopped = true;
          throw err;
        }
      }
      await api.saveAnswer(target.attemptId, answer);
    });
  }, [enqueue]);

  // Saves a settings change. Before the first answer there's no attempt yet, and the new attempt
  // picks up the current settings when it's created.
  const saveSettings = useCallback((settings) => {
    enqueue(async (target) => {
      if (target.attemptId) await api.updateAttempt(target.attemptId, settings);
    });
  }, [enqueue]);

  // Saves the question on screen ({ examCode, questionNum }), so coming back resumes on it. Before the
  // first answer there's no attempt, and nothing needs saving: an unstarted quiz opens at the start.
  const saveCurrentQuestion = useCallback((question) => {
    const key = questionKey(question);
    enqueue(async (target) => {
      if (!target.attemptId || target.savedCurrent === key) return;
      await api.updateAttempt(target.attemptId, { currentExamCode: question.examCode, currentQuestionNum: question.questionNum });
      target.savedCurrent = key;
    });
  }, [enqueue]);

  const complete = useCallback(() => {
    enqueue(async (target) => {
      if (target.attemptId) await api.completeAttempt(target.attemptId);
    });
  }, [enqueue]);

  // Stops saving for the current quiz and shows why
  const fail = useCallback((message) => {
    quiz.current.stopped = true;
    setSaveError(message);
  }, []);

  return useMemo(
    () => ({ saveError, reset, resumeAttempt, startNow, saveAnswer, saveSettings, saveCurrentQuestion, complete, fail }),
    [saveError, reset, resumeAttempt, startNow, saveAnswer, saveSettings, saveCurrentQuestion, complete, fail],
  );
}
