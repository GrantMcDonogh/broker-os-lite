import { useMemo } from 'react';
import type { Task, User, TaskStatus, InsuranceType } from '../types/database';
import styles from './TaskBoard.module.css';

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
}

interface Column {
  key: TaskStatus;
  title: string;
  dotColor: string;
}

const COLUMNS: Column[] = [
  { key: 'todo', title: 'To Do', dotColor: '#64748b' },
  { key: 'in_progress', title: 'In Progress', dotColor: '#2563eb' },
  { key: 'review', title: 'Review', dotColor: '#f59e0b' },
  { key: 'done', title: 'Done', dotColor: '#10b981' },
];

function formatDueDate(dueDateStr: string): { text: string; overdue: boolean } {
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due < now) {
    return { text: 'Overdue', overdue: true };
  }

  const day = due.getDate();
  const month = due.toLocaleString('en-AU', { month: 'short' });
  return { text: `Due ${day} ${month}`, overdue: false };
}

function getTagClass(tagType: InsuranceType): string {
  switch (tagType) {
    case 'motor':
      return styles.tagMotor;
    case 'homeowners':
      return styles.tagHome;
    case 'commercial':
    case 'body_corporate':
      return styles.tagCommercial;
    case 'claim':
      return styles.tagClaim;
    default:
      return '';
  }
}

export default function TaskBoard({ tasks, users, onTaskClick }: TaskBoardProps) {
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const task of tasks) {
      groups[task.status].push(task);
    }
    // Sort each column by sort_order
    for (const key of Object.keys(groups) as TaskStatus[]) {
      groups[key].sort((a, b) => a.sort_order - b.sort_order);
    }
    return groups;
  }, [tasks]);

  return (
    <div>
      <div className={styles.mainHeader}>
        <h1 className={styles.mainTitle}>Task Board</h1>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`}>List view</button>
          <button className={`${styles.btn} ${styles.btnGhost}`}>Filter</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>+ New task</button>
        </div>
      </div>

      <div className={styles.board}>
        {COLUMNS.map((column) => {
          const columnTasks = groupedTasks[column.key];
          return (
            <div className={styles.column} key={column.key}>
              <div className={styles.columnHeader}>
                <span
                  className={styles.columnDot}
                  style={{ backgroundColor: column.dotColor }}
                />
                <span className={styles.columnTitle}>{column.title}</span>
                <span className={styles.columnCount}>{columnTasks.length}</span>
              </div>

              <div className={styles.cards}>
                {columnTasks.map((task) => {
                  const assignedUser = task.assigned_to
                    ? userMap.get(task.assigned_to)
                    : undefined;

                  const cardClasses = [
                    styles.card,
                    task.is_ai_active ? styles.cardAiActive : '',
                    task.needs_review ? styles.cardReviewNeeded : '',
                    task.status === 'done' ? styles.cardDone : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      className={cardClasses}
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onTaskClick(task);
                        }
                      }}
                    >
                      <div className={styles.cardTitle}>{task.title}</div>

                      <div className={styles.cardMeta}>
                        {assignedUser && (
                          <span>{assignedUser.full_name}</span>
                        )}
                        {assignedUser && task.due_date && (
                          <span className={styles.cardMetaDot}>·</span>
                        )}
                        {task.due_date && (() => {
                          const { text, overdue } = formatDueDate(task.due_date);
                          return (
                            <span style={overdue ? { color: 'var(--error)' } : undefined}>
                              {text}
                            </span>
                          );
                        })()}
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.cardTags}>
                          {task.tag_type && (
                            <span
                              className={`${styles.tag} ${getTagClass(task.tag_type)}`}
                            >
                              {task.tag_label || task.tag_type}
                            </span>
                          )}
                          {task.needs_review && task.review_label && (
                            <span className={styles.reviewBadge}>
                              {task.review_label}
                            </span>
                          )}
                        </div>

                        {task.is_ai_active ? (
                          <div className={styles.aiAvatar}>
                            <div className={styles.aiStatus}>
                              <span className={styles.aiDot} />
                              {task.ai_status || 'AI working'}
                            </div>
                          </div>
                        ) : assignedUser ? (
                          <div className={styles.cardAvatar} title={assignedUser.full_name}>
                            {assignedUser.initials}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
