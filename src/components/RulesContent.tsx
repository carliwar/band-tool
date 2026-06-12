import { RULES_TEMPLATE } from '../data/rulesTemplate';
import styles from '../styles/ContentTable.module.css';

export function RulesContent() {
  return (
    <>
      <p style={{ marginBottom: 'var(--sp-4)' }} className="dim serif">
        Péguenlas en la pared.
      </p>
      {/* Mobile: cards */}
      <div className={styles.cards}>
        {RULES_TEMPLATE.map((r) => (
          <div key={r.regla} className={styles.card}>
            <div className={styles.label}>Regla</div>
            <div className={styles.value} style={{ fontWeight: 700 }}>
              {r.regla}
            </div>
            <div className={styles.label}>Detalle</div>
            <div className={styles.value}>{r.detalle}</div>
          </div>
        ))}
      </div>
    </>
  );
}
