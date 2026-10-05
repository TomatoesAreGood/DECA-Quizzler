import { useState } from 'react';
import { Link } from 'react-router-dom';

// Copied word for word from public/data so the preview matches the real exams
const SAMPLE_QUESTIONS = [
  {
    exam: '1041-BMA',
    number: 30,
    question: 'The manager left 15 minutes early, and Jake decided on his own to do some extra cleaning work. Jake was',
    choices: ['acting irresponsibly.', 'imitating the boss.', 'following the rules.', 'showing initiative.'],
    answer: 'D',
    explanation: 'Showing initiative. Initiative is the willingness to act without having to be told to do so. Jake was not acting irresponsibly but fulfilling his responsibilities to his employer to work a full day. He also was not imitating the boss, who left early, or following the rules, since he acted on his own.'
  },
  {
    exam: '1027-CORE',
    number: 16,
    question: 'Which type of communication is being used when a salesperson sends a message to the store manager?',
    choices: ['Downward', 'Upward', 'Lateral', 'Diagonal'],
    answer: 'B',
    explanation: 'Upward. Upward communication starts with employees and goes to an upper organizational level. Downward communication starts with the upper level and goes down to the employees. Lateral communication is communication that occurs between employees on the same organizational level. Diagonal is not a type of communication.'
  },
  {
    exam: '1045-MKT',
    number: 9,
    question: 'A personal opinion that prevents a person from being a fair and impartial listener is',
    choices: ['bias.', 'feedback.', 'emotion.', 'conviction.'],
    answer: 'A',
    explanation: "Bias. Bias is prejudice or partiality that influences a person's perceptions. It is a major block to effective listening because it affects the way the listener hears what the speaker is trying to say. Feedback is the response received from another person. Emotion is feeling, and conviction is a firm belief in something."
  },
  {
    exam: '1028-FIN',
    number: 14,
    question: 'Customer relationship management increases sales and profits by increasing',
    choices: ['prices.', 'customer loyalty.', 'product quality.', 'competition.'],
    answer: 'B',
    explanation: "Customer loyalty. Customer relationship management increases sales and profits by increasing customer loyalty. Over the long term, focusing on customers and establishing relationships with them increases a business's sales and profit. CRM does not increase prices, product quality, or competition."
  },
  {
    exam: '1023-HnT',
    number: 26,
    question: 'In general, people judge your integrity on the basis of your',
    choices: ['behavior.', 'appearance.', 'education.', 'occupation.'],
    answer: 'A',
    explanation: 'Behavior. Integrity is adhering to an established set of personal ethics. Ethics are the basic principles that govern your behavior. People with integrity follow their ethical or moral principles in order to do what is right. Integrity cannot be evaluated on the basis of appearance, education, or occupation.'
  },
  {
    exam: '1111-ENT-SAMPLE',
    number: 19,
    question: 'Adaptable people commit to their goals and never give up because they have',
    choices: ['positivity.', 'attentiveness.', 'persistence.', 'a sense of humor.'],
    answer: 'C',
    explanation: "Persistence. Adaptable people never give up. They commit to their goals, and they're willing to achieve them in any way possible. Attentiveness, positivity, and a sense of humor are all characteristics of adaptable people, but they aren't demonstrated in this example."
  }
];

const LETTERS = ['A', 'B', 'C', 'D'];

export function SampleQuestion() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  const sample = SAMPLE_QUESTIONS[index];
  const answered = selected !== null;
  const gotItRight = selected === sample.answer;
  const firstSentenceEnd = sample.explanation.indexOf('.') + 1;

  const nextSample = () => {
    setIndex((index + 1) % SAMPLE_QUESTIONS.length);
    setSelected(null);
  };

  return (
    <section className="sample-question" aria-labelledby="sample-question-title">
      <div className="sample-question-top">
        <h2 id="sample-question-title" className="sample-question-label">Try a question</h2>
        <span className="sample-question-source">{sample.exam} · Q{sample.number}</span>
      </div>

      <p className="sample-question-text">{sample.question}</p>

      <div className="sample-choices">
        {sample.choices.map((choice, i) => {
          const letter = LETTERS[i];
          let state = '';
          if (answered && letter === sample.answer) state = 'is-correct';
          else if (answered && letter === selected) state = 'is-incorrect';

          return (
            <button
              key={letter}
              type="button"
              className={`sample-choice ${state}`}
              onClick={() => setSelected(letter)}
              disabled={answered}
            >
              <span className="sample-choice-letter">{letter}</span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      <div className="sample-result" aria-live="polite">
        {answered && (
          <>
            <p className={`sample-verdict ${gotItRight ? 'is-correct' : 'is-incorrect'}`}>
              {gotItRight ? 'Correct.' : `Not quite. The answer is ${sample.answer}.`}
            </p>
            <p className="sample-explanation">
              <strong>{sample.explanation.slice(0, firstSentenceEnd)}</strong>
              {sample.explanation.slice(firstSentenceEnd)}
            </p>
            <div className="sample-actions">
              <button type="button" className="sample-next" onClick={nextSample}>
                Another question
              </button>
              <Link to={`/quiz?exam=${sample.exam}`} className="sample-full-exam">
                Take the full {sample.exam} exam <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
