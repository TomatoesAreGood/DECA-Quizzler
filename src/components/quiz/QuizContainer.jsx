import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QuizHeader } from './QuizHeader';
import { QuestionBox } from './QuestionBox';
import { AnswerChoices } from './AnswerChoices';
import { QuizControls } from './QuizControls';
import { QuizSummary } from './QuizSummary';
import { Modal } from '../shared/Modal';
import { shuffle, sort, linkify } from '../../utils/quizHelpers';

export function QuizContainer({ examName: propExamName, questions: propQuestions }) {
  const [searchParams] = useSearchParams();
  const [examName, setExamName] = useState(propExamName || searchParams.get('exam'));
  const [questions, setQuestions] = useState(propQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [numCorrect, setNumCorrect] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [modalContent, setModalContent] = useState({ header: 'WRONG', text: '', color: '#cf2656' });
  const [showModal, setShowModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isUnitTest, setIsUnitTest] = useState(propExamName === 'FAV-EXAM');
  const [sector, setSector] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!propQuestions);

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
        setSelectedAnswer(null);
        setIsRevealed(false);
        setShowModal(false);
        setShowExitModal(false);
        setLoading(true);

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

        if (startNum && startNum <= 100) {
          setCurrentQuestionIndex(parseInt(startNum) - 1);
        }

        setExamName(examNameFromUrl);
        setQuestions(loadedQuestions);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [searchParams, propQuestions]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSlowModeChange = (checked) => {
    setIsSlowMode(checked);
    // If turning off slow mode and a question is already answered, auto-advance
    if (!checked && isRevealed) {
      setShowModal(false);
      nextQuestion();
    }
  };

  const handleShuffleChange = (checked) => {
    setIsShuffled(checked);

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

    if (isCorrect) {
      setNumCorrect(prev => prev + 1);
      if (isSlowMode) {
        setModalContent({ header: 'CORRECT', text: formattedReasoning, color: '#079e28' });
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 750);
      }
    } else {
      const userAnswer = currentQuestion.choices[index].substring(0, 1);
      setIncorrectQuestions(prev => [...prev, { ...currentQuestion, userAnswer }]);
      setModalContent({ header: 'WRONG', text: formattedReasoning, color: '#cf2656' });
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

  if (showSummary) {
    return (
      <QuizSummary
        examName={examName}
        numCorrect={numCorrect}
        questionsAnswered={questionsAnswered}
        incorrectQuestions={incorrectQuestions.sort((a, b) => a.number - b.number)}
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
        />
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
        <p id="modalText">Your progress will NOT be saved and you will immediately go to the summary page.</p>
        <button id="confirmExitModalButton" className="clickableButton" onClick={() => { setShowExitModal(false); finishQuiz(); }}>
          <p>YES</p>
        </button>
      </Modal>
    </>
  );
}
