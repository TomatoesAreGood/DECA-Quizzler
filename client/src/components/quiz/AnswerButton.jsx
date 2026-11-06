export function AnswerButton({ letter, text, isCorrect, isSelected, isRevealed, onClick, disabled }) {
  const className = `btn clickableButton ${isRevealed && isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'incorrect' : ''}`;

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      <div id="letter">{letter}</div>
      <p id="btn-text">{text}</p>
    </button>
  );
}
