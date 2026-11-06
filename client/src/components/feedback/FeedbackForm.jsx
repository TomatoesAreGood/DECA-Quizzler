import { useState } from 'react';
import { sendFeedback } from '../../lib/api';

const MAX_LENGTH = 2000;

export function FeedbackForm() {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || status === 'sending') return;

    setStatus('sending');
    try {
      await sendFeedback({ content: trimmed, ...(rating && { rating: Number(rating) }) });
      setStatus('sent');
    } catch (err) {
      console.error('Could not send feedback:', err);
      setErrorMessage(err.status === 429 ? err.message : "Couldn't send your feedback. Please try again.");
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return <p className="feedback-thanks" role="status">Thanks! Your feedback was sent.</p>;
  }

  return (
    <form onSubmit={submit}>
      <label className="form-label" htmlFor="feedback-content">What do you think of the site?</label>
      <textarea
        id="feedback-content"
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

      <label className="form-label" htmlFor="feedback-rating">Rating (optional)</label>
      <select id="feedback-rating" className="form-input" value={rating} onChange={(e) => setRating(e.target.value)} disabled={status === 'sending'}>
        <option value="">No rating</option>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} out of 5</option>
        ))}
      </select>

      {status === 'error' && <p className="feedback-error" role="alert">{errorMessage}</p>}
      <button type="submit" className="feedback-submit" disabled={!content.trim() || status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>
    </form>
  );
}
