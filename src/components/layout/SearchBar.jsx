import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
import { SVGIcon } from '../shared/SVGIcon';

export function SearchBar({ allExams }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

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
    <Popover.Root open={open && input.length > 0}>
      <Popover.Trigger asChild>
        <div className="search-box">
          <div className="search-box-row" onClick={() => inputRef.current?.focus()}>
            <input
              ref={inputRef}
              type="text"
              id="input"
              placeholder="Search"
              autoComplete="off"
              value={input}
              onChange={handleSearch}
              onFocus={() => {
                if (input.length) {
                  setOpen(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setOpen(false), 50);
              }}
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
            {results.length > 0 ? (
              results.map((exam) => (
                <li key={exam} onMouseDown={() => selectExam(exam)}>
                  {exam.length > 18 ? `${exam.substring(0, 19)}...` : exam}
                </li>
              ))
            ) : (
              <li className="no-results">No results</li>
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
