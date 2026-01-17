import { FavoriteButton } from './FavoriteButton';

export function QuestionBox({ questionNumber, questionText, examName, isUnitTest, realExamName }) {
  const displayText = isUnitTest ? `(${realExamName}) ${questionText}` : questionText;

  return (
    <div id="question-box">
      <div id="number">{questionNumber}</div>
      <h3 id="question">{displayText}</h3>
      <FavoriteButton examName={realExamName || examName} questionNumber={questionNumber} />
    </div>
  );
}
