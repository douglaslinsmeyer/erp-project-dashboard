import { useState, useEffect } from 'react'
import './App.css'
import type { DepartmentData } from './types/index.js'

const API_URL = 'https://script.google.com/macros/s/AKfycbyoz8GvtO2FeXugPBY4PP7atw3IdBUJpeMSBzpTfuQlSm767JjFmP9lHhPcgzefIu1wnQ/exec'
const REFRESH_INTERVAL = 30000 // 30 seconds
const DASHBOARD_CYCLE_INTERVAL = 60000 // 1 minute

function App() {
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([])
  const [cellData, setCellData] = useState<DepartmentData[]>([])
  const [currentDashboard, setCurrentDashboard] = useState<'department' | 'cell'>('department')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dashboard-theme')
    return (saved as 'dark' | 'light') || 'dark'
  })

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL)
      const result = await response.json()
      
      // Handle new data structure with sheets object
      if (result.success && result.sheets) {
        if (result.sheets.DepartmentStatus) {
          setDepartmentData(result.sheets.DepartmentStatus)
        }
        if (result.sheets.CellStatus) {
          setCellData(result.sheets.CellStatus)
        }
      }
      
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

  // Dashboard cycling effect
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setCurrentDashboard(prev => prev === 'department' ? 'cell' : 'department')
    }, DASHBOARD_CYCLE_INTERVAL)
    return () => clearInterval(cycleInterval)
  }, [])

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

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

  const currentData = currentDashboard === 'department' ? departmentData : cellData
  const dashboardTitle = currentDashboard === 'department' ? 'Department Status' : 'Cell Status'

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <label className="theme-toggle" aria-label="Toggle theme">
          <input 
            type="checkbox" 
            checked={theme === 'light'} 
            onChange={toggleTheme}
            className="theme-toggle-input"
          />
          <span className="theme-toggle-slider"></span>
        </label>
        <h1 className="dashboard-title">{dashboardTitle}</h1>
        <p className="last-update">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      </header>

      <div className="departments-container">
        <div className="departments-cards">
          {currentData.map((dept, index) => {
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