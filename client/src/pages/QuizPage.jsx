import { QuizContainer } from '../components/quiz/QuizContainer';
import { SEO } from '../components/shared/SEO';

export function QuizPage() {
  return (
    <>
      <SEO
        title="Quiz"
        description="Take a DECA exam quiz. Practice questions with detailed explanations and track your progress."
        keywords="DECA, DECA exams, DECA practice, ICDC, DECA quizzer, DECA study, DECA test prep, DECA quiz, DECA test, DECA practice questions, online quiz, exam practice"
        canonical="/quiz"
      />
      <QuizContainer />
    </>
  );
}
