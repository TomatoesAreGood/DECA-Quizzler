export async function fetchSectorExams(sector) {
  const response = await fetch(`/data/${sector}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sector} exams`);
  }
  const data = await response.json();
  return data;
}

export async function fetchAllSectors() {
  const sectors = ['ENT', 'FIN', 'MKT', 'HnT', 'BMA', 'CORE'];
  const promises = sectors.map(sector =>
    fetchSectorExams(sector).then(data => ({ sector, exams: Object.keys(data) }))
  );
  return Promise.all(promises);
}
