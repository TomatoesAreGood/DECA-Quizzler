import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExamList } from '../components/sector/ExamList';
import { fetchSectorExams } from '../utils/fetchExams';
import { useSessionStorage } from '../hooks/useLocalStorage';

const SECTOR_INFO = {
  ent: { name: 'ENT', title: 'ENT Exams', file: 'ENT' },
  fin: { name: 'FIN', title: 'FIN Exams', file: 'FIN' },
  mkt: { name: 'MKT', title: 'MKT Exams', file: 'MKT' },
  ht: { name: 'H&T', title: 'H&T Exams', file: 'HnT' },
  bma: { name: 'BMA', title: 'BMA Exams', file: 'BMA' },
  core: { name: 'CORE', title: 'CORE Exams', file: 'CORE' }
};

export function SectorPage() {
  const { sector: sectorParam } = useParams();
  const sectorInfo = SECTOR_INFO[sectorParam];
  const [cachedExams, setCachedExams] = useSessionStorage(sectorInfo.file, null);
  const [exams, setExams] = useState({ icdc: [], sample: [], other: [], unit: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        let examList;

        if (cachedExams) {
          examList = cachedExams.split(',');
        } else {
          const data = await fetchSectorExams(sectorInfo.file);
          examList = [...Object.keys(data), `9999-${sectorInfo.file}-UNIT`];
          setCachedExams(examList.join(','));
        }

        const categorized = { icdc: [], sample: [], other: [], unit: [] };

        examList.forEach((exam) => {
          const words = exam.split('-');
          const ending = words[words.length - 1];

          if (ending === 'ICDC') categorized.icdc.push(exam);
          else if (ending === 'SAMPLE') categorized.sample.push(exam);
          else if (ending === 'UNIT') categorized.unit.push(exam);
          else categorized.other.push(exam);
        });

        setExams(categorized);
        setLoading(false);
      } catch (error) {
        console.error('Error loading exams:', error);
        setLoading(false);
      }
    };

    loadExams();
  }, [sectorParam]);

  if (loading) {
    return <main><h1>Loading...</h1></main>;
  }

  return (
    <main>
      <div className="page-header">
        <h1>{sectorInfo.title}</h1>
        <p className="header-subtext">You can find all the {sectorInfo.name} exams here</p>
      </div>

      <ExamList exams={exams.icdc} category="icdc" title="ICDC Exams" />
      <ExamList exams={exams.sample} category="sample" title="Sample Exams" />
      <ExamList exams={exams.other} category="other" title="Other Exams" />
      <ExamList exams={exams.unit} category="unit" title="Unit Exam" />
    </main>
  );
}
