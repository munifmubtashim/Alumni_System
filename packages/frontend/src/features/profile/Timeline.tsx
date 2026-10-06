import styles from './Timeline.module.css';

export interface TimelineItem {
  /** Stable React key. */
  id: string;
  /** The bold first line, e.g. a university or "Job title · Company". */
  title: string;
  /** The line under the title; left out when undefined. */
  detail?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Plain text shown under the entries, without a dot (Employment's experience). */
  note?: string;
}

/**
 * A vertical timeline: a list of entries, each with an accent dot and a line
 * joining it to the next entry (the last has none). Text is rendered as text,
 * never as markup. Renders nothing when it has no entries and no note.
 */
export function Timeline({ items, note }: TimelineProps) {
  if (items.length === 0 && note === undefined) return null;
  const lastIndex = items.length - 1;

  return (
    <div className={styles.timeline}>
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.rail} aria-hidden="true">
                <span className={styles.dot} data-part="dot" />
                {index < lastIndex && <span className={styles.line} data-part="line" />}
              </span>
              <div className={styles.content}>
                <p className={styles.title}>{item.title}</p>
                {item.detail !== undefined && <p className={styles.detail}>{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {note !== undefined && <p className={styles.note}>{note}</p>}
    </div>
  );
}
