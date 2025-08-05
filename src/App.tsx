import { useState, useEffect, useRef } from 'react'
import './App.css'
import type { DepartmentData } from './types'
import { api } from './services/api'
import { signalRService } from './services/signalr'
// import type { StatusUpdateMessage } from './services/signalr'
import { StatusCard } from './components/StatusCard'
import { UpdateModal } from './components/UpdateModal'
import { HistoryView } from './components/HistoryView'
import { AddModal } from './components/AddModal'

const REFRESH_INTERVAL = 30000 // 30 seconds
const DASHBOARD_CYCLE_INTERVAL = 60000 // 1 minute

interface ExtendedDepartmentData extends DepartmentData {
  type: 'department' | 'cell';
  id: string;
}

function App() {
  const [departmentData, setDepartmentData] = useState<ExtendedDepartmentData[]>([])
  const [cellData, setCellData] = useState<ExtendedDepartmentData[]>([])
  const [currentDashboard, setCurrentDashboard] = useState<'department' | 'cell'>('department')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dashboard-theme')
    return (saved as 'dark' | 'light') || 'dark'
  })
  const [cardHeight, setCardHeight] = useState(200)
  const [selectedEntity, setSelectedEntity] = useState<ExtendedDepartmentData | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isRotationPaused, setIsRotationPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const transformData = (data: any[], type: 'department' | 'cell'): ExtendedDepartmentData[] => {
    return data.map(item => ({
      Name: item.name || item.Name,
      Status: item.status || item.Status,
      LastUpdate: item.lastUpdate || item.LastUpdate,
      UpdateNote: item.updateNote || item.UpdateNote,
      type,
      id: item.id || (item.name || item.Name || '').toLowerCase().replace(/[^a-z0-9]/g, '_')
    }))
  }

  const fetchData = async () => {
    try {
      const result = await api.getStatus()
      
      if (result.success && result.sheets) {
        if (result.sheets.DepartmentStatus) {
          setDepartmentData(transformData(result.sheets.DepartmentStatus, 'department'))
        }
        if (result.sheets.CellStatus) {
          setCellData(transformData(result.sheets.CellStatus, 'cell'))
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

  // Handle SignalR updates (commented out for now)
  // const handleStatusUpdate = (update: StatusUpdateMessage) => {
  //   console.log('Received real-time update:', update)
  //   
  //   // Update the appropriate dataset
  //   if (update.entityType === 'department') {
  //     setDepartmentData(prev => prev.map(dept => 
  //       dept.id === update.entityId 
  //         ? { 
  //             ...dept, 
  //             Status: update.status as DepartmentData['Status'], 
  //             UpdateNote: update.updateNote,
  //             LastUpdate: update.timestamp 
  //           }
  //         : dept
  //     ))
  //   } else if (update.entityType === 'cell') {
  //     setCellData(prev => prev.map(cell => 
  //       cell.id === update.entityId 
  //         ? { 
  //             ...cell, 
  //             Status: update.status as DepartmentData['Status'], 
  //             UpdateNote: update.updateNote,
  //             LastUpdate: update.timestamp 
  //           }
  //         : cell
  //     ))
  //   }
  //   
  //   setLastUpdated(new Date(update.timestamp))
  // }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    
    // Connect to SignalR - disabled temporarily
    // signalRService.connect(handleStatusUpdate).catch(console.error)
    
    return () => {
      clearInterval(interval)
      signalRService.disconnect()
    }
  }, [])

  // Dashboard cycling effect
  useEffect(() => {
    if (!isRotationPaused) {
      const cycleInterval = setInterval(() => {
        setCurrentDashboard(prev => prev === 'department' ? 'cell' : 'department')
      }, DASHBOARD_CYCLE_INTERVAL)
      return () => clearInterval(cycleInterval)
    }
  }, [isRotationPaused])

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Calculate optimal card height based on viewport
  const calculateCardHeight = () => {
    if (!containerRef.current) return

    const currentData = currentDashboard === 'department' ? departmentData : cellData
    const itemCount = currentData.length

    // Get container dimensions
    const containerHeight = containerRef.current.offsetHeight
    const containerWidth = containerRef.current.offsetWidth
    
    // Calculate grid columns based on width
    let columns = 5 // default for HD
    if (containerWidth < 768) columns = 2
    else if (containerWidth < 1920) columns = 5
    else if (containerWidth >= 3840) columns = 7
    
    // Calculate rows needed
    const rows = Math.ceil(itemCount / columns)
    
    // Calculate available height per row (subtract gaps and padding)
    const gap = 16 // 1rem gap
    const availableHeight = containerHeight // Use actual container height
    const cardHeightWithGap = (availableHeight - (gap * (rows - 1))) / rows
    
    // Set minimum and maximum heights
    const minHeight = 140
    const maxHeight = 250
    const optimalHeight = Math.max(minHeight, Math.min(maxHeight, cardHeightWithGap - gap))
    
    setCardHeight(Math.floor(optimalHeight))
  }

  // Recalculate on data change, dashboard change, or window resize
  useEffect(() => {
    calculateCardHeight()
    const handleResize = () => calculateCardHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [departmentData, cellData, currentDashboard])

  const handleCardClick = (entity: ExtendedDepartmentData) => {
    setSelectedEntity(entity)
  }

  const handleModalClose = () => {
    setSelectedEntity(null)
    setShowHistory(false)
  }

  const handleUpdate = () => {
    fetchData() // Refresh data after update
  }

  const handleShowHistory = () => {
    setShowHistory(true)
  }

  const handleHistoryClose = () => {
    setShowHistory(false)
  }

  if (loading) {
    return (
      <div className="loading" data-theme={theme}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error" data-theme={theme}>
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
        <div className="header-actions">
          <button
            className="rotation-toggle"
            onClick={() => setIsRotationPaused(!isRotationPaused)}
            title={isRotationPaused ? 'Resume rotation' : 'Pause rotation'}
            aria-label={isRotationPaused ? 'Resume rotation' : 'Pause rotation'}
          >
            {isRotationPaused ? '▶' : '❚❚'}
          </button>
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            + Add {currentDashboard === 'department' ? 'Department' : 'Cell'}
          </button>
          <p className="last-update">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
      </header>

      <div className="departments-container" ref={containerRef}>
        <div className="departments-cards">
          {currentData.map((entity) => (
            <StatusCard
              key={entity.id}
              data={entity}
              onClick={() => handleCardClick(entity)}
              cardHeight={cardHeight}
            />
          ))}
        </div>
      </div>

      {selectedEntity && !showHistory && (
        <UpdateModal
          isOpen={true}
          onClose={handleModalClose}
          entity={selectedEntity}
          onUpdate={handleUpdate}
          onShowHistory={handleShowHistory}
          onDelete={fetchData}
        />
      )}

      {selectedEntity && showHistory && (
        <HistoryView
          isOpen={true}
          onClose={handleHistoryClose}
          entityId={selectedEntity.id}
          entityName={selectedEntity.Name}
        />
      )}

      {showAddModal && (
        <AddModal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          entityType={currentDashboard}
          onAdd={fetchData}
        />
      )}
    </div>
  )
}

export default App