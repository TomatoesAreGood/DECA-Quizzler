import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExamList } from '../components/sector/ExamList';
import { fetchSectorExams } from '../utils/fetchExams';
import { SEO } from '../components/shared/SEO';

const SECTOR_INFO = {
  ent: {
    name: 'ENT',
    title: 'ENT Exams',
    file: 'ENT',
    fullName: 'Entrepreneurship',
    description: 'Practice DECA Entrepreneurship exams including ICDC and sample exams. Master ENT concepts with our free quiz platform.'
  },
  fin: {
    name: 'FIN',
    title: 'FIN Exams',
    file: 'FIN',
    fullName: 'Finance',
    description: 'Practice DECA Finance exams including ICDC and sample exams. Master FIN concepts with our free quiz platform.'
  },
  mkt: {
    name: 'MKT',
    title: 'MKT Exams',
    file: 'MKT',
    fullName: 'Marketing',
    description: 'Practice DECA Marketing exams including ICDC and sample exams. Master MKT concepts with our free quiz platform.'
  },
  ht: {
    name: 'H&T',
    title: 'H&T Exams',
    file: 'HnT',
    fullName: 'Hospitality & Tourism',
    description: 'Practice DECA Hospitality & Tourism exams including ICDC and sample exams. Master H&T concepts with our free quiz platform.'
  },
  bma: {
    name: 'BMA',
    title: 'BMA Exams',
    file: 'BMA',
    fullName: 'Business Management',
    description: 'Practice DECA Business Management exams including ICDC and sample exams. Master BMA concepts with our free quiz platform.'
  },
  core: {
    name: 'CORE',
    title: 'CORE Exams',
    file: 'CORE',
    fullName: 'Principles/Core',
    description: 'Practice DECA Principles and Core exams including ICDC and sample exams. Master CORE concepts with our free quiz platform.'
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
        title={`${sectorInfo.fullName} (${sectorInfo.name}) Exams`}
        description={sectorInfo.description}
        keywords={`DECA ${sectorInfo.name}, DECA ${sectorInfo.fullName}, ${sectorInfo.name} exams, ${sectorInfo.fullName} practice, ICDC ${sectorInfo.name}, DECA study`}
        canonical={`/${sectorParam}`}
      />
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
    </>
  );
}
