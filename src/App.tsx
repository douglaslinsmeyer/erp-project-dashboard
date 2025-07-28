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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <p className="last-update">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      </header>

      <div className="departments-container">
        <div className="departments-cards">
          {departments.map((dept, index) => {
            const lastUpdateTime = new Date(dept.LastUpdate).getTime()
            const currentTime = new Date().getTime()
            const minutesSinceUpdate = (currentTime - lastUpdateTime) / (1000 * 60)
            const isOverdue = minutesSinceUpdate > 30
            
            const formatTimeAgo = (minutes: number) => {
              if (minutes < 1) return 'just now'
              if (minutes < 60) return `${Math.floor(minutes)} mins ago`
              const hours = Math.floor(minutes / 60)
              if (hours === 1) return '1 hour ago'
              return `${hours} hours ago`
            }
            
            return (
              <div key={index} className={`department-card ${
                dept.Status === 'On Track' ? 'card-on-track' : 
                dept.Status === 'At Risk' ? 'card-at-risk' : 
                dept.Status === 'Delayed' ? 'card-delayed' :
                'card-emergency'
              }`}>
                <div className="card-header">
                  <h3 className="department-name">{dept.Name}</h3>
                  <div className="badges">
                    <span className={`status-badge ${
                      dept.Status === 'On Track' ? 'badge-on-track' : 
                      dept.Status === 'At Risk' ? 'badge-at-risk' : 
                      dept.Status === 'Delayed' ? 'badge-delayed' :
                      'badge-emergency'
                    }`}>
                      {dept.Status}
                    </span>
                    {isOverdue && <span className="overdue-badge">Overdue</span>}
                  </div>
                </div>
                <div className="card-content">
                  <p className="card-note">{dept.UpdateNote}</p>
                  <p className="update-time">Updated {formatTimeAgo(minutesSinceUpdate)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App