export function QuizControls({ showNext, showExplanation, onExit, onShowExplanation, onNext }) {
  return (
    <div id="quiz-buttons">
      <button id="summary-btn" className="clickableButton quizButton" onClick={onExit}>
        Exit
      </button>
      {showExplanation && (
        <button id="show-explanation" className="clickableButton quizButton" onClick={onShowExplanation}>
          Show Explanation
        </button>
      )}
      {showNext && (
        <button id="next-question" className="clickableButton quizButton" onClick={onNext}>
          Next Question
        </button>
      )}
    </div>
  );
}
