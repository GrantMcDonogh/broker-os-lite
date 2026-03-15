import {
  LayoutDashboard,
  Users,
  FileText,
  Zap,
  Settings,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  claimsCount: number;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'policies', label: 'Policies', icon: FileText },
  { id: 'claims', label: 'Claims', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeNav,
  onNavChange,
  claimsCount,
  theme,
  onThemeToggle,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {collapsed ? (
            <span className={styles.logoAccent}>B</span>
          ) : (
            <>Broker<span className={styles.logoAccent}>OS</span></>
          )}
        </div>
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.orgName}>McDonogh Insurance Brokers</div>
      )}

      <nav className={styles.nav}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={
              activeNav === id ? styles.navItemActive : styles.navItem
            }
            onClick={() => onNavChange(id)}
            title={collapsed ? label : undefined}
          >
            <Icon className={styles.navIcon} />
            {!collapsed && label}
            {!collapsed && id === 'claims' && claimsCount > 0 && (
              <span className={styles.navBadge}>{claimsCount}</span>
            )}
            {collapsed && id === 'claims' && claimsCount > 0 && (
              <span className={styles.navBadgeCollapsed}>{claimsCount}</span>
            )}
          </button>
        ))}
      </nav>

      <button
        className={styles.themeToggle}
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className={styles.footer}>
        <div className={styles.avatar}>GM</div>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>Grant McDonogh</span>
            <span className={styles.userRole}>Key Individual</span>
          </div>
        )}
      </div>
    </aside>
  );
}
