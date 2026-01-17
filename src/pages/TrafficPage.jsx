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

export function TrafficPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [activityData, setActivityData] = useState([]);
  const [visitsData, setVisitsData] = useState([]);
  const [uniqueData, setUniqueData] = useState([]);
  const [xLabels, setXLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRanges, setDateRanges] = useState([]);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [error, setError] = useState(null);

  // Cache for week data to avoid refetching
  const weekCache = useRef(new Map());
  const lastSuccessfulWeek = useRef(0);
  const errorTimeoutRef = useRef(null);
  const currentDate = new Date();

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

  const getActivityKey = (date) => {
    return `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  };

  const getUniqueVisitsKey = (date) => {
    return `u${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
  };

  const getVisitsKey = (date) => {
    return `v${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
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
    const loadTrafficData = async () => {
      // Check cache first
      if (weekCache.current.has(weekOffset)) {
        const cached = weekCache.current.get(weekOffset);
        setXLabels(cached.labels);
        setActivityData(cached.activity);
        setVisitsData(cached.visits);
        setUniqueData(cached.unique);
        setLoading(false);

        // Only update lastSuccessfulWeek and clear error if this is a user-initiated navigation
        // (not a revert from an error)
        if (!error) {
          lastSuccessfulWeek.current = weekOffset;
        }
        return;
      }

      setLoading(true);

      try {
        const week = getWeek(weekOffset);
        const labels = week.map(d => DAY_OF_WEEK[d.getDay()]);

        const activityPromises = week.map(d => fetchVisits(getActivityKey(d)));
        const visitsPromises = week.map(d => fetchVisits(getVisitsKey(d)));
        const uniquePromises = week.map(d => fetchVisits(getUniqueVisitsKey(d)));

        const [activity, visits, unique] = await Promise.all([
          Promise.all(activityPromises),
          Promise.all(visitsPromises),
          Promise.all(uniquePromises)
        ]);

        // Store in cache
        weekCache.current.set(weekOffset, {
          labels,
          activity,
          visits,
          unique
        });

        setXLabels(labels);
        setActivityData(activity);
        setVisitsData(visits);
        setUniqueData(unique);
        lastSuccessfulWeek.current = weekOffset;

        // Clear any previous errors on successful load
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        // Revert to last successful week on error
        setWeekOffset(lastSuccessfulWeek.current);

        // Clear error after 5 seconds
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
          errorTimeoutRef.current = null;
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

    loadTrafficData();
  }, [weekOffset]);

  const prevWeek = () => {
    if (weekOffset >= MAX_WEEK_CAP - 1) return;
    setWeekOffset(weekOffset + 1);
  };

  const nextWeek = () => {
    if (weekOffset <= 0) return;
    setWeekOffset(weekOffset - 1);
  };

  const createChartData = (data, label) => {
    return {
      labels: xLabels,
      datasets: [
        {
          label: label,
          data: data,
          fill: false,
          tension: 0,
          backgroundColor: 'rgba(0,0,255,1.0)',
          borderColor: 'rgba(0,0,255,0.1)',
        },
      ],
    };
  };

  const chartOptions = (data) => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: Math.max(...data, 1) + 1,
        ticks: {
          stepSize: 1,
        },
      },
    },
  });

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

      <div className="traffic-controls">
        <select
          className="date-range-select"
          value={weekOffset}
          onChange={(e) => setWeekOffset(parseInt(e.target.value))}
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
      </div>

      {loading ? (
        <div className="loading-state">Loading traffic data...</div>
      ) : (
        <div className="traffic-charts-card">
          <div className="traffic-chart">
            <h2 className="traffic-chart-title">Unique Visits</h2>
            <div className="chart-container">
              <Line
                data={createChartData(uniqueData, 'Unique Visits')}
                options={chartOptions(uniqueData)}
              />
            </div>
          </div>

          <div className="traffic-chart">
            <h2 className="traffic-chart-title">Visits</h2>
            <div className="chart-container">
              <Line
                data={createChartData(visitsData, 'Visits')}
                options={chartOptions(visitsData)}
              />
            </div>
          </div>

          <div className="traffic-chart">
            <h2 className="traffic-chart-title">Activity</h2>
            <div className="chart-container">
              <Line
                data={createChartData(activityData, 'Activity')}
                options={chartOptions(activityData)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
