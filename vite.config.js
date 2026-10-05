import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Exam and question counts for the home page, read from the question data at build time
function getExamStats() {
  const stats = {}
  for (const sector of ['ENT', 'FIN', 'MKT', 'HnT', 'BMA', 'CORE']) {
    const file = new URL(`./public/data/${sector}.json`, import.meta.url)
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    const exams = Object.keys(data)
    stats[sector] = {
      exams: exams.length,
      icdc: exams.filter((exam) => exam.endsWith('-ICDC')).length,
      questions: exams.reduce((total, exam) => total + data[exam].length, 0),
    }
  }
  return stats
}

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  define: {
    __EXAM_STATS__: JSON.stringify(getExamStats()),
  },
})
