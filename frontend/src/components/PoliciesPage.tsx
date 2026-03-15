import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, RefreshCw, MessageCircle, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Policy, Client } from '../types/database';
import styles from './PoliciesPage.module.css';

interface PoliciesPageProps {
  orgId: string;
}

interface PolicyWithDetails extends Policy {
  insurer_name: string;
  insurer_code: string | null;
  client_name: string;
}

const TYPE_COLORS: Record<string, string> = {
  commercial: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  motor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  liability: 'linear-gradient(135deg, #10b981, #059669)',
  homeowners: 'linear-gradient(135deg, #f59e0b, #d97706)',
  body_corporate: 'linear-gradient(135deg, #f97316, #ea580c)',
  claim: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  marine: 'linear-gradient(135deg, #06b6d4, #0891b2)',
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'claims', label: 'Claims' },
  { key: 'documents', label: 'Documents' },
  { key: 'activity', label: 'Activity' },
] as const;

const PLACEHOLDER_ACTIVITY = [
  { title: 'Renewal quote requested', time: '2 days ago', by: 'Grant McDonogh' },
  { title: 'Premium adjustment processed', time: '1 week ago', by: 'System' },
  { title: 'Annual review completed', time: '2 weeks ago', by: 'Sarah Peters' },
  { title: 'Policy document updated', time: '1 month ago', by: 'AI' },
];

interface CoverageItem {
  label: string;
  limit: string;
  included: boolean;
}

interface CoverageSection {
  title: string;
  items: CoverageItem[];
}

interface ExcessItem {
  label: string;
  amount: string;
}

function getCoverageData(type: string, coverAmount: number | null, excess: number | null): {
  sections: CoverageSection[];
  excesses: ExcessItem[];
  exclusions: string[];
  conditions: string[];
} {
  const cover = coverAmount ?? 0;
  const exc = excess ?? 0;

  switch (type) {
    case 'motor':
      return {
        sections: [
          {
            title: 'Comprehensive Cover',
            items: [
              { label: 'Accidental damage', limit: formatPremium(cover), included: true },
              { label: 'Theft & hijacking', limit: formatPremium(cover), included: true },
              { label: 'Fire damage', limit: formatPremium(cover), included: true },
              { label: 'Hail damage', limit: formatPremium(cover * 0.5), included: true },
              { label: 'Windscreen replacement', limit: 'R 8,000', included: true },
              { label: 'Towing & storage', limit: 'R 5,000', included: true },
            ],
          },
          {
            title: 'Third Party Liability',
            items: [
              { label: 'Bodily injury', limit: 'R 5,000,000', included: true },
              { label: 'Property damage', limit: 'R 2,500,000', included: true },
              { label: 'Passenger liability', limit: 'R 5,000,000', included: true },
            ],
          },
          {
            title: 'Optional Extras',
            items: [
              { label: 'Car hire (max 30 days)', limit: 'R 15,000', included: true },
              { label: 'Roadside assistance', limit: 'Included', included: true },
              { label: 'Credit shortfall', limit: 'Not covered', included: false },
            ],
          },
        ],
        excesses: [
          { label: 'Standard excess', amount: formatPremium(exc) },
          { label: 'Young driver (under 25)', amount: formatPremium(exc * 2) },
          { label: 'Theft/hijacking', amount: formatPremium(exc * 1.5) },
          { label: 'Windscreen', amount: 'R 0 (waived)' },
        ],
        exclusions: [
          'Unlicensed or disqualified drivers',
          'Driving under the influence of alcohol or drugs',
          'Mechanical or electrical breakdown',
          'Wear and tear, gradual deterioration',
          'Use for racing, speed testing, or rallies',
          'Consequential loss or depreciation',
        ],
        conditions: [
          'Vehicle must be kept in roadworthy condition',
          'All drivers must hold a valid licence for the vehicle class',
          'Insurer must be notified within 48 hours of any incident',
          'Tracking device must remain active at all times',
        ],
      };

    case 'homeowners':
      return {
        sections: [
          {
            title: 'Buildings Cover',
            items: [
              { label: 'Structure & fixed improvements', limit: formatPremium(cover * 0.7), included: true },
              { label: 'Boundary walls & gates', limit: formatPremium(cover * 0.1), included: true },
              { label: 'Swimming pool & borehole', limit: formatPremium(cover * 0.05), included: true },
              { label: 'Solar panels & geyser', limit: 'R 150,000', included: true },
            ],
          },
          {
            title: 'Contents Cover',
            items: [
              { label: 'Household contents', limit: formatPremium(cover * 0.3), included: true },
              { label: 'Valuables (specified)', limit: formatPremium(cover * 0.1), included: true },
              { label: 'Garden & outdoor items', limit: 'R 50,000', included: true },
              { label: 'Theft from outbuildings', limit: 'R 25,000', included: true },
            ],
          },
          {
            title: 'Additional Benefits',
            items: [
              { label: 'Temporary accommodation', limit: 'R 75,000', included: true },
              { label: 'Liability to domestic workers', limit: 'R 500,000', included: true },
              { label: 'Power surge protection', limit: 'R 50,000', included: true },
              { label: 'Flood damage', limit: 'Not covered', included: false },
            ],
          },
        ],
        excesses: [
          { label: 'Standard excess', amount: formatPremium(exc) },
          { label: 'Theft (forced entry)', amount: formatPremium(exc * 1.5) },
          { label: 'Geyser burst', amount: formatPremium(exc) },
          { label: 'Power surge', amount: formatPremium(exc * 0.5) },
        ],
        exclusions: [
          'Gradual deterioration, rust, or damp',
          'Subsidence, landslip, or ground heave (unless specified)',
          'Illegal structures or non-compliant installations',
          'Loss while property is unoccupied for 60+ days',
          'Intentional damage by insured or household members',
        ],
        conditions: [
          'Alarm system must be activated when property is unoccupied',
          'All external doors must have deadlocks',
          'Property must be occupied at least 270 days per year',
          'Any structural changes must be reported to the insurer',
        ],
      };

    case 'commercial':
      return {
        sections: [
          {
            title: 'Property Cover',
            items: [
              { label: 'Buildings & fixed structures', limit: formatPremium(cover * 0.6), included: true },
              { label: 'Business contents & equipment', limit: formatPremium(cover * 0.25), included: true },
              { label: 'Stock & inventory', limit: formatPremium(cover * 0.15), included: true },
              { label: 'Glass & signage', limit: 'R 100,000', included: true },
            ],
          },
          {
            title: 'Business Interruption',
            items: [
              { label: 'Loss of gross profit', limit: formatPremium(cover * 0.3), included: true },
              { label: 'Indemnity period', limit: '12 months', included: true },
              { label: 'Additional increased costs', limit: formatPremium(cover * 0.1), included: true },
              { label: 'Rent receivable', limit: formatPremium(cover * 0.05), included: true },
            ],
          },
          {
            title: 'Liability',
            items: [
              { label: 'Public liability', limit: 'R 10,000,000', included: true },
              { label: 'Products liability', limit: 'R 5,000,000', included: true },
              { label: 'Employers liability', limit: 'R 10,000,000', included: true },
              { label: 'Professional indemnity', limit: 'Not covered', included: false },
            ],
          },
        ],
        excesses: [
          { label: 'Property damage', amount: formatPremium(exc) },
          { label: 'Theft (forced entry)', amount: formatPremium(exc * 2) },
          { label: 'Business interruption', amount: '72 hours' },
          { label: 'Liability claims', amount: formatPremium(exc * 0.5) },
        ],
        exclusions: [
          'Wear and tear, gradual deterioration',
          'Loss due to government action or expropriation',
          'Cyber attacks or data breaches (unless endorsed)',
          'Pollution or contamination liability',
          'Penalties, fines, or punitive damages',
          'War, terrorism, or nuclear risks',
        ],
        conditions: [
          'Premises must comply with all fire regulations',
          'Security measures as per risk survey must be maintained',
          'Annual stock declaration required within 90 days of renewal',
          'All material changes to operations must be disclosed',
        ],
      };

    case 'liability':
      return {
        sections: [
          {
            title: 'General Liability',
            items: [
              { label: 'Public liability', limit: formatPremium(cover), included: true },
              { label: 'Products liability', limit: formatPremium(cover * 0.5), included: true },
              { label: 'Completed operations', limit: formatPremium(cover * 0.5), included: true },
            ],
          },
          {
            title: 'Extended Cover',
            items: [
              { label: 'Wrongful arrest', limit: 'R 500,000', included: true },
              { label: 'Defamation', limit: 'R 500,000', included: true },
              { label: 'Tenants liability', limit: 'R 2,000,000', included: true },
              { label: 'Legal defence costs', limit: 'Included', included: true },
            ],
          },
        ],
        excesses: [
          { label: 'Standard excess', amount: formatPremium(exc) },
          { label: 'Products liability', amount: formatPremium(exc * 2) },
        ],
        exclusions: [
          'Professional advice or services',
          'Pollution or contamination',
          'Contractual liability (unless insured would be liable without contract)',
          'Fines, penalties, or exemplary damages',
          'Aircraft, watercraft, or motor vehicle liability',
        ],
        conditions: [
          'Insurer must be notified of any claim or circumstance immediately',
          'No admission of liability without insurer consent',
          'Insured must cooperate fully in defence of claims',
        ],
      };

    case 'body_corporate':
      return {
        sections: [
          {
            title: 'Common Property',
            items: [
              { label: 'Buildings (replacement value)', limit: formatPremium(cover * 0.8), included: true },
              { label: 'Common area contents', limit: formatPremium(cover * 0.05), included: true },
              { label: 'Lifts & escalators', limit: formatPremium(cover * 0.1), included: true },
              { label: 'Parking structures', limit: formatPremium(cover * 0.05), included: true },
            ],
          },
          {
            title: 'Fidelity & Liability',
            items: [
              { label: 'Fidelity guarantee', limit: 'R 1,000,000', included: true },
              { label: 'Trustees liability', limit: 'R 5,000,000', included: true },
              { label: 'Public liability', limit: 'R 10,000,000', included: true },
              { label: 'Employers liability', limit: 'R 5,000,000', included: true },
            ],
          },
        ],
        excesses: [
          { label: 'Standard excess', amount: formatPremium(exc) },
          { label: 'Geyser burst', amount: formatPremium(exc) },
          { label: 'Water damage', amount: formatPremium(exc * 1.5) },
        ],
        exclusions: [
          'Individual unit contents (owner responsibility)',
          'Maintenance and wear and tear',
          'Subsidence unless specifically endorsed',
          'Loss while building is under construction',
        ],
        conditions: [
          'Annual building valuation must be conducted',
          'Fire safety equipment must be maintained per regulation',
          'Levy collections must remain current',
        ],
      };

    default:
      return {
        sections: [
          {
            title: 'Coverage',
            items: [
              { label: 'Total sum insured', limit: formatPremium(cover), included: true },
            ],
          },
        ],
        excesses: [
          { label: 'Standard excess', amount: formatPremium(exc) },
        ],
        exclusions: ['Refer to policy wording for full exclusions'],
        conditions: ['Refer to policy wording for full conditions'],
      };
  }
}

function formatPremium(amount: number | null): string {
  if (amount == null) return 'N/A';
  if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `R ${Math.round(amount).toLocaleString()}`;
  return `R ${amount}`;
}

function formatPremiumShort(amount: number | null): string {
  if (amount == null) return 'N/A';
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
  const diffDays = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ');
}

function getPolicyTagClass(type: string): string {
  switch (type) {
    case 'motor': return styles.tagMotor;
    case 'commercial': return styles.tagCommercial;
    case 'homeowners': return styles.tagHomeowners;
    case 'liability': return styles.tagLiability;
    case 'body_corporate': return styles.tagBodyCorporate;
    case 'marine': return styles.tagMarine;
    default: return '';
  }
}

function getTypeIndicatorClass(type: string): string {
  switch (type) {
    case 'motor': return styles.indicatorMotor;
    case 'commercial': return styles.indicatorCommercial;
    case 'homeowners': return styles.indicatorHomeowners;
    case 'liability': return styles.indicatorLiability;
    case 'body_corporate': return styles.indicatorBodyCorporate;
    case 'marine': return styles.indicatorMarine;
    default: return '';
  }
}

export default function PoliciesPage({ orgId }: PoliciesPageProps) {
  const [policies, setPolicies] = useState<PolicyWithDetails[]>([]);
  const [, setClients] = useState<Client[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([
        api.getPolicies(orgId),
        api.getClients(orgId),
      ]);
      const clientMap: Record<string, string> = {};
      for (const client of c) {
        clientMap[client.id] = client.name;
      }
      const policiesData = (p as PolicyWithDetails[]).map((pol) => ({
        ...pol,
        client_name: pol.client_name || clientMap[pol.client_id] || 'Unknown',
      }));
      setPolicies(policiesData);
      setClients(c);
      if (policiesData.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(policiesData[0].id);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const filteredPolicies = useMemo(() => {
    if (!searchQuery.trim()) return policies;
    const q = searchQuery.toLowerCase();
    return policies.filter(
      (p) =>
        (p.policy_number?.toLowerCase().includes(q)) ||
        (p.client_name?.toLowerCase().includes(q)) ||
        (p.insurer_name?.toLowerCase().includes(q)) ||
        p.insurance_type.toLowerCase().includes(q)
    );
  }, [policies, searchQuery]);

  const selectedPolicy = useMemo(() => {
    return policies.find((p) => p.id === selectedPolicyId) ?? null;
  }, [policies, selectedPolicyId]);



  return (
    <div className={styles.splitView}>
      {/* Left Panel: Policy List */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.listHeaderRow}>
            <span className={styles.listTitle}>Policies</span>
            <span className={styles.listCount}>{policies.length}</span>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.policyList}>
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className={`${styles.policyItem} ${
                policy.id === selectedPolicyId ? styles.policyItemSelected : ''
              }`}
              onClick={() => {
                setSelectedPolicyId(policy.id);
                setActiveTab('overview');
              }}
            >
              <div className={`${styles.typeIndicator} ${getTypeIndicatorClass(policy.insurance_type)}`} />
              <div className={styles.policyInfo}>
                <div className={styles.policyItemNumber}>
                  {policy.policy_number ?? 'No number'}
                </div>
                <div className={styles.policyItemSub}>
                  {policy.client_name ?? 'Unknown client'}
                </div>
              </div>
              {policy.premium != null && (
                <span className={styles.policyItemPremium}>
                  {formatPremiumShort(policy.premium)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Detail */}
      <div className={styles.detailPanel}>
        {selectedPolicy ? (
          <>
            {/* Header */}
            <div className={styles.detailHeader}>
              <div
                className={styles.detailIcon}
                style={{ background: TYPE_COLORS[selectedPolicy.insurance_type] || TYPE_COLORS.commercial }}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className={styles.detailHeaderInfo}>
                <h1 className={styles.detailNumber}>
                  {selectedPolicy.policy_number ?? 'No number'}
                </h1>
                <div className={styles.detailMeta}>
                  <span className={`${styles.typeBadge} ${getPolicyTagClass(selectedPolicy.insurance_type)}`}>
                    {formatType(selectedPolicy.insurance_type)}
                  </span>
                  <span className={styles.detailInsurer}>
                    {selectedPolicy.insurer_name ?? 'Unknown insurer'}
                  </span>
                </div>
              </div>
              <div className={styles.detailActions}>
                <button className={styles.btn}>
                  <Edit size={14} />
                  Edit
                </button>
                <button className={styles.btn}>
                  <RefreshCw size={14} />
                  Renew
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
                      <div className={styles.statLabel}>Annual Premium</div>
                      <div className={styles.statValue}>
                        {formatPremium(selectedPolicy.premium)}
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Sum Insured</div>
                      <div className={styles.statValue}>
                        {formatPremium(selectedPolicy.cover_amount)}
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Excess</div>
                      <div className={styles.statValue}>
                        {formatPremium(selectedPolicy.excess)}
                      </div>
                    </div>
                  </div>

                  {/* Policy Details */}
                  <h3 className={styles.sectionTitle}>Policy Details</h3>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Policy Number</span>
                      <span className={styles.detailValue}>
                        {selectedPolicy.policy_number ?? 'N/A'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Client</span>
                      <span className={styles.detailValue}>
                        {selectedPolicy.client_name ?? 'Unknown'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Insurer</span>
                      <span className={styles.detailValue}>
                        {selectedPolicy.insurer_name ?? 'Unknown'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                        {formatType(selectedPolicy.insurance_type)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                        {selectedPolicy.status}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Renewal Date</span>
                      <span
                        className={`${styles.detailValue} ${
                          isRenewalUrgent(selectedPolicy.renewal_date) ? styles.urgent : ''
                        }`}
                      >
                        {formatDate(selectedPolicy.renewal_date)}
                      </span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <h3 className={styles.sectionTitle}>Recent Activity</h3>
                  <div className={styles.activityList}>
                    {PLACEHOLDER_ACTIVITY.map((item, i) => (
                      <div key={i} className={styles.activityItem}>
                        <div className={styles.activityTitle}>{item.title}</div>
                        <div className={styles.activityTime}>
                          {item.time} <span>&middot;</span> {item.by}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'coverage' && (() => {
                const coverage = getCoverageData(
                  selectedPolicy.insurance_type,
                  selectedPolicy.cover_amount,
                  selectedPolicy.excess
                );
                return (
                  <>
                    {/* Coverage Summary */}
                    <div className={styles.coverageSummary}>
                      <Shield size={20} className={styles.coverageSummaryIcon} />
                      <div>
                        <div className={styles.coverageSummaryTitle}>
                          {formatType(selectedPolicy.insurance_type)} Coverage
                        </div>
                        <div className={styles.coverageSummaryText}>
                          Total sum insured: {formatPremium(selectedPolicy.cover_amount)} | Underwritten by {selectedPolicy.insurer_name ?? 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Coverage Sections */}
                    {coverage.sections.map((section, si) => (
                      <div key={si} className={styles.coverageSection}>
                        <h3 className={styles.sectionTitle}>{section.title}</h3>
                        <div className={styles.coverageTable}>
                          {section.items.map((item, ii) => (
                            <div key={ii} className={styles.coverageRow}>
                              <div className={styles.coverageRowLeft}>
                                {item.included ? (
                                  <CheckCircle size={14} className={styles.coverageIncluded} />
                                ) : (
                                  <XCircle size={14} className={styles.coverageExcluded} />
                                )}
                                <span className={item.included ? styles.coverageItemLabel : styles.coverageItemLabelExcluded}>
                                  {item.label}
                                </span>
                              </div>
                              <span className={item.included ? styles.coverageLimit : styles.coverageLimitExcluded}>
                                {item.limit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Excess Breakdown */}
                    <div className={styles.coverageSection}>
                      <h3 className={styles.sectionTitle}>Excess Schedule</h3>
                      <div className={styles.coverageTable}>
                        {coverage.excesses.map((item, i) => (
                          <div key={i} className={styles.coverageRow}>
                            <span className={styles.coverageItemLabel}>{item.label}</span>
                            <span className={styles.coverageExcessAmount}>{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exclusions */}
                    <div className={styles.coverageSection}>
                      <h3 className={styles.sectionTitle}>Key Exclusions</h3>
                      <div className={styles.exclusionList}>
                        {coverage.exclusions.map((item, i) => (
                          <div key={i} className={styles.exclusionItem}>
                            <AlertTriangle size={13} className={styles.exclusionIcon} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Conditions */}
                    <div className={styles.coverageSection}>
                      <h3 className={styles.sectionTitle}>Special Conditions</h3>
                      <div className={styles.conditionList}>
                        {coverage.conditions.map((item, i) => (
                          <div key={i} className={styles.conditionItem}>
                            <span className={styles.conditionNumber}>{i + 1}</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {activeTab === 'claims' && (
                <div className={styles.placeholderTab}>Claims view coming soon</div>
              )}

              {activeTab === 'documents' && (
                <div className={styles.placeholderTab}>Documents view coming soon</div>
              )}

              {activeTab === 'activity' && (
                <div className={styles.activityList}>
                  {PLACEHOLDER_ACTIVITY.map((item, i) => (
                    <div key={i} className={styles.activityItem}>
                      <div className={styles.activityTitle}>{item.title}</div>
                      <div className={styles.activityTime}>
                        {item.time} <span>&middot;</span> {item.by}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Select a policy to view details</div>
        )}
      </div>
    </div>
  );
}
