import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Plus, MessageCircle, Mail, Phone } from 'lucide-react';
import { api } from '../lib/api';
import type { Client, Policy, Insurer, Claim } from '../types/database';
import styles from './ClientsPage.module.css';

interface ClientsPageProps {
  orgId: string;
}

interface ClientWithDetails extends Client {
  policy_count: number;
  total_premium: number;
  policies: (Policy & { insurer_name: string })[];
  open_claims: number;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #f43f5e, #e11d48)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #f97316, #ea580c)',
  'linear-gradient(135deg, #64748b, #475569)',
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'policies', label: 'Policies' },
  { key: 'claims', label: 'Claims' },
  { key: 'activity', label: 'Activity' },
  { key: 'documents', label: 'Documents' },
] as const;

const PLACEHOLDER_ACTIVITY = [
  { title: 'Policy POL-2024-001 renewed', time: '2 days ago' },
  { title: 'Claim CLM-0042 submitted', time: '5 days ago' },
  { title: 'Contact details updated', time: '1 week ago' },
  { title: 'New motor policy added', time: '2 weeks ago' },
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0]?.[0] ?? '').toUpperCase();
}

function formatPremium(amount: number): string {
  if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `R ${(amount / 1000).toFixed(0)}K`;
  return `R ${amount}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isRenewalUrgent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const renewal = new Date(dateStr);
  const now = new Date();
  const diffMs = renewal.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
}

function getPolicyTagClass(type: string): string {
  switch (type) {
    case 'motor': return styles.policyTagMotor;
    case 'commercial': return styles.policyTagCommercial;
    case 'homeowners': return styles.policyTagHomeowners;
    case 'liability': return styles.policyTagLiability;
    case 'body_corporate': return styles.policyTagBodyCorporate;
    case 'claim': return styles.policyTagClaim;
    default: return '';
  }
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ');
}

export default function ClientsPage({ orgId }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function load() {
      const [c, p, i, cl] = await Promise.all([
        api.getClients(orgId),
        api.getPolicies(orgId),
        api.getInsurers ? api.getInsurers() : ([] as Insurer[]),
        api.getClaims(orgId),
      ]);
      setClients(c);
      setPolicies(p);
      setInsurers(i);
      setClaims(cl);
      if (c.length > 0 && !selectedClientId) {
        setSelectedClientId(c[0].id);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const insurerMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ins of insurers) {
      map[ins.id] = ins.name;
    }
    return map;
  }, [insurers]);

  const clientsWithDetails: ClientWithDetails[] = useMemo(() => {
    return clients.map((client) => {
      const clientPolicies = policies.filter((p) => p.client_id === client.id);
      const clientClaims = claims.filter((cl) => cl.client_id === client.id);
      const openClaims = clientClaims.filter(
        (cl) => cl.status !== 'closed' && cl.status !== 'rejected'
      ).length;
      const totalPremium = clientPolicies.reduce(
        (sum, p) => sum + (Number(p.premium) || 0),
        0
      );
      const policiesWithInsurer = clientPolicies.map((p) => ({
        ...p,
        insurer_name: p.insurer_id ? (insurerMap[p.insurer_id] ?? 'Unknown') : 'Unknown',
      }));

      // Use server-provided counts if available, otherwise compute client-side
      const serverClient = client as any;
      return {
        ...client,
        policy_count: serverClient.policy_count ?? clientPolicies.length,
        total_premium: Number(serverClient.total_premium) || totalPremium,
        policies: policiesWithInsurer,
        open_claims: openClaims,
      };
    });
  }, [clients, policies, claims, insurerMap]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clientsWithDetails;
    const q = searchQuery.toLowerCase();
    return clientsWithDetails.filter((c) => c.name.toLowerCase().includes(q));
  }, [clientsWithDetails, searchQuery]);

  const selectedClient = useMemo(() => {
    return clientsWithDetails.find((c) => c.id === selectedClientId) ?? null;
  }, [clientsWithDetails, selectedClientId]);

  return (
    <div className={styles.splitView}>
      {/* Left Panel: Client List */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.listHeaderRow}>
            <span className={styles.listTitle}>Clients</span>
            <span className={styles.listCount}>{clients.length}</span>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.clientList}>
          {filteredClients.map((client, idx) => {
            const originalIndex = clientsWithDetails.indexOf(client);
            const colorIdx = originalIndex >= 0 ? originalIndex : idx;
            return (
              <div
                key={client.id}
                className={`${styles.clientItem} ${
                  client.id === selectedClientId ? styles.clientItemSelected : ''
                }`}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setActiveTab('overview');
                }}
              >
                <div
                  className={styles.clientAvatar}
                  style={{ background: AVATAR_COLORS[colorIdx % AVATAR_COLORS.length] }}
                >
                  {getInitials(client.name)}
                </div>
                <div className={styles.clientInfo}>
                  <div className={styles.clientName}>{client.name}</div>
                  <div className={styles.clientSubtitle}>
                    {formatType(client.type)} &middot; {client.policy_count} polic{client.policy_count === 1 ? 'y' : 'ies'}
                  </div>
                </div>
                {client.total_premium > 0 && (
                  <span className={styles.clientPremium}>
                    {formatPremium(client.total_premium)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Detail */}
      <div className={styles.detailPanel}>
        {selectedClient ? (
          <>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div
                className={styles.detailAvatar}
                style={{
                  background:
                    AVATAR_COLORS[
                      clientsWithDetails.indexOf(selectedClient) % AVATAR_COLORS.length
                    ],
                }}
              >
                {getInitials(selectedClient.name)}
              </div>
              <div className={styles.detailHeaderInfo}>
                <h1 className={styles.detailName}>{selectedClient.name}</h1>
                <div className={styles.detailMeta}>
                  <span className={styles.typeBadge}>{formatType(selectedClient.type)}</span>
                  {selectedClient.contact_email || selectedClient.contact_phone ? (
                    <span className={styles.contactInfo}>
                      {selectedClient.contact_email && (
                        <>
                          <Mail size={13} />
                          {selectedClient.contact_email}
                        </>
                      )}
                      {selectedClient.contact_email && selectedClient.contact_phone && (
                        <span className={styles.contactDot}>&middot;</span>
                      )}
                      {selectedClient.contact_phone && (
                        <>
                          <Phone size={13} />
                          {selectedClient.contact_phone}
                        </>
                      )}
                    </span>
                  ) : (
                    <span className={styles.contactInfo}>No contact info</span>
                  )}
                </div>
              </div>
              <div className={styles.detailActions}>
                <button className={styles.btn}>
                  <Edit size={14} />
                  Edit
                </button>
                <button className={styles.btn}>
                  <Plus size={14} />
                  New Task
                </button>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                  <MessageCircle size={14} />
                  Chat
                </button>
              </div>
            </div>

            {/* Tab Bar */}
            <div className={styles.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'overview' && (
                <>
                  {/* Stats */}
                  <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Active Policies</div>
                      <div className={styles.statValue}>{selectedClient.policy_count}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Annual Premium</div>
                      <div className={styles.statValue}>
                        {formatPremium(selectedClient.total_premium)}
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Open Claims</div>
                      <div className={styles.statValue}>{selectedClient.open_claims}</div>
                    </div>
                  </div>

                  {/* Policies */}
                  <h3 className={styles.sectionTitle}>Policies</h3>
                  {selectedClient.policies.length > 0 ? (
                    <div className={styles.policyGrid}>
                      {selectedClient.policies.map((policy) => {
                        const urgent = isRenewalUrgent(policy.renewal_date);
                        return (
                          <div key={policy.id} className={styles.policyCard}>
                            <div className={styles.policyHeader}>
                              <span className={styles.policyNumber}>
                                {policy.policy_number ?? 'No number'}
                              </span>
                              <span
                                className={`${styles.policyTag} ${getPolicyTagClass(policy.insurance_type)}`}
                              >
                                {formatType(policy.insurance_type)}
                              </span>
                            </div>
                            <div className={styles.policyDetail}>
                              <span className={styles.policyDetailLabel}>Insurer: </span>
                              {policy.insurer_name}
                            </div>
                            <div className={styles.policyRow}>
                              <span className={styles.policyPremium}>
                                {policy.premium != null
                                  ? formatPremium(policy.premium)
                                  : 'N/A'}
                              </span>
                              <span
                                className={`${styles.policyRenewal} ${
                                  urgent ? styles.renewalUrgent : ''
                                }`}
                              >
                                {urgent && <span className={styles.renewalDot} />}
                                Renewal: {formatDate(policy.renewal_date)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptySection}>No policies found</div>
                  )}

                  {/* Recent Activity */}
                  <h3 className={styles.sectionTitle}>Recent Activity</h3>
                  <div className={styles.activityList}>
                    {PLACEHOLDER_ACTIVITY.map((item, i) => (
                      <div key={i} className={styles.activityItem}>
                        <div className={styles.activityTitle}>{item.title}</div>
                        <div className={styles.activityTime}>{item.time}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'policies' && (
                <>
                  {selectedClient.policies.length > 0 ? (
                    <div className={styles.policyGrid}>
                      {selectedClient.policies.map((policy) => {
                        const urgent = isRenewalUrgent(policy.renewal_date);
                        return (
                          <div key={policy.id} className={styles.policyCard}>
                            <div className={styles.policyHeader}>
                              <span className={styles.policyNumber}>
                                {policy.policy_number ?? 'No number'}
                              </span>
                              <span
                                className={`${styles.policyTag} ${getPolicyTagClass(policy.insurance_type)}`}
                              >
                                {formatType(policy.insurance_type)}
                              </span>
                            </div>
                            <div className={styles.policyDetail}>
                              <span className={styles.policyDetailLabel}>Insurer: </span>
                              {policy.insurer_name}
                            </div>
                            <div className={styles.policyRow}>
                              <span className={styles.policyPremium}>
                                {policy.premium != null
                                  ? formatPremium(policy.premium)
                                  : 'N/A'}
                              </span>
                              <span
                                className={`${styles.policyRenewal} ${
                                  urgent ? styles.renewalUrgent : ''
                                }`}
                              >
                                {urgent && <span className={styles.renewalDot} />}
                                Renewal: {formatDate(policy.renewal_date)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptySection}>No policies found</div>
                  )}
                </>
              )}

              {activeTab === 'claims' && (
                <div className={styles.placeholderTab}>Claims view coming soon</div>
              )}

              {activeTab === 'activity' && (
                <div className={styles.activityList}>
                  {PLACEHOLDER_ACTIVITY.map((item, i) => (
                    <div key={i} className={styles.activityItem}>
                      <div className={styles.activityTitle}>{item.title}</div>
                      <div className={styles.activityTime}>{item.time}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className={styles.placeholderTab}>Documents view coming soon</div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Select a client to view details</div>
        )}
      </div>
    </div>
  );
}
