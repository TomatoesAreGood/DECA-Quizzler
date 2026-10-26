import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FEEDBACK_SURVEY, getFeedbackOptionKey, getFeedbackResponsesKey } from '../config/feedback';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NAMESPACE = 'decaquizzler333';
const DAY_OF_WEEK = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
const MAX_WEEK_CAP = 32;

const getDateKey = (date) => `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;

// Each statistic is a daily counter written by utils/analytics.js. Only the selected one is
// fetched (7 requests per week) so the dashboard stays under the API's rate limit.
const METRICS = [
  { value: 'unique', label: 'Unique Visits', description: 'People visiting for the first time', getKey: (date) => `u${getDateKey(date)}` },
  { value: 'visits', label: 'Visits', description: 'People visiting each day, counted once per day', getKey: (date) => `v${getDateKey(date)}` },
  { value: 'activity', label: 'Activity', description: 'Page views', getKey: (date) => getDateKey(date) },
  { value: 'completed', label: 'Completed Quizzes', description: 'Quizzes that reached the results screen, including early exits', getKey: (date) => `c${getDateKey(date)}` },
];

// All-time counter written by trackQuizCompleted in utils/analytics.js
const TOTAL_COMPLETED_KEY = 'completedTotal';

// Feedback survey results (see config/feedback.js): one request per option plus the response count
const FEEDBACK_VIEW = { value: 'feedback', label: 'Feedback Survey', description: FEEDBACK_SURVEY.question };
const FEEDBACK_KEYS = [
  getFeedbackResponsesKey(FEEDBACK_SURVEY),
  ...FEEDBACK_SURVEY.options.map((option) => getFeedbackOptionKey(FEEDBACK_SURVEY, option)),
];
const VIEWS = [...METRICS, FEEDBACK_VIEW];

export function TrafficPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [metric, setMetric] = useState(METRICS[0].value);
  const [chartData, setChartData] = useState([]);
  const [xLabels, setXLabels] = useState([]);
  // Which kind of data chartData holds, so it's never drawn with the wrong view
  const [loadedView, setLoadedView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRanges, setDateRanges] = useState([]);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [error, setError] = useState(null);
  const [totalCompleted, setTotalCompleted] = useState(null);

  // Cache for each statistic's week data to avoid refetching, plus requests still in flight
  const dataCache = useRef(new Map());
  const pendingRequests = useRef(new Map());
  const totalCompletedRequest = useRef(null);
  const lastSuccessful = useRef({ weekOffset: 0, metric: METRICS[0].value });
  const errorTimeoutRef = useRef(null);
  const currentDate = new Date();

  const selectedMetric = VIEWS.find((m) => m.value === metric);
  const isFeedbackView = metric === FEEDBACK_VIEW.value;

  const getDateOffsetWeek = (offset = 0) => {
    const msInDay = 24 * 60 * 60 * 1000;
    return new Date(currentDate.getTime() - (offset * 7 * msInDay));
  };

  const getDateOffsetWeekStart = (offset = 0) => {
    const msInDay = 24 * 60 * 60 * 1000;
    return new Date(currentDate.getTime() - ((offset * 7 - 1) * msInDay));
  };

  const getWeek = (offset = 0) => {
    const week = Array(7);
    for (let i = 0; i < 7; i++) {
      const index = 6 - i;
      const dayOffset = (i + offset * 7) * 24 * 60 * 60 * 1000;
      week[index] = new Date(currentDate.getTime() - dayOffset);
    }
    return week;
  };

  const fetchVisits = async (key) => {
    try {
      const response = await fetch(`https://abacus.jasoncameron.dev/get/${NAMESPACE}/${key}`);

      // Extract rate limit headers from first response
      const remaining = response.headers.get('RateLimit-Remaining');
      const reset = response.headers.get('RateLimit-Reset');
      if (remaining !== null) {
        setRateLimitInfo({
          remaining: parseInt(remaining),
          reset: parseInt(reset)
        });
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter}ms`);
      }

      if (!response.ok) return 0;
      const data = await response.json();
      return data.value || 0;
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      return 0;
    }
  };

  useEffect(() => {
    // Generate date ranges for dropdown
    const ranges = [];
    const oneWeekOffsetDate = new Date(currentDate.getTime() - (6 * 24 * 60 * 60 * 1000));
    ranges.push({
      value: 0,
      label: `${oneWeekOffsetDate.getFullYear()}/${oneWeekOffsetDate.getMonth()+1}/${oneWeekOffsetDate.getDate()} - ${currentDate.getFullYear()}/${currentDate.getMonth()+1}/${currentDate.getDate()}`
    });

    for (let i = 1; i < MAX_WEEK_CAP; i++) {
      const dateStart = getDateOffsetWeekStart(i + 1);
      const dateEnd = getDateOffsetWeek(i);
      ranges.push({
        value: i,
        label: `${dateStart.getFullYear()}/${dateStart.getMonth()+1}/${dateStart.getDate()} - ${dateEnd.getFullYear()}/${dateEnd.getMonth()+1}/${dateEnd.getDate()}`
      });
    }
    setDateRanges(ranges);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // One request for the all-time total, shared if this effect runs twice
    if (!totalCompletedRequest.current) {
      totalCompletedRequest.current = fetchVisits(TOTAL_COMPLETED_KEY);
    }
    totalCompletedRequest.current.then(
      (value) => { if (!cancelled) setTotalCompleted(value); },
      () => { if (!cancelled) setTotalCompleted(undefined); }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isFeedback = metric === FEEDBACK_VIEW.value;
    // Survey results don't depend on the week
    const cacheKey = isFeedback ? FEEDBACK_VIEW.value : `${metric}:${weekOffset}`;
    const view = isFeedback ? 'feedback' : 'chart';

    const loadTrafficData = async () => {
      // Check cache first
      if (dataCache.current.has(cacheKey)) {
        const cached = dataCache.current.get(cacheKey);
        setXLabels(cached.labels);
        setChartData(cached.data);
        setLoadedView(view);
        setLoading(false);
        lastSuccessful.current = { weekOffset, metric };
        return;
      }

      setLoading(true);

      try {
        let labels = [];
        let keys = FEEDBACK_KEYS;
        if (!isFeedback) {
          const week = getWeek(weekOffset);
          const getKey = METRICS.find((m) => m.value === metric).getKey;
          labels = week.map(d => DAY_OF_WEEK[d.getDay()]);
          keys = week.map(getKey);
        }

        // Reuse a request that's already running for this view instead of sending it again
        let request = pendingRequests.current.get(cacheKey);
        if (!request) {
          request = Promise.all(keys.map(fetchVisits));
          pendingRequests.current.set(cacheKey, request);
          request.then(
            (data) => dataCache.current.set(cacheKey, { labels, data }),
            () => {}
          ).finally(() => pendingRequests.current.delete(cacheKey));
        }
        const data = await request;
        if (cancelled) return;

        setXLabels(labels);
        setChartData(data);
        setLoadedView(view);
        lastSuccessful.current = { weekOffset, metric };

        // Clear any previous errors on successful load
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        // Revert to last successful selection on error
        setWeekOffset(lastSuccessful.current.weekOffset);
        setMetric(lastSuccessful.current.metric);

        // Clear error after 5 seconds
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
          errorTimeoutRef.current = null;
        }, 5000);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTrafficData();
    return () => {
      cancelled = true;
    };
  }, [weekOffset, metric]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const prevWeek = () => {
    if (weekOffset >= MAX_WEEK_CAP - 1) return;
    setWeekOffset(weekOffset + 1);
  };

  const nextWeek = () => {
    if (weekOffset <= 0) return;
    setWeekOffset(weekOffset - 1);
  };

  const weekTotal = chartData.reduce((total, value) => total + value, 0);
  const feedbackResponses = loadedView === 'feedback' ? chartData[0] || 0 : 0;

  const createChartData = (data, label) => {
    return {
      labels: xLabels,
      datasets: [
        {
          label: label,
          data: data,
          fill: false,
          tension: 0,
          backgroundColor: '#0066CC',
          borderColor: 'rgba(0, 102, 204, 0.35)',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <main className="traffic-page">
      <h1>Website Traffic</h1>
      <p className="header-subtext">Definitely not using cookies</p>

      {rateLimitInfo && rateLimitInfo.remaining < 10 && (
        <div className="rate-limit-warning">
          Warning: Only {rateLimitInfo.remaining} API requests remaining. Page may slow down temporarily.
        </div>
      )}

      {error && (
        <div className="rate-limit-error">
          {error}
        </div>
      )}

      <div className="traffic-overview">
        <p className="traffic-overview-label">Quizzes completed, all time</p>
        <p className="traffic-overview-value">
          {totalCompleted === null ? '…' : totalCompleted === undefined ? 'Unavailable' : totalCompleted.toLocaleString('en-US')}
        </p>
      </div>

      <div className="traffic-controls">
        <select
          className="date-range-select traffic-metric-select"
          aria-label="Statistic"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          disabled={loading}
        >
          {VIEWS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {!isFeedbackView && (
          <>
            <select
              className="date-range-select"
              aria-label="Week"
              value={weekOffset}
              onChange={(e) => setWeekOffset(parseInt(e.target.value))}
              disabled={loading}
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button
              className="traffic-nav-btn"
              onClick={prevWeek}
              disabled={weekOffset >= MAX_WEEK_CAP - 1 || loading}
            >
              Prev
            </button>
            <button
              className="traffic-nav-btn"
              onClick={nextWeek}
              disabled={weekOffset <= 0 || loading}
            >
              Next
            </button>
          </>
        )}
      </div>

      <section className="traffic-chart-card">
        <div className="traffic-chart-header">
          <div>
            <h2 className="traffic-chart-title">{selectedMetric.label}</h2>
            <p className="traffic-chart-description">{selectedMetric.description}</p>
          </div>
          {!loading && loadedView === 'chart' && (
            <p className="traffic-chart-total">
              <span>{weekTotal.toLocaleString('en-US')}</span> this week
            </p>
          )}
          {!loading && loadedView === 'feedback' && (
            <p className="traffic-chart-total">
              <span>{feedbackResponses.toLocaleString('en-US')}</span> {feedbackResponses === 1 ? 'response' : 'responses'}
            </p>
          )}
        </div>
        {loading && (
          <div className="loading-state chart-container">Loading traffic data...</div>
        )}
        {!loading && loadedView === null && (
          <div className="loading-state chart-container">Couldn't load traffic data. Try again in a minute.</div>
        )}
        {!loading && loadedView === 'chart' && (
          <div className="chart-container">
            <Line
              data={createChartData(chartData, selectedMetric.label)}
              options={chartOptions}
            />
          </div>
        )}
        {!loading && loadedView === 'feedback' && (
          <>
            <ul className="feedback-results">
              {FEEDBACK_SURVEY.options.map((option, i) => {
                const count = chartData[i + 1] || 0;
                const percent = feedbackResponses > 0 ? Math.round((count / feedbackResponses) * 100) : 0;
                return (
                  <li
                    key={option.id}
                    className="feedback-result"
                    title={`${option.label}: ${count.toLocaleString('en-US')} of ${feedbackResponses.toLocaleString('en-US')} responses (${percent}%)`}
                  >
                    <div className="feedback-result-row">
                      <span className="feedback-result-label">{option.label}</span>
                      <span className="feedback-result-count">
                        {count.toLocaleString('en-US')} <span>({percent}%)</span>
                      </span>
                    </div>
                    <div className="feedback-result-track">
                      <div className="feedback-result-bar" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="feedback-results-note">
              People can pick more than one choice, so the percentages can add up to more than 100%.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
