import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import galleryData from '../data.json';
import PhotographerBanner from './PhotographerBanner';
import SelfieFilter from './SelfieFilter';
import LoadingOverlay from './LoadingOverlay';
import HireUsFab from './HireUsFab';
import Footer from './Footer';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { gallery, photographer, event_sections, photos } = galleryData;
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [selfieMatchIds, setSelfieMatchIds] = useState(null);
  const momentsRef = useRef(null);
  const cardElsRef = useRef([]);
  const dotElsRef = useRef([]);
  const arrowRef = useRef(null);
  const [perfectMoments] = useState(() => {
    // Basic randomness: sort randomly then slice on initial render only
    const shuffled = [...photos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  });
  const rafRef = useRef(null);

  // Build carousel cards: "All Events" + each sub-event
  const cards = [
    {
      id: 'all',
      label: 'All Events',
      icon: '\u{1F38A}',
      photo_count: gallery.total_photos ?? photos.length,
      cover_url: gallery.cover_photo_url?.replace('=s400', '=s800')
        || 'https://lh3.googleusercontent.com/d/1G2bE7jssSgpwqh9ekELRNx0C9gKBOxRH=s800',
    },
    ...event_sections.map(s => ({
      ...s,
      cover_url: s.cover_url?.replace('=s400', '=s800') || s.cover_url,
    })),
  ];

  // ── Vertical wheel scroll handler ──
  useEffect(() => {
    const runway = momentsRef.current;
    if (!runway) return;

    const totalCards = cards.length;
    const totalTransitions = totalCards - 1;

    // Wheel geometry — responsive to viewport height
    const TILT = 28;           // rotateX degrees per card offset
    const SCALE_DROP = 0.1;    // scale shrink per offset
    const OPACITY_DROP = 0.65; // opacity fade per offset (adjacent ≈ 0.35)
    const VISIBLE_RANGE = 1.3; // render cards within this offset

    let snapTimer = null;
    let isSnapping = false;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = runway.getBoundingClientRect();
        const vh = window.innerHeight;
        const scrollableDistance = runway.offsetHeight - vh;
        if (scrollableDistance <= 0) return;

        // Scale spacing with viewport: ~520px on desktop, ~340px on mobile
        const SPACING = Math.min(520, vh * 0.45);

        // Continuous position: 0 = first card centered, totalTransitions = last card centered
        const rawProgress = Math.max(0, Math.min(1, -rect.top / scrollableDistance));
        const currentPos = rawProgress * totalTransitions;
        const activeIdx = Math.min(Math.round(currentPos), totalTransitions);

        // Position each card on the vertical drum
        cardElsRef.current.forEach((el, i) => {
          if (!el) return;
          const offset = i - currentPos;       // continuous offset from center
          const absOffset = Math.abs(offset);

          if (absOffset > VISIBLE_RANGE) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }

          // Drum surface: card slides vertically, tilts with cylinder curvature
          const y = offset * SPACING;
          const rx = -offset * TILT;           // top cards tilt back, bottom cards tilt forward
          const s = Math.max(0.85, 1 - absOffset * SCALE_DROP);
          const o = Math.max(0, 1 - absOffset * OPACITY_DROP);

          el.style.opacity = String(o);
          el.style.transform = `translateY(${y}px) rotateX(${rx}deg) scale(${s})`;
          el.style.pointerEvents = absOffset < 0.4 ? 'auto' : 'none';
          el.style.zIndex = String(100 - Math.round(absOffset * 10));
        });

        // Update pagination dots
        dotElsRef.current.forEach((el, i) => {
          if (!el) return;
          if (i === activeIdx) {
            el.style.background = 'var(--gold)';
            el.style.transform = 'scale(1.4)';
          } else {
            el.style.background = 'var(--border)';
            el.style.transform = 'scale(1)';
          }
        });

        // Hide arrow on last card
        if (arrowRef.current) {
          arrowRef.current.style.opacity = activeIdx >= totalTransitions ? '0' : '0.7';
        }
      });

      // ── Snap to nearest card when scrolling stops ──
      clearTimeout(snapTimer);
      if (!isSnapping) {
        snapTimer = setTimeout(() => {
          const rect = runway.getBoundingClientRect();
          const vh = window.innerHeight;
          const scrollableDistance = runway.offsetHeight - vh;
          if (scrollableDistance <= 0) return;

          const rawProgress = Math.max(0, Math.min(1, -rect.top / scrollableDistance));
          const currentPos = rawProgress * totalTransitions;
          const nearestIdx = Math.round(currentPos);

          // Only snap if inside the runway and noticeably off-center
          const inRunway = rect.top <= 0 && rect.top >= -scrollableDistance;
          if (inRunway && Math.abs(currentPos - nearestIdx) > 0.02) {
            isSnapping = true;
            const targetProgress = nearestIdx / totalTransitions;
            const targetY = window.scrollY + (targetProgress - rawProgress) * scrollableDistance;

            // Custom eased scroll animation
            const startY = window.scrollY;
            const diff = targetY - startY;
            const duration = 500;
            const startTime = performance.now();

            function snapStep(now) {
              const elapsed = now - startTime;
              const t = Math.min(elapsed / duration, 1);
              // Ease-out cubic — smooth deceleration
              const eased = 1 - Math.pow(1 - t, 3);
              window.scrollTo(0, startY + diff * eased);
              if (t < 1) {
                requestAnimationFrame(snapStep);
              } else {
                isSnapping = false;
              }
            }
            requestAnimationFrame(snapStep);
          }
        }, 150);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // set initial state
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(snapTimer);
    };
  }, [cards.length]);

  const scrollToMoments = () =>
    momentsRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSelfieResult = (ids) => {
    setSelfieMatchIds(ids);
  };

  return (
    <div className={styles.pageWrapper}>
      <LoadingOverlay visible={loading} progress={loadingProgress} />

      {/* ── Hero ── */}
      <PhotographerBanner
        photographer={photographer}
        gallery={gallery}
        onYourPhotos={scrollToMoments}
      />

      {/* ── Thank You Section ── */}
      <section className={styles.thankYouSection}>
       {/* <picture>
          <source media="(max-width: 768px)" srcSet="/Cloud.png" />
          <img src="/CloudD.png" alt="" className={styles.thankYouBg} aria-hidden="true" />
        </picture>*/}
        <div className={styles.thankYouGradient} aria-hidden="true" />
        <div className={styles.thankYouContent}>
          {/* <p className={styles.thankYouLabel}>We appreciate you</p> */}
          {/* <h2 className={styles.thankYouText}>Thank You for Visiting Our Wedding</h2>
          <div className={styles.thankYouDivider}>
            <div className={styles.ornamentLine} />
            <span style={{ color: 'var(--gold)', fontSize: '16px' }}>✦</span>
            <div className={styles.ornamentLine} />
          </div>
          <p className={styles.thankYouSub}>
            {photographer?.name
              ? `Photography by ${photographer.name}`
              : 'Your memories, beautifully preserved'}
          </p> */}
        </div>
      </section>

      {/* ── Find My Photos Section ── */}
      <section className={styles.findSection}>
        <SelfieFilter
          allPhotos={photos}
          onResult={handleSelfieResult}
          onLoadingChange={setLoading}
          onProgressChange={setLoadingProgress}
          isActive={selfieMatchIds !== null}
          matchCount={selfieMatchIds?.length ?? 0}
        />
      </section>

      {/* ── White background wrapper ── */}
      <div className={styles.whiteSection}>
        {/* ── Your Moments — Wheel Carousel ── */}
        <div
          className={styles.wheelRunway}
          ref={momentsRef}
          style={{ height: `${cards.length * 100}vh` }}
        >
          <div className={styles.wheelSticky}>
            {/* Layer 1: Cards */}
            <div className={styles.wheelCardsLayer}>
              <div className={styles.wheelStage}>
                {cards.map((card, i) => (
                  <Link
                    key={card.id}
                    to={`/event/${card.id}`}
                    className={styles.wheelCard}
                    ref={el => { cardElsRef.current[i] = el; }}
                    style={{
                      opacity: i === 0 ? 1 : i === 1 ? 0.35 : 0,
                      transform: i === 0
                        ? 'translateY(0px) rotateX(0deg) scale(1)'
                        : `translateY(${i * 520}px) rotateX(${-i * 28}deg) scale(${Math.max(0.85, 1 - i * 0.1)})`,
                      zIndex: 100 - i * 10,
                    }}
                  >
                      {/* Layer 1: Square image */}
                    <img
                      src={card.cover_url}
                      alt={card.label}
                      className={styles.wheelCardImage}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    {/* Layer 2: Text overlay on image */}
                    <div className={styles.wheelCardTextOverlay}>
                      <h3 className={styles.wheelCardName}>{card.label}</h3>
                      <p className={styles.wheelCardCount}>{card.photo_count ?? 0} photos</p>
                    </div>
                    {/* Layer 3: Frame overlay */}
                    <img
                      src="/Frame.png"
                      alt=""
                      className={styles.wheelCardFrame}
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Layer 2: Gradient mask — white edges fade to transparent window */}
            <div className={styles.wheelGradientMask} aria-hidden="true" />

            {/* Layer 3: UI — title, dots, scroll arrow */}
            <div className={styles.wheelUiLayer}>
              <div className={styles.sectionHeader}>
                <div className={styles.ornamentLine} />
                <span className={styles.sectionLabel}>Your Moments</span>
                <div className={styles.ornamentLine} />
              </div>
              <div style={{ flex: 1 }} />
              <div className={styles.wheelNav}>
                {cards.map((card, i) => (
                  <div
                    key={card.id}
                    className={styles.wheelDot}
                    ref={el => { dotElsRef.current[i] = el; }}
                  />
                ))}
              </div>
              <div className={styles.wheelArrow} ref={arrowRef}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── Perfect Moments — Masonry Grid ── */}
        <section className={styles.perfectMomentsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.ornamentLine} />
            <div className={styles.titleWrapper}>
              <h2 className={styles.sectionLabel}>Perfect Moments</h2>
              <p className={styles.shotBySub}>shot by {photographer.name}</p>
            </div>
            <div className={styles.ornamentLine} />
          </div>
          
          <div className={styles.masonryGrid}>
            {perfectMoments.map((photo, i) => (
              <div key={photo.id || i} className={styles.masonryItem}>
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={`Perfect Moment ${i + 1}`}
                  loading="lazy"
                  className={styles.masonryImage}
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Couple's Letter Section ── */}
        <section className={styles.letterSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.ornamentLine} />
            <div className={styles.titleWrapper}>
              <h2 className={styles.sectionLabel}>Couple&apos;s Letter</h2>
              <p className={styles.shotBySub}>shot by {photographer.name}</p>
            </div>
            <div className={styles.ornamentLine} />
          </div>
          
          <div className={styles.letterContainer}>
            <p className={styles.letterText}>
              To our dearest family and friends,
              <br /><br />
              Thank you for being part of our journey. From our first date to this incredible milestone, your love and support have meant the world to us. We are so thrilled to share the memories of our most special day with all the people who make our lives truly complete.
              <br /><br />
              With all our love,
            </p>
            <p className={styles.letterSignatures}>
              {gallery.bride_name} & {gallery.groom_name}
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <Footer photographer={photographer} gallery={gallery} />
      </div>

      {/* ── Hire Us FAB ── */}
      {/* <HireUsFab photographer={photographer} /> */}
    </div>
  );
}
