import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import type { User } from '../types/database';
import styles from './SettingsPage.module.css';

interface SettingsPageProps {
  orgId: string;
  currentUserId: string;
}

type SettingsTab =
  | 'profile'
  | 'team'
  | 'organisation'
  | 'insurers'
  | 'compliance'
  | 'notifications'
  | 'integrations'
  | 'billing';

const TABS: { key: SettingsTab; label: string; locked?: boolean }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'team', label: 'Team Members' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'insurers', label: 'Insurers' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'integrations', label: 'Integrations', locked: true },
  { key: 'billing', label: 'Billing', locked: true },
];

const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #a855f7, #7c3aed)', text: '#1a0533' },
  { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', text: '#052e16' },
  { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', text: '#0a0e17' },
  { bg: 'linear-gradient(135deg, #fb923c, #ea580c)', text: '#431407' },
  { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', text: '#083344' },
  { bg: 'linear-gradient(135deg, #f43f5e, #e11d48)', text: '#1a0510' },
];

// Hardcoded compliance data — will come from API when compliance module is built
const MEMBER_COMPLIANCE: Record<string, {
  faisRepNo?: string;
  reStatus?: string;
  reLabel?: string;
  cpdProgress?: string;
  clientsManaged?: number;
  department?: string;
  responsibilities?: string;
  lastActive?: string;
  supervisor?: string;
  supervised?: boolean;
  chips: { label: string; status: 'ok' | 'warn' | 'neutral' }[];
}> = {
  'Grant McDonogh': {
    faisRepNo: 'REP-20198',
    reStatus: 'good',
    reLabel: 'Passed',
    cpdProgress: '18/20 hours',
    clientsManaged: 42,
    chips: [
      { label: 'Fit & Proper', status: 'ok' },
      { label: 'RE1', status: 'ok' },
      { label: 'CPD on track', status: 'ok' },
    ],
  },
  'Sarah Peters': {
    faisRepNo: 'REP-20245',
    reStatus: 'good',
    reLabel: 'Passed',
    cpdProgress: '8/20 hours',
    clientsManaged: 28,
    chips: [
      { label: 'Fit & Proper', status: 'ok' },
      { label: 'RE5', status: 'ok' },
      { label: 'CPD behind', status: 'warn' },
    ],
  },
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.[0] ?? '').toUpperCase();
}

function getRoleClass(role: string): string {
  switch (role.toLowerCase()) {
    case 'owner': return styles.roleOwner;
    case 'key individual': return styles.roleKi;
    case 'representative': return styles.roleRep;
    case 'admin': return styles.roleAdmin;
    default: return styles.roleReadonly;
  }
}

function getChipClass(status: 'ok' | 'warn' | 'neutral'): string {
  switch (status) {
    case 'ok': return styles.complianceOk;
    case 'warn': return styles.complianceWarn;
    default: return styles.complianceNeutral;
  }
}

export default function SettingsPage({ orgId, currentUserId }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [users, setUsers] = useState<User[]>([]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+27 82 456 7890',
  });

  useEffect(() => {
    async function load() {
      const u = await api.getUsers(orgId);
      setUsers(u);
    }
    load();
  }, [orgId]);

  // Set profile form from current user
  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.full_name.split(' ');
      setProfileForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: currentUser.email || '',
        phone: '+27 82 456 7890',
      });
    }
  }, [currentUser]);

  const repCount = useMemo(() => users.filter(u => u.role.toLowerCase() === 'representative').length, [users]);

  return (
    <div className={styles.settingsPage}>
      {/* Top Bar */}
      <div className={styles.topbar}>
        <div className={styles.header}>
          <div className={styles.title}>Settings</div>
          <div className={styles.roleIndicator}>
            <span className={styles.roleIndicatorDot} />
            Viewing as <span className={styles.roleIndicatorLabel}>{currentUser?.role || 'Key Individual'}</span>
          </div>
        </div>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.locked && <span className={styles.tabLock}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'profile' && (
          <ProfileTab
            form={profileForm}
            onChange={setProfileForm}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab users={users} repCount={repCount} />
        )}
        {activeTab === 'organisation' && <ComingSoon icon="🏢" title="Organisation" desc="Brokerage details, FSP registration, and compliance officer settings will appear here." />}
        {activeTab === 'insurers' && <ComingSoon icon="🏦" title="Insurers" desc="Manage insurer relationships, commission rates, and portal connections." />}
        {activeTab === 'compliance' && <ComingSoon icon="📋" title="Compliance" desc="FAIS compliance dashboard, CPD tracking, POPIA consent management, and TCF reporting." />}
        {activeTab === 'notifications' && <ComingSoon icon="🔔" title="Notifications" desc="Configure notification preferences across in-app, email, and WhatsApp channels." />}
        {activeTab === 'integrations' && <ComingSoon icon="🔗" title="Integrations" desc="Connect BrokerOS to WhatsApp Business, email, insurer portals, and accounting systems. Owner access required." />}
        {activeTab === 'billing' && <ComingSoon icon="💳" title="Billing" desc="Manage your subscription, view invoices, and update payment details. Owner access required." />}
      </div>
    </div>
  );
}

/* ── Profile Tab ── */

function ProfileTab({
  form,
  onChange,
  currentUser,
}: {
  form: { firstName: string; lastName: string; email: string; phone: string };
  onChange: (form: { firstName: string; lastName: string; email: string; phone: string }) => void;
  currentUser?: User;
}) {
  return (
    <>
      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>Personal Information</div>
        <div className={styles.formSectionDesc}>Your details as they appear in the system and on compliance documents.</div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-firstName">First Name</label>
            <input
              id="settings-firstName"
              className={styles.formInput}
              value={form.firstName}
              onChange={e => onChange({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-lastName">Last Name</label>
            <input
              id="settings-lastName"
              className={styles.formInput}
              value={form.lastName}
              onChange={e => onChange({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-email">Email Address</label>
            <input
              id="settings-email"
              className={styles.formInput}
              value={form.email}
              onChange={e => onChange({ ...form, email: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-phone">Mobile Number</label>
            <input
              id="settings-phone"
              className={styles.formInput}
              value={form.phone}
              onChange={e => onChange({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-role">Role</label>
            <input
              id="settings-role"
              className={`${styles.formInput} ${styles.formInputReadonly}`}
              value={currentUser?.role || 'Key Individual'}
              readOnly
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="settings-faisNo">FAIS Representative Number</label>
            <input
              id="settings-faisNo"
              className={styles.formInput}
              defaultValue="REP-20198"
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>Security</div>
        <div className={styles.formSectionDesc}>Manage your account security and login settings.</div>
        <div className={styles.formToggleRow}>
          <div className={styles.toggleInfo}>
            <div className={styles.toggleLabel}>Two-Factor Authentication</div>
            <div className={styles.toggleDesc}>Required for Key Individual and Owner roles</div>
          </div>
          <ToggleSwitch defaultOn />
        </div>
        <div className={styles.formToggleRow}>
          <div className={styles.toggleInfo}>
            <div className={styles.toggleLabel}>Login Notifications</div>
            <div className={styles.toggleDesc}>Get notified when someone logs into your account</div>
          </div>
          <ToggleSwitch defaultOn />
        </div>
        <div className={`${styles.formRow} ${styles.formRowFull}`} style={{ marginTop: 16 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Change Password</label>
            <input
              className={styles.formInput}
              type="password"
              placeholder="Enter new password"
            />
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={`${styles.btn} ${styles.btnGhost}`}>Cancel</button>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Save Changes</button>
      </div>
    </>
  );
}

/* ── Team Members Tab ── */

function TeamTab({ users, repCount }: { users: User[]; repCount: number }) {
  return (
    <>
      {/* Stats & Actions */}
      <div className={styles.teamHeader}>
        <div className={styles.teamStats}>
          <div className={styles.statPill}>
            <span className={styles.statNumber}>{users.length}</span>
            <span className={styles.statLabel}>Active Members</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNumber}>1</span>
            <span className={styles.statLabel}>Pending Invite</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNumber}>{repCount}</span>
            <span className={styles.statLabel}>Representatives</span>
          </div>
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>+ Invite Member</button>
      </div>

      {/* Pending Invitations */}
      <div className={styles.inviteSection}>
        <div className={styles.sectionLabel}>Pending Invitations</div>
        <div className={styles.inviteCard}>
          <div className={styles.inviteIcon}>✉️</div>
          <div className={styles.inviteInfo}>
            <div className={styles.inviteEmail}>james.venter@mcdonoghbrokers.co.za</div>
            <div className={styles.inviteMeta}>Invited as Representative · Sent 2 days ago</div>
          </div>
          <div className={styles.inviteActions}>
            <button className={`${styles.btnSm} ${styles.btnSmGhost}`}>Cancel</button>
            <button className={`${styles.btnSm} ${styles.btnSmPrimary}`}>Resend</button>
          </div>
        </div>
      </div>

      {/* Active Team */}
      <div className={styles.sectionLabel}>Active Team</div>
      <div className={styles.membersGrid}>
        {users.map((user, idx) => (
          <MemberCard key={user.id} user={user} colorIndex={idx} />
        ))}
      </div>
    </>
  );
}

function MemberCard({ user, colorIndex }: { user: User; colorIndex: number }) {
  const colors = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const compliance = MEMBER_COMPLIANCE[user.full_name];
  const isNonFais = user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'readonly';

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberTop}>
        <div
          className={styles.memberAvatar}
          style={{ background: colors.bg, color: colors.text }}
        >
          {getInitials(user.full_name)}
        </div>
        <div className={styles.memberInfo}>
          <div className={styles.memberName}>{user.full_name}</div>
          <div className={styles.memberEmail}>{user.email || `${user.full_name.toLowerCase().replace(/\s/g, '.')}@mcdonoghbrokers.co.za`}</div>
          <span className={`${styles.memberRoleTag} ${getRoleClass(user.role)}`}>
            {user.role}
          </span>
          {compliance?.supervised && (
            <span className={styles.supervisedTag}>Supervised</span>
          )}
        </div>
        <button className={styles.memberMenu}>⋮</button>
      </div>

      <div className={styles.memberDetails}>
        {compliance ? (
          <>
            <div>
              <div className={styles.detailLabel}>FAIS Rep No.</div>
              <div className={styles.detailValue}>{compliance.faisRepNo || 'N/A'}</div>
            </div>
            <div>
              <div className={styles.detailLabel}>{user.role.toLowerCase() === 'key individual' ? 'RE1 Status' : 'RE5 Status'}</div>
              <div className={`${styles.detailValue} ${compliance.reStatus === 'good' ? styles.detailValueGood : compliance.reStatus === 'warn' ? styles.detailValueWarn : ''}`}>
                {compliance.reLabel || 'N/A'}
              </div>
            </div>
            <div>
              <div className={styles.detailLabel}>CPD Progress</div>
              <div className={`${styles.detailValue} ${
                compliance.cpdProgress?.startsWith('8') ? styles.detailValueWarn : styles.detailValueGood
              }`}>
                {compliance.cpdProgress || 'N/A'}
              </div>
            </div>
            <div>
              <div className={styles.detailLabel}>{compliance.supervisor ? 'Supervisor' : 'Clients Managed'}</div>
              <div className={styles.detailValue}>{compliance.supervisor || compliance.clientsManaged || 'N/A'}</div>
            </div>
          </>
        ) : isNonFais ? (
          <>
            <div>
              <div className={styles.detailLabel}>FAIS Status</div>
              <div className={`${styles.detailValue} ${styles.detailValueMuted}`}>Non-FAIS Staff</div>
            </div>
            <div>
              <div className={styles.detailLabel}>Department</div>
              <div className={styles.detailValue}>Back Office</div>
            </div>
            <div>
              <div className={styles.detailLabel}>Responsibilities</div>
              <div className={styles.detailValue}>Commission, Data</div>
            </div>
            <div>
              <div className={styles.detailLabel}>Last Active</div>
              <div className={styles.detailValue}>Today</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className={styles.detailLabel}>FAIS Rep No.</div>
              <div className={styles.detailValue}>—</div>
            </div>
            <div>
              <div className={styles.detailLabel}>RE5 Status</div>
              <div className={styles.detailValue}>—</div>
            </div>
            <div>
              <div className={styles.detailLabel}>CPD Progress</div>
              <div className={styles.detailValue}>—</div>
            </div>
            <div>
              <div className={styles.detailLabel}>Clients Managed</div>
              <div className={styles.detailValue}>—</div>
            </div>
          </>
        )}
      </div>

      <div className={styles.memberCompliance}>
        {compliance?.chips.map((chip, i) => (
          <span key={i} className={`${styles.complianceChip} ${getChipClass(chip.status)}`}>
            <span className={styles.complianceDot} />
            {chip.label}
          </span>
        ))}
        {!compliance && isNonFais && (
          <span className={`${styles.complianceChip} ${styles.complianceNeutral}`}>
            <span className={styles.complianceDot} />
            No FAIS requirements
          </span>
        )}
        {!compliance && !isNonFais && (
          <span className={`${styles.complianceChip} ${styles.complianceNeutral}`}>
            <span className={styles.complianceDot} />
            Compliance data pending
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Toggle Switch ── */

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={() => setOn(!on)}
      type="button"
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

/* ── Coming Soon ── */

function ComingSoon({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.comingSoonIcon}>{icon}</div>
      <div className={styles.comingSoonTitle}>{title}</div>
      <div className={styles.comingSoonDesc}>{desc}</div>
    </div>
  );
}
