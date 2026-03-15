import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Phone, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import type { Claim, Client, Policy } from '../types/database';
import styles from './ClaimsPage.module.css';

interface ClaimsPageProps {
  orgId: string;
}

interface ClaimWithDetails extends Claim {
  client_name: string;
  policy_number: string | null;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'settled' | 'submitted';
type DetailTab = 'details' | 'documents' | 'timeline' | 'notes';

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'settled', label: 'Settled' },
];

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'notes', label: 'Notes' },
];

const CHECKLIST_ITEMS = [
  { label: 'FNOL submitted', done: true },
  { label: 'Initial documentation received', done: true },
  { label: 'Assessment scheduled', done: false },
  { label: 'Supporting documents uploaded', done: false },
  { label: 'Settlement approved', done: false },
];

function formatAmount(amount: number | null): string {
  if (amount == null) return 'N/A';
  return `R ${Number(amount).toLocaleString('en-ZA')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return '#f59e0b';
    case 'submitted': return '#3b82f6';
    case 'in_progress': return '#6366f1';
    case 'settled': return '#10b981';
    case 'rejected': return '#ef4444';
    default: return '#64748b';
  }
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDescriptionSnippet(description: string | null, maxLen = 30): string {
  if (!description) return 'No description';
  if (description.length <= maxLen) return description;
  return description.slice(0, maxLen) + '...';
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

export default function ClaimsPage({ orgId }: ClaimsPageProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  useEffect(() => {
    async function load() {
      const [cl, c, p] = await Promise.all([
        api.getClaims(orgId),
        api.getClients(orgId),
        api.getPolicies(orgId),
      ]);
      setClaims(cl);
      setClients(c);
      setPolicies(p);
      if (cl.length > 0 && !selectedClaimId) {
        setSelectedClaimId(cl[0].id);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of clients) {
      map[c.id] = c.name;
    }
    return map;
  }, [clients]);

  const policyMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const p of policies) {
      map[p.id] = p.policy_number;
    }
    return map;
  }, [policies]);

  const claimsWithDetails: ClaimWithDetails[] = useMemo(() => {
    return claims.map((claim) => ({
      ...claim,
      client_name: clientMap[claim.client_id] ?? 'Unknown Client',
      policy_number: claim.policy_id ? (policyMap[claim.policy_id] ?? null) : null,
    }));
  }, [claims, clientMap, policyMap]);

  const filteredClaims = useMemo(() => {
    let result = claimsWithDetails;

    // Filter by status tab
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.claim_number ?? '').toLowerCase().includes(q) ||
          c.client_name.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [claimsWithDetails, activeFilter, searchQuery]);

  const selectedClaim = useMemo(() => {
    return claimsWithDetails.find((c) => c.id === selectedClaimId) ?? null;
  }, [claimsWithDetails, selectedClaimId]);

  const completedCount = CHECKLIST_ITEMS.filter((i) => i.done).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = (completedCount / totalCount) * 100;

  function renderTimeline(claim: ClaimWithDetails) {
    const baseDate = claim.created_at;
    const items = [
      {
        date: formatDate(baseDate),
        title: 'Claim submitted via BrokerOS',
        by: 'Grant McDonogh',
      },
      {
        date: formatDate(addDays(baseDate, 1).toISOString()),
        title: 'FNOL sent to insurer',
        by: 'AI',
      },
      {
        date: formatDate(addDays(baseDate, 2).toISOString()),
        title: 'Initial review completed',
        by: 'System',
      },
    ];

    return (
      <div className={styles.timeline}>
        {items.map((item, i) => (
          <div key={i} className={styles.timelineItem}>
            <div className={styles.timelineDate}>{item.date}</div>
            <div className={styles.timelineTitle}>{item.title}</div>
            <div className={styles.timelineMeta}>
              by <span className={styles.timelineMetaHighlight}>{item.by}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.splitView}>
      {/* Left Panel: Claims List */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.listHeaderRow}>
            <span className={styles.listTitle}>Claims</span>
            <span className={styles.listCount}>{claims.length}</span>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterTabs}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${activeFilter === tab.key ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.claimsList}>
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className={`${styles.claimItem} ${claim.id === selectedClaimId ? styles.claimItemSelected : ''}`}
              onClick={() => {
                setSelectedClaimId(claim.id);
                setActiveTab('details');
              }}
            >
              <div
                className={styles.statusDot}
                style={{ background: getStatusColor(claim.status) }}
              />
              <div className={styles.claimItemInfo}>
                <div className={styles.claimItemNumber}>
                  {claim.claim_number ?? 'No number'}
                </div>
                <div className={styles.claimItemClient}>{claim.client_name}</div>
                <div className={styles.claimItemSub}>
                  {getDescriptionSnippet(claim.description)} &middot; {formatAmount(claim.amount)}
                </div>
              </div>
              <div className={styles.claimItemDate}>
                {formatDateShort(claim.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Detail */}
      <div className={styles.detailPanel}>
        {selectedClaim ? (
          <>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderTop}>
                <div>
                  <div className={styles.detailClaimNumber}>
                    {selectedClaim.claim_number ?? 'No number'}
                  </div>
                  <div className={styles.detailBadges}>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: `${getStatusColor(selectedClaim.status)}1f`,
                        color: getStatusColor(selectedClaim.status),
                      }}
                    >
                      {getStatusLabel(selectedClaim.status)}
                    </span>
                    {selectedClaim.amount != null && selectedClaim.amount > 100000 && (
                      <span className={`${styles.statusBadge} ${styles.highValueBadge}`}>
                        <AlertTriangle size={11} style={{ marginRight: 4 }} />
                        High Value
                      </span>
                    )}
                  </div>
                  <div className={styles.detailClientName}>
                    {selectedClaim.client_name}
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.btn}>
                    <FileText size={14} />
                    Update Status
                  </button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`}>
                    <Phone size={14} />
                    Contact Client
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Bar */}
            <div className={styles.tabBar}>
              {DETAIL_TABS.map((tab) => (
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
              {activeTab === 'details' && (
                <>
                  {/* Claim Information */}
                  <div className={styles.sectionTitle}>Claim Information</div>
                  <div className={styles.infoCard}>
                    <div className={styles.infoGrid}>
                      <div>
                        <div className={styles.infoLabel}>Type</div>
                        <div className={styles.infoValue}>Insurance Claim</div>
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Date Filed</div>
                        <div className={styles.infoValue}>
                          {formatDate(selectedClaim.created_at)}
                        </div>
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Amount Claimed</div>
                        <div className={styles.infoValueLarge}>
                          {formatAmount(selectedClaim.amount)}
                        </div>
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Policy</div>
                        {selectedClaim.policy_number ? (
                          <div className={styles.infoValue}>
                            {selectedClaim.policy_number}
                          </div>
                        ) : (
                          <div className={styles.infoValueMuted}>Not linked</div>
                        )}
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Status</div>
                        <div>
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: `${getStatusColor(selectedClaim.status)}1f`,
                              color: getStatusColor(selectedClaim.status),
                            }}
                          >
                            {getStatusLabel(selectedClaim.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className={styles.infoLabel}>Assigned To</div>
                        <div className={styles.infoValue}>
                          <span className={styles.assignedAvatar}>
                            <span className={styles.miniAvatar}>GM</span>
                            Grant McDonogh
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={styles.sectionTitle}>Description</div>
                  <div className={styles.infoCard}>
                    <div className={styles.descriptionText}>
                      {selectedClaim.description || 'No description provided'}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className={styles.checklistHeader}>
                    <span className={styles.sectionTitle}>Checklist</span>
                    <span className={styles.checklistProgressText}>
                      {completedCount} of {totalCount} complete
                    </span>
                  </div>
                  <div className={styles.infoCard}>
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <div key={i} className={styles.checklistItem}>
                        <div
                          className={`${styles.checkIcon} ${item.done ? styles.checkDone : styles.checkPending}`}
                        >
                          {item.done ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Circle size={12} />
                          )}
                        </div>
                        <span
                          className={item.done ? styles.checklistLabel : styles.checklistLabelMuted}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className={styles.sectionTitle} style={{ marginTop: 8 }}>
                    Timeline
                  </div>
                  {renderTimeline(selectedClaim)}
                </>
              )}

              {activeTab === 'documents' && (
                <div className={styles.placeholderTab}>Documents view coming soon</div>
              )}

              {activeTab === 'timeline' && renderTimeline(selectedClaim)}

              {activeTab === 'notes' && (
                <div className={styles.placeholderTab}>Notes view coming soon</div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Select a claim to view details</div>
        )}
      </div>
    </div>
  );
}
