import { useState, useEffect } from 'react'
import './App.css'
import { DepartmentData } from './types/index'

const API_URL = 'https://script.google.com/macros/s/AKfycbz3ots_V5MzRBmVZ5jaHBE9Y9WpSWVQqWyqR-Cdc5rmEhl-FquJfz5nG8Tr_EvWz8Aepw/exec'
const REFRESH_INTERVAL = 30000 // 30 seconds

function App() {
  const [departments, setDepartments] = useState<DepartmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL)
      const result = await response.json()
      setDepartments(result.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <div className="error-message">
          <h2 className="error-title">Error Loading Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const statusCounts = departments.reduce((acc, dept) => {
    acc[dept.Status] = (acc[dept.Status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalDepartments = departments.length
  const onTrackPercentage = Math.round((statusCounts['On Track'] || 0) / totalDepartments * 100)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">ERP Project Dashboard</h1>
        <p className="last-update">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Departments</p>
          <p className="stat-value">{totalDepartments}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">On Track</p>
          <p className="stat-value status-on-track">{statusCounts['On Track'] || 0}</p>
          <p className="stat-percentage">{onTrackPercentage}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">At Risk</p>
          <p className="stat-value status-at-risk">{statusCounts['At Risk'] || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Delayed</p>
          <p className="stat-value status-delayed">{statusCounts['Delayed'] || 0}</p>
        </div>
      </div>

      <div className="departments-grid">
        <h2 className="grid-header">Department Status</h2>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Update Note</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, index) => (
              <tr key={index}>
                <td>{dept.Name}</td>
                <td>
                  <span className={`status-badge ${
                    dept.Status === 'On Track' ? 'badge-on-track' : 
                    dept.Status === 'At Risk' ? 'badge-at-risk' : 
                    'badge-delayed'
                  }`}>
                    {dept.Status}
                  </span>
                </td>
                <td>{new Date(dept.LastUpdate).toLocaleDateString()}</td>
                <td className="update-note">{dept.UpdateNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App