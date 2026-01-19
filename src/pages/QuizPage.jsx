import { QuizContainer } from '../components/quiz/QuizContainer';
import { SEO } from '../components/shared/SEO';

export function QuizPage() {
  return (
    <>
      <SEO
        title="Quiz"
        description="Take a DECA exam quiz. Practice questions with detailed explanations and track your progress."
        keywords="DECA quiz, DECA test, DECA practice questions, online quiz"
        canonical="/quiz"
      />
      <QuizContainer />
    </>
  );
}
