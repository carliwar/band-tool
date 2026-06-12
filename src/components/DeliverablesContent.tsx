import { DELIVERABLES_TEMPLATE } from '../data/deliverablesTemplate';
import styles from '../styles/ContentTable.module.css';

export function DeliverablesContent() {
  return (
    <>
      <p style={{ marginBottom: 'var(--sp-4)' }} className="dim serif">
        Al final del día deberían tener todo esto.
      </p>
      <div className={styles.cards}>
        {DELIVERABLES_TEMPLATE.map((d) => (
          <div key={d.entregable} className={styles.card}>
            <div className={styles.label}>Entregable</div>
            <div className={styles.value} style={{ fontWeight: 700 }}>
              {d.entregable}
            </div>
            <div className={styles.label}>Estado esperado</div>
            <div className={styles.value}>{d.estadoEsperado}</div>
          </div>
        ))}
      </div>
    </>
  );
}
