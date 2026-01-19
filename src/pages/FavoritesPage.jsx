import { useState, useEffect } from 'react';
import { QuizContainer } from '../components/quiz/QuizContainer';
import { useFavorites } from '../hooks/useFavorites';
import { sort } from '../utils/quizHelpers';
import { SEO } from '../components/shared/SEO';

async function getQuestions(sector, questionData) {
  if (questionData.length === 0) {
    return [];
  }

  const response = await fetch(`/data/${sector}.json`);
  const data = await response.json();
  let favQuestions = [];

  for (let i = 0; i < Object.entries(questionData).length; i++) {
    if (Object.entries(questionData)[i][1].length > 0) {
      let examName = questionData[i][0];
      let questionNumbers = questionData[i][1];
      for (var j = 0; j < questionNumbers.length; j++) {
        let question = data[examName][questionNumbers[j] - 1];
        question['exam'] = examName;
        favQuestions = favQuestions.concat(question);
      }
    }
  }
  return favQuestions;
}

export function FavoritesPage() {
  const { favExams } = useFavorites();
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!favExams || Object.entries(favExams).length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      let foundSectors = { ENT: [], FIN: [], MKT: [], HnT: [], CORE: [], BMA: [] };

      for (let i = 0; i < Object.keys(favExams).length; i++) {
        let sector = Object.keys(favExams)[i].substring(5, 8);
        if (sector === 'COR') {
          foundSectors['CORE'].push(Object.entries(favExams)[i]);
        }
        if (sector in foundSectors) {
          foundSectors[sector].push(Object.entries(favExams)[i]);
        }
      }

      const promiseQuestions = [
        getQuestions('ENT', foundSectors['ENT']),
        getQuestions('FIN', foundSectors['FIN']),
        getQuestions('MKT', foundSectors['MKT']),
        getQuestions('HnT', foundSectors['HnT']),
        getQuestions('BMA', foundSectors['BMA']),
        getQuestions('CORE', foundSectors['CORE'])
      ];

      const results = await Promise.all(promiseQuestions);
      const allQuestions = results.flat();
      sort(allQuestions);

      setQuestions(allQuestions);
      setLoading(false);
    };

    loadFavorites();
  }, [favExams]);

  if (loading) {
    return (
      <>
        <SEO
          title="Favorites"
          description="Review your favorited DECA exam questions. Practice and master the questions you've saved across all sectors."
          keywords="DECA, DECA exams, DECA practice, ICDC, DECA quizzer, DECA study, DECA test prep, DECA favorites, saved questions, review questions, bookmarked questions"
          canonical="/favorites"
        />
        <div className="quiz"><h1>Loading...</h1></div>
      </>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <>
        <SEO
          title="Favorites"
          description="Review your favorited DECA exam questions. Practice and master the questions you've saved across all sectors."
          keywords="DECA, DECA exams, DECA practice, ICDC, DECA quizzer, DECA study, DECA test prep, DECA favorites, saved questions, review questions, bookmarked questions"
          canonical="/favorites"
        />
        <div className="quiz"><h1>Favorited questions will show up here</h1></div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Favorites"
        description="Review your favorited DECA exam questions. Practice and master the questions you've saved across all sectors."
        keywords="DECA favorites, saved questions, DECA practice, review questions"
        canonical="/favorites"
      />
      <QuizContainer examName="FAV-EXAM" questions={questions} />
    </>
  );
}
