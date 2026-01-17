import { Toggle } from '../shared/Toggle';

export function QuizHeader({ quizName, slowMode, onSlowModeChange, shuffle, onShuffleChange }) {
  return (
    <div id="quiz-title">
      <h2 id="quiz-name">{quizName.replace(/HnT/g, 'H&T')}</h2>
      <ul>
        <Toggle label="Slow Mode" checked={slowMode} onChange={onSlowModeChange} />
        <Toggle label="Shuffle" checked={shuffle} onChange={onShuffleChange} />
      </ul>
    </div>
  );
}
