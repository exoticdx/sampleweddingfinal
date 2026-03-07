import { useEffect, useCallback, useRef, useState } from 'react';
import styles from './Lightbox.module.css';

export default function Lightbox({ photo, photos, onClose, onNav }) {
  const currentIndex = photos.findIndex(p => p.id === photo.id);

  const [slideDir, setSlideDir] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);

  // Reset loading states when photo changes
  useEffect(() => {
    setIsLoading(true);
    setIsDownloading(false);
  }, [photo.id]);

  const handleSilentDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      const fileName = photo.file_name || `photo_${photo.id}.jpg`;
      const response = await fetch(`/api/drive/${photo.id}`);
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to trigger download for ${photo.file_name}:`, err);
    } finally {
      setIsDownloading(false);
    }
  };

  const goPrev = useCallback(() => {
    if (currentIndex > 0) { 
      setSlideDir('right'); 
      setIsLoading(true);
      onNav(photos[currentIndex - 1]); 
    }
  }, [currentIndex, photos, onNav]);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) { 
      setSlideDir('left'); 
      setIsLoading(true);
      onNav(photos[currentIndex + 1]); 
    }
  }, [currentIndex, photos, onNav]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  // Touch swipe support
  const touchStartX = useRef(0);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta >  60) goNext();
    if (delta < -60) goPrev();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {/* Close */}
      <button className={styles.close} onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Counter */}
      <div className={styles.counter}>{currentIndex + 1} / {photos.length}</div>

      {/* Prev */}
      {currentIndex > 0 && (
        <button className={`${styles.navBtn} ${styles.prev}`} onClick={e => { e.stopPropagation(); goPrev(); }} aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}

      {/* Image Container */}
      <div
        key={photo.id}
        className={`${styles.imgWrap} ${slideDir === 'left' ? styles.slideLeft : slideDir === 'right' ? styles.slideRight : ''}`}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {isLoading && <div className={styles.loader}></div>}
        <img
          src={photo.thumbnail_url.replace('=s400', '=s1600')}
          alt={photo.file_name}
          className={`${styles.img} ${isLoading ? styles.imgHidden : ''}`}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button className={`${styles.navBtn} ${styles.next}`} onClick={e => { e.stopPropagation(); goNext(); }} aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* Bottom bar */}
      <div className={styles.bar} onClick={e => e.stopPropagation()}>
        <div className={styles.meta}>
          {photo.taken_at && (
            <span className={styles.date}>
              {new Date(photo.taken_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
        </div>
        <button
          onClick={handleSilentDownload}
          disabled={isDownloading}
          className={styles.dlBtn}
          title="Download photo"
        >
          {isDownloading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.spinnerSmall} /> Downloading...
            </span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
