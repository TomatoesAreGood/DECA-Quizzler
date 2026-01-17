import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SearchBar } from './SearchBar';
import { Dropdown } from './Dropdown';
import { SVGIcon } from '../shared/SVGIcon';
import { fetchAllSectors } from '../../utils/fetchExams';
import { useSessionStorage } from '../../hooks/useLocalStorage';

export function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allExams, setAllExams] = useState([]);
  const [sectorExams, setSectorExams] = useState({});

  useEffect(() => {
    const loadExams = async () => {
      try {
        const sectorsData = await fetchAllSectors();
        const examsMap = {};
        const examsList = [];

        sectorsData.forEach(({ sector, exams }) => {
          const examsWithUnit = [...exams, `9999-${sector}-UNIT`];
          examsMap[sector] = examsWithUnit;
          examsList.push(...examsWithUnit);
        });

        setSectorExams(examsMap);
        setAllExams(examsList);
      } catch (error) {
        console.error('Error loading exams:', error);
      }
    };

    loadExams();
  }, []);

  return (
    <nav className="navbar">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ul>
        <div>
          <Link to="/" id="logo">
            <span className="logo-deca">DECA</span>
            <span className="logo-divider"></span>
            <span className="logo-quizzler">Quizzer</span>
          </Link>
          <li>
            <Dropdown sector="ENT" exams={sectorExams['ENT'] || []} route="/ent" />
          </li>
          <li>
            <Dropdown sector="FIN" exams={sectorExams['FIN'] || []} route="/fin" />
          </li>
          <li>
            <Dropdown sector="MKT" exams={sectorExams['MKT'] || []} route="/mkt" />
          </li>
          <li>
            <Dropdown sector="H&T" exams={sectorExams['HnT'] || []} route="/ht" />
          </li>
          <li>
            <Dropdown sector="BMA" exams={sectorExams['BMA'] || []} route="/bma" />
          </li>
          <li>
            <Dropdown sector="CORE" exams={sectorExams['CORE'] || []} route="/core" />
          </li>
          <li>
            <div className="dropdown">
              <Link className="dropbtn" to="/favorites">FAV</Link>
            </div>
          </li>
        </div>
        <div className="navbar-div">
          <SearchBar allExams={allExams} />
          <li className="toggle" onClick={() => setSidebarOpen(true)}>
            <SVGIcon type="menu" />
          </li>
        </div>
      </ul>
    </nav>
  );
}
