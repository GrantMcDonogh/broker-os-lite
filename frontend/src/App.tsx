import { useEffect, useState } from 'react'
import { api } from './lib/api'
import type { Task, User, Claim } from './types/database'
import Sidebar from './components/Sidebar'
import TaskBoard from './components/TaskBoard'
import ChatPanel from './components/ChatPanel'
import ClientsPage from './components/ClientsPage'
import PoliciesPage from './components/PoliciesPage'
import ClaimsPage from './components/ClaimsPage'
import SettingsPage from './components/SettingsPage'
import styles from './App.module.css'

const ORG_ID = 'a0000000-0000-0000-0000-000000000001'
const USER_ID = 'b0000000-0000-0000-0000-000000000001'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [activeNav, setActiveNav] = useState('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('broker-os-theme') as 'dark' | 'light') || 'dark'
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('broker-os-sidebar') === 'collapsed'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('broker-os-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('broker-os-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded')
  }, [sidebarCollapsed])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [tasks, users, claims] = await Promise.all([
      api.getTasks(ORG_ID),
      api.getUsers(ORG_ID),
      api.getClaims(ORG_ID, 'open'),
    ])

    setTasks(tasks as Task[])
    setUsers(users as User[])
    setClaims(claims as Claim[])
  }

  function handleThemeToggle() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  function handleTaskClick(task: Task) {
    console.log('Task clicked:', task.title)
  }

  const showChat = activeNav === 'dashboard'
  const sidebarWidth = sidebarCollapsed ? '64px' : '240px'

  const gridStyle = showChat
    ? { gridTemplateColumns: `${sidebarWidth} 1fr 400px` }
    : { gridTemplateColumns: `${sidebarWidth} 1fr` }

  return (
    <div className={styles.shell} style={gridStyle}>
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        claimsCount={claims.length}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      {activeNav === 'dashboard' && (
        <>
          <main className={styles.main}>
            <TaskBoard
              tasks={tasks}
              users={users}
              onTaskClick={handleTaskClick}
            />
          </main>
          <ChatPanel
            orgId={ORG_ID}
            userId={USER_ID}
          />
        </>
      )}
      {activeNav === 'clients' && (
        <ClientsPage orgId={ORG_ID} />
      )}
      {activeNav === 'policies' && (
        <PoliciesPage orgId={ORG_ID} />
      )}
      {activeNav === 'claims' && (
        <ClaimsPage orgId={ORG_ID} />
      )}
      {activeNav === 'settings' && (
        <SettingsPage orgId={ORG_ID} currentUserId={USER_ID} />
      )}
    </div>
  )
}

export default App
