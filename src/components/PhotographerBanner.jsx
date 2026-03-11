import { useEffect, useRef, useCallback } from 'react';
import styles from './PhotographerBanner.module.css';

export default function PhotographerBanner({ photographer, gallery, onYourPhotos }) {
  const heroRef = useRef(null);
  const layer2Ref = useRef(null);
  const layer3Ref = useRef(null);
  const layer4Ref = useRef(null);
  const rafRef = useRef(null);

  const groomName = gallery?.groom_name || 'Groom';
  const brideName = gallery?.bride_name || 'Bride';
  const eventDate = gallery?.event_date
    ? (() => {
        const d = new Date(gallery.event_date);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(2);
        return `${dd} / ${mm} / ${yy}`;
      })()
    : '';

  // Parallax scroll handler
  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      // Layer 2 (3.png): 20% slower
      if (layer2Ref.current) {
        layer2Ref.current.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
      // Layer 3 (2.png): 35% slower
      if (layer3Ref.current) {
        layer3Ref.current.style.transform = `translateY(${scrollY * 0.35}px)`;
      }
      // Layer 4 (1.png): 50% slower
      if (layer4Ref.current) {
        layer4Ref.current.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // Staggered text reveal
  useEffect(() => {
    const els = heroRef.current?.querySelectorAll('[data-reveal]') ?? [];
    els.forEach(el => {
      const isScroll = el.classList.contains(styles.scrollDown);
      el.style.opacity = '0';
      el.style.transform = isScroll ? 'translateX(-50%) translateY(18px)' : 'translateY(18px)';
    });
    const timer = setTimeout(() => {
      els.forEach((el, i) => {
        const isScroll = el.classList.contains(styles.scrollDown);
        const delay = parseFloat(el.dataset.reveal ?? i * 0.18);
        el.style.transition = `opacity 0.9s cubic-bezier(0.25,0.1,0.25,1) ${delay}s, transform 0.9s cubic-bezier(0.25,0.1,0.25,1) ${delay}s`;
        el.style.opacity = '1';
        el.style.transform = isScroll ? 'translateX(-50%) translateY(0)' : 'translateY(0)';
      });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className={styles.hero} ref={heroRef}>
      {/* Layer 1: Background color — handled by CSS */}

      {/* Layer 2: Lanterns (3.png) — 20% slower */}
      <div className={styles.layer2} ref={layer2Ref} aria-hidden="true">
        <img src="/3.png" alt="" className={styles.layerImg} />
      </div>

      {/* Layer 3: Small hearts (2.png) — 35% slower */}
      <div className={styles.layer3} ref={layer3Ref} aria-hidden="true">
        <img src="/2.png" alt="" className={styles.layerImg} />
      </div>

      {/* Layer 4: Large hearts (1.png) — 50% slower */}
      <div className={styles.layer4} ref={layer4Ref} aria-hidden="true">
        <img src="/1.png" alt="" className={styles.layerImg} />
      </div>

      {/* Layer 5: Text — normal scroll speed */}
      <div className={styles.center}>
        <h1 data-reveal="0.3" className={styles.groomName}>{groomName}</h1>
        <p data-reveal="0.5" className={styles.wedsScript}>weds</p>
        <h1 data-reveal="0.7" className={styles.brideName}>{brideName}</h1>

        {eventDate && (
          <p data-reveal="0.9" className={styles.dateText}>{eventDate}</p>
        )}

        {photographer?.name && (
          <p data-reveal="1.1" className={styles.photographerLine}>
            Photography by&nbsp;<strong>{photographer.name}</strong>
          </p>
        )}
      </div>

      {/* Scroll down */}
      <button
        data-reveal="1.3"
        className={styles.scrollDown}
        onClick={onYourPhotos}
        aria-label="Scroll to gallery"
      >
        Scroll down
        <span className={styles.scrollArrow}>↓</span>
      </button>
    </header>
  );
}
