import { useState, useEffect } from 'react'
import './App.css'
import type { DepartmentData } from './types/index.js'

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

      <div className="departments-container">
        <h2 className="grid-header">Department Status</h2>
        <div className="departments-cards">
          {departments.map((dept, index) => {
            const lastUpdateTime = new Date(dept.LastUpdate).getTime()
            const currentTime = new Date().getTime()
            const minutesSinceUpdate = (currentTime - lastUpdateTime) / (1000 * 60)
            const isOverdue = minutesSinceUpdate > 30
            
            return (
              <div key={index} className={`department-card ${
                dept.Status === 'On Track' ? 'card-on-track' : 
                dept.Status === 'At Risk' ? 'card-at-risk' : 
                'card-delayed'
              }`}>
                <div className="card-header">
                  <h3 className="department-name">{dept.Name}</h3>
                  {isOverdue && <span className="overdue-badge">Overdue</span>}
                </div>
                <div className="card-status">
                  <span className={`status-badge ${
                    dept.Status === 'On Track' ? 'badge-on-track' : 
                    dept.Status === 'At Risk' ? 'badge-at-risk' : 
                    'badge-delayed'
                  }`}>
                    {dept.Status}
                  </span>
                </div>
                <p className="card-note">{dept.UpdateNote}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App