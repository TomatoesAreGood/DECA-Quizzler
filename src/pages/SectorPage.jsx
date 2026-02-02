import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExamList } from '../components/sector/ExamList';
import { fetchSectorExams } from '../utils/fetchExams';
import { SEO } from '../components/shared/SEO';

const SECTOR_INFO = {
  ent: {
    name: 'ENT',
    title: 'Entrepreneurship Practice Exams',
    file: 'ENT',
    fullName: 'Entrepreneurship',
    description: 'Free DECA Entrepreneurship (ENT) practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering business planning, startups, innovation, and entrepreneurial concepts.',
    intro: 'Master DECA Entrepreneurship concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  },
  fin: {
    name: 'FIN',
    title: 'Finance Practice Exams',
    file: 'FIN',
    fullName: 'Finance',
    description: 'Free DECA Finance (FIN) practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering financial planning, investing, banking, and financial services.',
    intro: 'Master DECA Finance concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  },
  mkt: {
    name: 'MKT',
    title: 'Marketing Practice Exams',
    file: 'MKT',
    fullName: 'Marketing',
    description: 'Free DECA Marketing (MKT) practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering marketing strategies, branding, advertising, and consumer behavior.',
    intro: 'Master DECA Marketing concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  },
  ht: {
    name: 'H&T',
    title: 'Hospitality & Tourism Practice Exams',
    file: 'HnT',
    fullName: 'Hospitality & Tourism',
    description: 'Free DECA Hospitality & Tourism (H&T) practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering hotel management, tourism, restaurants, and event planning.',
    intro: 'Master DECA Hospitality & Tourism concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  },
  bma: {
    name: 'BMA',
    title: 'Business Management Practice Exams',
    file: 'BMA',
    fullName: 'Business Management',
    description: 'Free DECA Business Management (BMA) practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering operations, human resources, leadership, and organizational management.',
    intro: 'Master DECA Business Management concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  },
  core: {
    name: 'CORE',
    title: 'Principles & Core Practice Exams',
    file: 'CORE',
    fullName: 'Principles/Core',
    description: 'Free DECA Principles and Core practice exams to help you prepare for regionals, provincials, and ICDC. Study with realistic questions covering fundamental business concepts, economics, and professional development.',
    intro: 'Master DECA Principles and Core concepts with our comprehensive collection of practice exams. Perfect for preparing for competitive events at all levels.'
  }
};

export function SectorPage() {
  const { sector: sectorParam } = useParams();
  const sectorInfo = SECTOR_INFO[sectorParam];
  const [exams, setExams] = useState({ icdc: [], sample: [], other: [], unit: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        let examList;

        // Read directly from sessionStorage to get the current sector's cache
        const cachedValue = window.sessionStorage.getItem(JSON.stringify(sectorInfo.file));
        const cachedExams = cachedValue ? JSON.parse(cachedValue) : null;

        if (cachedExams) {
          examList = cachedExams.split(',');
        } else {
          const data = await fetchSectorExams(sectorInfo.file);
          examList = [...Object.keys(data), `9999-${sectorInfo.file}-UNIT`];
          // Cache the exams for this sector
          window.sessionStorage.setItem(JSON.stringify(sectorInfo.file), JSON.stringify(examList.join(',')));
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
    <>
      <SEO
        title={sectorInfo.title}
        description={sectorInfo.description}
        keywords={`DECA, DECA exams, DECA practice, ICDC, business competition, DECA quizzer, DECA study, DECA test prep, deca ${sectorParam}, ${sectorInfo.name} exams, DECA ${sectorInfo.fullName}, ${sectorInfo.fullName} practice, ICDC ${sectorInfo.name}, ${sectorInfo.fullName.toLowerCase()}`}
        canonical={`/${sectorParam}`}
      />
      <main className="sector-page">
        <header className="sector-page-header">
          <h1>{sectorInfo.title}</h1>
          <p className="sector-intro">{sectorInfo.intro}</p>
        </header>

        <ExamList exams={exams.icdc} category="icdc" title="ICDC Exams" />
        <ExamList exams={exams.sample} category="sample" title="Sample Exams" />
        <ExamList exams={exams.other} category="other" title="Other Exams" />
        <ExamList exams={exams.unit} category="unit" title="Unit Exam" />
      </main>
    </>
  );
}
