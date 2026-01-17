import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
import { SVGIcon } from '../shared/SVGIcon';

export function SearchBar({ allExams }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.length) {
      const filtered = allExams.filter((exam) =>
        exam.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const selectExam = (exam) => {
    setInput('');
    setResults([]);
    setOpen(false);
    navigate(`/quiz?exam=${exam}`);
  };

  return (
    <Popover.Root open={open && results.length > 0} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="search-box">
          <div className="search-box-row">
            <input
              type="text"
              id="input"
              placeholder="Search"
              autoComplete="off"
              value={input}
              onChange={handleSearch}
              onFocus={() => input.length && results.length && setOpen(true)}
            />
            <button className="search-icon" type="button">
              <SVGIcon type="search" />
            </button>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="result-box"
          sideOffset={5}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul>
            {results.map((exam) => (
              <li key={exam} onClick={() => selectExam(exam)}>
                {exam.length > 18 ? `${exam.substring(0, 19)}...` : exam}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
