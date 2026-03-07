import { useState, useRef, useCallback } from 'react';
import styles from './PhotoGrid.module.css';

/* ── Photo Card with long-press / selection support ── */
function PhotoCard({ photo, index, onClick, selectionMode, isSelected, onToggleSelect }) {
  const [loaded, setLoaded] = useState(false);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

  const handlePointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onToggleSelect(photo.id, true); // `true` = this is the long-press trigger
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
    if (didLongPress.current) return; // don't also fire onClick

    if (selectionMode) {
      onToggleSelect(photo.id, false);
    } else {
      onClick(photo);
    }
  };

  const handlePointerLeave = () => {
    clearTimeout(longPressTimer.current);
  };

  return (
    <div
      className={`${styles.card} ${photo.aspect_ratio < 0.85 ? styles.tall : ''} ${isSelected ? styles.selected : ''} ${selectionMode ? styles.selectMode : ''}`}
      style={{ animationDelay: `${(index % 20) * 40}ms` }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()} // prevent right-click on mobile
    >
      {!loaded && <div className={`${styles.skeletonPh} skeleton`} />}
      <img
        src={photo.thumbnail_url}
        alt={photo.file_name}
        className={`${styles.img} ${loaded ? styles.imgLoaded : ''}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        draggable={false}
      />

      {/* Selection checkbox */}
      {selectionMode && (
        <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
          {isSelected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* Normal overlay (only when NOT in selection mode) */}
      {!selectionMode && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            {(photo.face_embeddings?.length ?? 0) > 0 && (
              <span className={styles.faceCount}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                {photo.face_embeddings.length}
              </span>
            )}
            <span className={styles.expandIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </span>
          </div>
        </div>
      )}

      {/* Selected tint overlay */}
      {isSelected && <div className={styles.selectedOverlay} />}
    </div>
  );
}

/* ── Floating Selection Bar ── */
function SelectionBar({ count, onDownload, onCancel, downloading }) {
  return (
    <div className={styles.selectionBar}>
      <div className={styles.selectionBarInner}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          ✕ Cancel
        </button>
        <span className={styles.selectionCount}>
          {count} photo{count !== 1 ? 's' : ''} selected
        </span>
        <button
          className={styles.downloadBtn}
          onClick={onDownload}
          disabled={count === 0 || downloading}
        >
          {downloading ? (
            <>
              <span className={styles.downloadSpinner} />
              Downloading…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Main PhotoGrid ── */
export default function PhotoGrid({ photos, onPhotoClick }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleToggleSelect = useCallback((id, isLongPress) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isLongPress && !selectionMode) {
        // Enter selection mode
        setSelectionMode(true);
        next.add(id);
        return next;
      }
      // Toggle
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [selectionMode]);

  const handleCancel = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDownload = async () => {
    if (selectedIds.size === 0) return;
    setDownloading(true);

    const selected = photos.filter(p => selectedIds.has(p.id));

    // For Google Drive links, we must rely on the browser's native download
    // behavior to bypass CORS. We open them in new tabs/windows.
    for (const photo of selected) {
      try {
        const a = document.createElement('a');
        a.href = photo.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // HTML5 download attribute is often ignored for cross-origin, 
        // but adding it in case the browser respects it
        a.download = photo.file_name || `photo_${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Delay to prevent the browser's pop-up blocker from stopping multiple tabs
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`Failed to trigger download for ${photo.file_name}:`, err);
      }
    }

    setDownloading(false);
    handleCancel();
  };

  if (photos.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🔍</span>
        <p>No photos match this filter combination.</p>
        <p className="muted" style={{ fontSize: '14px' }}>Try selecting All Events or Everyone</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.count} key={photos.length}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
          {!selectionMode && photos.length > 0 && (
            <span className={styles.selectHint}> · Long press to select</span>
          )}
        </div>
        <div className={styles.gridFrame}>
          <div className={styles.grid}>
            {photos.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={i}
                onClick={onPhotoClick}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(photo.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        </div>
      </div>

      {selectionMode && (
        <SelectionBar
          count={selectedIds.size}
          onDownload={handleDownload}
          onCancel={handleCancel}
          downloading={downloading}
        />
      )}
    </>
  );
}
