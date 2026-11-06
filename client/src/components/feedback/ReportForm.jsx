import { useState } from 'react';
import { sendReport } from '../../lib/api';

// Report types match ReportType in server/src/db/schema.prisma. The server requires a question for
// the first three, so they're only offered when reporting from a quiz.
const QUESTION_TYPES = [
  { value: 'WRONG_ANSWER', label: 'The answer is wrong' },
  { value: 'TYPO', label: 'Typo or confusing wording' },
  { value: 'BAD_EXPLANATION', label: 'The explanation is wrong or unclear' },
  { value: 'OTHER', label: 'Something else' },
];
const PAGE_TYPES = [
  { value: 'BROKEN_PAGE', label: 'Something on the site is broken' },
  { value: 'OTHER', label: 'Something else' },
];

const MAX_LENGTH = 2000;

// question: { examCode, questionNum } when reporting a specific question
export function ReportForm({ question, onClose }) {
  const types = question ? QUESTION_TYPES : PAGE_TYPES;
  const [type, setType] = useState(types[0].value);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || status === 'sending') return;

    setStatus('sending');
    try {
      await sendReport({ type, content: trimmed, ...(question && { examCode: question.examCode, questionNum: question.questionNum }) });
      setStatus('sent');
    } catch (err) {
      console.error('Could not send report:', err);
      setErrorMessage(err.status === 429 ? err.message : "Couldn't send your report. Please try again.");
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="report-form">
        <p className="feedback-thanks" role="status">Thanks! Your report was sent.</p>
        {onClose && <button type="button" className="feedback-submit" onClick={onClose}>Close</button>}
      </div>
    );
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <p className="feedback-question">
        {question ? `Report a problem with ${question.examCode} question ${question.questionNum}` : 'Report a problem'}
      </p>

      <label className="form-label" htmlFor="report-type">What's wrong?</label>
      <select id="report-type" className="form-input" value={type} onChange={(e) => setType(e.target.value)} disabled={status === 'sending'}>
        {types.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <label className="form-label" htmlFor="report-content">Details</label>
      <textarea
        id="report-content"
        className="form-input form-textarea"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (status === 'error') setStatus('idle');
        }}
        maxLength={MAX_LENGTH}
        rows={4}
        required
        disabled={status === 'sending'}
      />

      {status === 'error' && <p className="feedback-error" role="alert">{errorMessage}</p>}
      <button type="submit" className="feedback-submit" disabled={!content.trim() || status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send report'}
      </button>
    </form>
  );
}
