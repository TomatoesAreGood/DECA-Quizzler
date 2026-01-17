import { AnswerButton } from './AnswerButton';

export function AnswerChoices({ choices, correctAnswer, selectedAnswer, isRevealed, onSelectAnswer, disabled }) {
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div id="choices">
      {choices.map((choice, index) => {
        const letter = choice.substring(0, 1);
        const text = choice.substring(2);
        const isCorrect = letter === correctAnswer;
        const isSelected = selectedAnswer === index;

        return (
          <AnswerButton
            key={index}
            letter={letters[index]}
            text={text}
            isCorrect={isCorrect}
            isSelected={isSelected}
            isRevealed={isRevealed}
            onClick={() => onSelectAnswer(index, isCorrect)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
