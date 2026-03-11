import styles from './LoadingOverlay.module.css';

export default function LoadingOverlay({ visible, progress }) {
  if (!visible) return null;

  const phase = progress?.phase || 'detecting';
  const current = progress?.current || 0;
  const total = progress?.total || 0;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />

        {phase === 'detecting' ? (
          <>
            <p className={styles.text}>Reading your face...</p>
            <p className={styles.subtext}>Analyzing your selfie with AI</p>
          </>
        ) : (
          <>
            <p className={styles.text}>
              {current} / {total} scanned
            </p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className={styles.subtext}>Matching your face across all photos</p>
          </>
        )}
      </div>
    </div>
  );
}
