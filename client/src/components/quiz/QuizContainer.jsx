import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QuizHeader } from './QuizHeader';
import { QuestionBox } from './QuestionBox';
import { AnswerChoices } from './AnswerChoices';
import { QuizControls } from './QuizControls';
import { QuizSummary } from './QuizSummary';
import { Modal } from '../shared/Modal';
import { ReportForm } from '../feedback/ReportForm';
import { shuffle, sort, linkify } from '../../utils/quizHelpers';
import { trackQuizCompleted } from '../../utils/analytics';
import { useAuth } from '../../context/AuthContext';
import { useAttemptSync } from '../../hooks/useAttemptSync';
import { apiEnabled, findInProgressAttempt, getAttempt } from '../../lib/api';

// Letters are taken from the choice's position, not its text: a few questions have an empty choice
const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

// Unit and favorites quizzes mix questions from several exams, so a question is its exam plus number
const questionKey = (examCode, number) => `${examCode}#${number}`;

// The CORRECT/WRONG modal for an answered question
function explanationFor(question, isCorrect) {
  const reasoning = question.reasoning;
  const text = `The correct answer was: ${question.answer}<br> <b>${reasoning.substring(0, reasoning.indexOf('.'))}</b>${linkify(reasoning.substring(reasoning.indexOf('.')))}`;
  return isCorrect
    ? { header: 'CORRECT', text, color: 'var(--color-success-text)' }
    : { header: 'WRONG', text, color: 'var(--color-error-text)' };
}

export function QuizContainer({ examName: propExamName, questions: propQuestions }) {
  const [searchParams] = useSearchParams();
  const [examName, setExamName] = useState(propExamName || searchParams.get('exam'));
  const [questions, setQuestions] = useState(propQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [numCorrect, setNumCorrect] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [allAnsweredQuestions, setAllAnsweredQuestions] = useState([]);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [modalContent, setModalContent] = useState({ header: 'WRONG', text: '', color: 'var(--color-error-text)' });
  const [showModal, setShowModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUnitTest, setIsUnitTest] = useState(propExamName === 'FAV-EXAM');
  const [sector, setSector] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!propQuestions);
  const completionTracked = useRef(false);

  // ---- Saved progress (signed-in users only) ----
  const { status: authStatus } = useAuth();
  const sync = useAttemptSync();
  // Goes up each time a quiz finishes loading, so its saved progress is looked up exactly once
  const [loadId, setLoadId] = useState(propQuestions ? 1 : 0);
  const loadIdRef = useRef(loadId);
  loadIdRef.current = loadId;
  const progressCheckedFor = useRef(0);
  // 'pending' until we know whether there's saved progress to pick up; the quiz waits for 'ready'
  const [progressStatus, setProgressStatus] = useState('pending');
  // Whether this quiz's answers are being saved
  const [isSaving, setIsSaving] = useState(false);
  // How many answers were picked up from saved progress (shows the "Start over" note)
  const [resumedCount, setResumedCount] = useState(0);
  // The quiz in its original order (for resuming and starting over), and the index it was opened at
  // (?number=, a debugging aid that isn't saved; starting over goes back to it)
  const baseRef = useRef({ questions: propQuestions ? [...propQuestions] : [], startIndex: 0 });
  // Read when a new attempt is created, which can happen a moment after the answer that triggers it
  const settingsRef = useRef({ isShuffled, isSlowMode });
  settingsRef.current = { isShuffled, isSlowMode };

  useEffect(() => {
    if (propQuestions) return;

    const loadQuestions = async () => {
      try {
        const startNum = searchParams.get('number');
        let examNameFromUrl = searchParams.get('exam');

        if (!examNameFromUrl) {
          setError('No exam specified');
          setLoading(false);
          return;
        }

        // Reset quiz state when loading a new exam
        setShowSummary(false);
        setCurrentQuestionIndex(0);
        setNumCorrect(0);
        setQuestionsAnswered(0);
        setIncorrectQuestions([]);
        setAllAnsweredQuestions([]);
        setSelectedAnswer(null);
        setIsRevealed(false);
        setShowModal(false);
        setShowExitModal(false);
        setShowReportModal(false);
        // The questions load in order, so the Shuffle toggle starts off to match
        setIsShuffled(false);
        setError(null);
        setLoading(true);
        completionTracked.current = false;
        sync.reset();
        setProgressStatus('pending');
        setIsSaving(false);
        setResumedCount(0);

        let sectorName = examNameFromUrl.substring(5, 8);
        if (sectorName === 'COR') sectorName = 'CORE';

        const isUnit = examNameFromUrl.substring(examNameFromUrl.length - 4) === 'UNIT';
        setIsUnitTest(isUnit);

        if (isUnit) {
          setSector(examNameFromUrl.substring(5, examNameFromUrl.length));
        } else {
          setSector(sectorName);
        }

        // Load from UNIT file if it's a UNIT exam, otherwise load from regular sector file
        const fileName = isUnit ? `${sectorName}-UNIT.json` : `${sectorName}.json`;
        const response = await fetch(`/data/${fileName}`);
        if (!response.ok) throw new Error('Failed to fetch exam data');

        const data = await response.json();

        if (!(examNameFromUrl in data)) {
          setError(`Exam ${examNameFromUrl} not found`);
          setLoading(false);
          return;
        }

        let loadedQuestions = [...data[examNameFromUrl]];
        sort(loadedQuestions);

        // ?number= opens the quiz at that question
        const startNumber = Number(startNum);
        const startIndex = Number.isInteger(startNumber) && startNumber >= 1 && startNumber <= loadedQuestions.length ? startNumber - 1 : 0;
        setCurrentQuestionIndex(startIndex);
        baseRef.current = { questions: loadedQuestions, startIndex };

        setExamName(examNameFromUrl);
        setQuestions(loadedQuestions);
        setLoading(false);
        setLoadId((id) => id + 1);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [searchParams, propQuestions]);

  // Puts a quiz back where the user left it, on the question that was on screen. Answered questions
  // are taken out of the remaining pool, which continues in order, or shuffled again if Shuffle was on.
  const applySavedProgress = (attempt) => {
    const examOf = (question) => question.exam ?? examName;
    const keyOf = (question) => questionKey(examOf(question), question.number);
    const byKey = new Map(baseRef.current.questions.map((question) => [keyOf(question), question]));
    const currentKey = attempt.currentExamCode ? questionKey(attempt.currentExamCode, attempt.currentQuestionNum) : null;

    const answered = [];
    const answeredKeys = new Set();
    for (const answer of attempt.completedQuestions) {
      const key = questionKey(answer.examCode, answer.questionNum);
      answeredKeys.add(key);
      // A favorites quiz may no longer contain a question that was answered earlier
      const question = byKey.get(key);
      if (question) answered.push({ ...question, userAnswer: answer.selectedAnswer, isCorrect: answer.isCorrect });
    }

    let remaining = baseRef.current.questions.filter((question) => !answeredKeys.has(keyOf(question)));
    if (attempt.isShuffled) shuffle(remaining);

    // In Slow Mode, the user may have left on a question they'd answered without pressing Next yet:
    // show it again answered, with Next. Otherwise the quiz picks up at the saved question and goes on
    // from there, wrapping around to any earlier unanswered ones (only possible after opening the quiz
    // at a ?number=). With Shuffle on, the rest are in random order anyway.
    const answeredCurrent = attempt.slowMode && currentKey ? answered.find((question) => keyOf(question) === currentKey) : undefined;
    if (!answeredCurrent && currentKey) {
      const index = remaining.findIndex((question) => keyOf(question) === currentKey);
      if (index > 0) remaining = [...remaining.slice(index), ...remaining.slice(0, index)];
    }

    const before = answeredCurrent ? answered.filter((question) => question !== answeredCurrent) : answered;
    setQuestions(answeredCurrent ? [...before, answeredCurrent, ...remaining] : [...before, ...remaining]);
    setCurrentQuestionIndex(before.length);
    setNumCorrect(answered.filter((question) => question.isCorrect).length);
    setQuestionsAnswered(answered.length);
    setAllAnsweredQuestions(answered);
    setIncorrectQuestions(answered.filter((question) => !question.isCorrect));
    setIsShuffled(attempt.isShuffled);
    setIsSlowMode(attempt.slowMode);
    if (answeredCurrent) {
      setSelectedAnswer(ANSWER_LETTERS.indexOf(answeredCurrent.userAnswer));
      setIsRevealed(true);
      setModalContent(explanationFor(answeredCurrent, answeredCurrent.isCorrect));
    } else {
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
    setResumedCount(answered.length);
    sync.resumeAttempt(attempt);

    // Everything was answered and the user wasn't still looking at the last answer
    if (remaining.length === 0 && !answeredCurrent) setShowSummary(true);
  };

  // Once a quiz is loaded and we know who's signed in, pick up any saved progress
  useEffect(() => {
    if (loading || error || loadId === 0 || authStatus === 'loading') return;
    if (progressCheckedFor.current === loadId) return;
    progressCheckedFor.current = loadId;
    const thisLoad = loadId;

    if (authStatus !== 'signedIn' || !apiEnabled) {
      setIsSaving(false);
      setProgressStatus('ready');
      return;
    }

    setIsSaving(true);
    (async () => {
      try {
        const inProgress = await findInProgressAttempt(examName);
        const attempt = inProgress ? await getAttempt(inProgress.id) : null;
        if (loadIdRef.current !== thisLoad) return;
        if (attempt) applySavedProgress(attempt);
      } catch (err) {
        console.error('Could not load saved progress:', err);
        if (loadIdRef.current !== thisLoad) return;
        // Starting a fresh attempt would replace the saved one, so this quiz isn't saved at all
        sync.fail("Couldn't load your saved progress, so this quiz won't be saved.");
        setIsSaving(false);
      }
      setProgressStatus('ready');
    })();
  }, [loading, error, loadId, authStatus, examName]);

  // Settings for the attempt created when the first answer is saved. It runs a moment after the
  // answer, so it reads the latest settings and position from refs.
  const getStartBody = () => ({
    examCode: examName,
    isShuffled: settingsRef.current.isShuffled,
    slowMode: settingsRef.current.isSlowMode,
    ...(resumePointRef.current && {
      currentExamCode: resumePointRef.current.examCode,
      currentQuestionNum: resumePointRef.current.questionNum,
    }),
  });

  const handleStartOver = () => {
    const { questions: base, startIndex } = baseRef.current;
    setQuestions([...base]);
    setCurrentQuestionIndex(startIndex);
    setNumCorrect(0);
    setQuestionsAnswered(0);
    setIncorrectQuestions([]);
    setAllAnsweredQuestions([]);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setShowModal(false);
    setIsShuffled(false);
    setResumedCount(0);
    const first = base[startIndex];
    sync.startNow({
      examCode: examName,
      isShuffled: false,
      slowMode: isSlowMode,
      ...(first && { currentExamCode: first.exam ?? examName, currentQuestionNum: first.number }),
    });
  };

  // Count a completed quiz each time the summary screen is reached, including exiting early
  useEffect(() => {
    if (showSummary && !completionTracked.current) {
      completionTracked.current = true;
      trackQuizCompleted();
      if (isSaving) sync.complete();
    }
  }, [showSummary]);

  const currentQuestion = questions[currentQuestionIndex];

  // Where the quiz should pick up if the user leaves now: the question on screen. Without Slow Mode,
  // an answered question moves on by itself (after the WRONG popup or a short pause), so from then on
  // it's the question coming up next. In Slow Mode it stays the answered question until Next.
  const resumeQuestion = isRevealed && !isSlowMode ? questions[currentQuestionIndex + 1] : currentQuestion;
  const resumePoint = resumeQuestion ? { examCode: resumeQuestion.exam ?? examName, questionNum: resumeQuestion.number } : null;
  const resumePointRef = useRef(resumePoint);
  resumePointRef.current = resumePoint;
  const resumeKey = resumePoint ? questionKey(resumePoint.examCode, resumePoint.questionNum) : null;

  useEffect(() => {
    if (!isSaving || showSummary || progressStatus !== 'ready' || !resumePointRef.current) return;
    sync.saveCurrentQuestion(resumePointRef.current);
  }, [isSaving, showSummary, progressStatus, resumeKey]);

  const handleSlowModeChange = (checked) => {
    setIsSlowMode(checked);
    if (isSaving) sync.saveSettings({ slowMode: checked });
    // If turning off slow mode and a question is already answered, auto-advance
    if (!checked && isRevealed) {
      setShowModal(false);
      nextQuestion();
    }
  };

  const handleShuffleChange = (checked) => {
    setIsShuffled(checked);
    if (isSaving) sync.saveSettings({ isShuffled: checked });

    let remainingQuestions = [...questions.slice(currentQuestionIndex)];

    if (isSlowMode && isRevealed) {
      remainingQuestions = remainingQuestions.slice(1);
    }

    if (checked) {
      shuffle(remainingQuestions);
    } else {
      sort(remainingQuestions);
    }

    setQuestions([...questions.slice(0, currentQuestionIndex), ...remainingQuestions]);
    setCurrentQuestionIndex(currentQuestionIndex);
    resetQuestion();
  };

  const handleSelectAnswer = (index, isCorrect) => {
    if (isRevealed) return;

    setSelectedAnswer(index);
    setIsRevealed(true);
    setQuestionsAnswered(prev => prev + 1);

    const reasoning = currentQuestion.reasoning;
    const formattedReasoning = `The correct answer was: ${currentQuestion.answer}<br> <b>${reasoning.substring(0, reasoning.indexOf('.'))}</b>${linkify(reasoning.substring(reasoning.indexOf('.')))}`;

    const userAnswer = currentQuestion.choices[index].substring(0, 1);
    setAllAnsweredQuestions(prev => [...prev, { ...currentQuestion, userAnswer, isCorrect }]);

    if (isSaving) {
      sync.saveAnswer(
        {
          examCode: currentQuestion.exam ?? examName,
          questionNum: currentQuestion.number,
          selectedAnswer: ANSWER_LETTERS[index],
          isCorrect,
        },
        getStartBody,
      );
    }

    if (isCorrect) {
      setNumCorrect(prev => prev + 1);
      if (isSlowMode) {
        setModalContent({ header: 'CORRECT', text: formattedReasoning, color: 'var(--color-success-text)' });
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 750);
      }
    } else {
      setIncorrectQuestions(prev => [...prev, { ...currentQuestion, userAnswer }]);
      setModalContent({ header: 'WRONG', text: formattedReasoning, color: 'var(--color-error-text)' });
      setShowModal(true);
    }
  };

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestion();
    }
  };

  const finishQuiz = () => {
    setShowSummary(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (!isSlowMode) {
      nextQuestion();
    }
  };

  const handleShowExplanation = () => {
    setShowModal(true);
  };

  if (loading) {
    return <div className="quiz"><h1>Loading...</h1></div>;
  }

  if (error) {
    return <div className="quiz"><h1>Error 404: Exam {examName} not found</h1></div>;
  }

  if (progressStatus !== 'ready') {
    return <div className="quiz"><h1>Loading...</h1></div>;
  }

  if (showSummary) {
    return (
      <QuizSummary
        examName={examName}
        numCorrect={numCorrect}
        questionsAnswered={questionsAnswered}
        incorrectQuestions={incorrectQuestions.sort((a, b) => a.number - b.number)}
        allAnsweredQuestions={allAnsweredQuestions.sort((a, b) => a.number - b.number)}
        isUnitTest={isUnitTest}
      />
    );
  }

  if (!currentQuestion) {
    return <div className="quiz"><h1>No questions available</h1></div>;
  }

  const realExamName = isUnitTest ? currentQuestion.exam : examName;

  return (
    <>
      <div className="quiz">
        <QuizHeader
          quizName={examName}
          slowMode={isSlowMode}
          onSlowModeChange={handleSlowModeChange}
          shuffle={isShuffled}
          onShuffleChange={handleShuffleChange}
        />

        {resumedCount > 0 && (
          <p className="quiz-progress-note">
            Picked up where you left off ({resumedCount} answered).{' '}
            <button type="button" className="link-button" onClick={handleStartOver}>Start over</button>
          </p>
        )}

        <QuestionBox
          questionNumber={currentQuestion.number}
          questionText={currentQuestion.question}
          examName={examName}
          isUnitTest={isUnitTest}
          realExamName={realExamName}
        />

        <AnswerChoices
          choices={currentQuestion.choices}
          correctAnswer={currentQuestion.answer}
          selectedAnswer={selectedAnswer}
          isRevealed={isRevealed}
          onSelectAnswer={handleSelectAnswer}
          disabled={isRevealed}
        />

        <QuizControls
          showNext={isSlowMode && isRevealed}
          showExplanation={isSlowMode && isRevealed}
          onExit={() => setShowExitModal(true)}
          onShowExplanation={handleShowExplanation}
          onNext={nextQuestion}
          onReport={apiEnabled ? () => setShowReportModal(true) : undefined}
        />

        {sync.saveError && <p className="quiz-save-error" role="alert">{sync.saveError}</p>}
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <h1 id="modalHeader" style={{ color: modalContent.color }}>{modalContent.header}</h1>
        <p id="modalText" dangerouslySetInnerHTML={{ __html: modalContent.text }}></p>
        {isSlowMode && (
          <button id="hideModalButton" className="clickableButton" onClick={handleCloseModal} style={{ display: 'block' }}>
            <p>OK</p>
          </button>
        )}
      </Modal>

      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} variant="confirm">
        <h1 id="modalHeader">ARE YOU SURE?</h1>
        <p id="modalText">
          {isSaving
            ? 'This ends the quiz and goes to the summary page. To finish it later instead, just leave this page: your progress is saved.'
            : 'Your progress will NOT be saved and you will immediately go to the summary page.'}
        </p>
        <button id="confirmExitModalButton" className="clickableButton" onClick={() => { setShowExitModal(false); finishQuiz(); }}>
          <p>YES</p>
        </button>
      </Modal>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} variant="confirm">
        <ReportForm
          key={`${realExamName}#${currentQuestion.number}`}
          question={{ examCode: currentQuestion.exam ?? examName, questionNum: currentQuestion.number }}
          onClose={() => setShowReportModal(false)}
        />
      </Modal>
    </>
  );
}
