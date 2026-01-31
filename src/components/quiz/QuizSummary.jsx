import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FavoriteButton } from './FavoriteButton';

export function QuizSummary({ examName, numCorrect, questionsAnswered, incorrectQuestions, allAnsweredQuestions = [], isUnitTest }) {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [activeTab, setActiveTab] = useState('incorrect');

  // If there are no incorrect questions but there are answered questions, default to "all" tab
  useEffect(() => {
    if (incorrectQuestions.length === 0 && allAnsweredQuestions.length > 0) {
      setActiveTab('all');
    }
  }, [incorrectQuestions.length, allAnsweredQuestions.length]);

  const toggleQuestion = (index) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const renderQuestionCard = (question, index) => {
    const isExpanded = expandedQuestions.has(index);
    const reasoning = question.reasoning || '';
    const firstSentence = reasoning.substring(0, reasoning.indexOf('.') + 1);
    const remainingReasoning = reasoning.substring(reasoning.indexOf('.') + 1);

    return (
      <div key={index} className="incorrect-question-card">
        <FavoriteButton
          examName={question.exam || examName}
          questionNumber={question.number}
        />
        <div className="question-header">
          <span className="question-number">Q{question.number}</span>
          {isUnitTest && <span className="question-exam">{question.exam}</span>}
        </div>

        <p className="question-text">{question.question}</p>

        <div className="choices-list">
          {question.choices.map((choice, choiceIndex) => {
            const isCorrect = choice.substring(0, 1) === question.answer;
            const isUserAnswer = choice.substring(0, 1) === question.userAnswer;
            return (
              <div
                key={choiceIndex}
                className={`choice-item ${isCorrect ? 'choice-correct' : ''} ${isUserAnswer && !isCorrect ? 'choice-incorrect' : ''}`}
              >
                {choice}
              </div>
            );
          })}
        </div>

        <button
          className="explanation-toggle"
          onClick={() => toggleQuestion(index)}
        >
          <span className="toggle-icon">{isExpanded ? '−' : '+'}</span>
          {isExpanded ? 'Hide' : 'Show'} Explanation
        </button>

        {isExpanded && reasoning && (
          <div className="explanation-content">
            <div className="explanation-header">
              <strong>Explanation</strong>
            </div>
            <p className="explanation-text">
              <strong className="correct-answer">Correct Answer: {question.answer}</strong>
              <br />
              <strong>{firstSentence.replace('SOURCE:', '').trim()}</strong>
              {remainingReasoning}
            </p>
          </div>
        )}
      </div>
    );
  };

  const percentage = questionsAnswered === 0 ? null : Math.round((numCorrect / questionsAnswered) * 100);
  const displayExamName = examName.replace(/HnT/g, 'H&T');

  const correctQuestions = allAnsweredQuestions.filter(q => q.isCorrect);

  const questionsToDisplay =
    activeTab === 'incorrect' ? incorrectQuestions :
    activeTab === 'correct' ? correctQuestions :
    allAnsweredQuestions;

  return (
    <div className="quiz-summary">
      <div className="summary-header">
        <h1 className="summary-title">{displayExamName}</h1>
        <p className="summary-subtitle">Quiz Complete</p>
      </div>

      <div className="summary-stats">
        <div className="stat-card stat-card-score">
          <div className="stat-content">
            <div className="stat-value">{questionsAnswered === 0 ? 'N/A' : `${percentage}%`}</div>
            <div className="stat-label">Score</div>
          </div>
        </div>

        <div className="stat-card stat-card-correct">
          <div className="stat-content">
            <div className="stat-value">{numCorrect}</div>
            <div className="stat-label">Correct</div>
          </div>
        </div>

        <div className="stat-card stat-card-incorrect">
          <div className="stat-content">
            <div className="stat-value">{incorrectQuestions.length}</div>
            <div className="stat-label">Incorrect</div>
          </div>
        </div>

        <div className="stat-card stat-card-total">
          <div className="stat-content">
            <div className="stat-value">{questionsAnswered}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      </div>

      {questionsAnswered > 0 && (
        <div className="questions-section">
          <h2 className="questions-header">Review Questions</h2>

          <div className="summary-tabs">
            <button
              className={`tab-button ${activeTab === 'incorrect' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('incorrect')}
            >
              Incorrect ({incorrectQuestions.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'correct' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('correct')}
            >
              Correct ({correctQuestions.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'all' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({allAnsweredQuestions.length})
            </button>
          </div>

          <div className="incorrect-questions">
            {questionsToDisplay.map((question, index) => renderQuestionCard(question, index))}
          </div>
        </div>
      )}

      {incorrectQuestions.length === 0 && questionsAnswered === 0 && (
        <div className="perfect-score">
          <h2>No Questions Answered</h2>
          <p>You didn't answer any questions in this quiz.</p>
        </div>
      )}

      <div className="summary-actions">
        <Link to="/" className="action-button action-button-home">
          <span>← Home</span>
        </Link>
        <button
          className="action-button action-button-retry"
          onClick={() => window.location.reload()}
        >
          <span>Retry Quiz ↻</span>
        </button>
      </div>
    </div>
  );
}
