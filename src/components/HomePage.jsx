import { useState, useRef, useEffect } from 'react';
import galleryData from '../data.json';
import PhotographerBanner from './PhotographerBanner';
import SelfieFilter from './SelfieFilter';
import LoadingOverlay from './LoadingOverlay';
import HireUsFab from './HireUsFab';
import DataCard from './DataCard';
import Footer from './Footer';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { gallery, photographer, event_sections, photos } = galleryData;
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [selfieMatchIds, setSelfieMatchIds] = useState(null);
  const momentsRef = useRef(null);

  // Scroll-reveal animation for sub-event cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = momentsRef.current?.querySelectorAll('[data-card]');
    cards?.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const scrollToMoments = () =>
    momentsRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSelfieResult = (ids) => {
    setSelfieMatchIds(ids);
  };

  return (
    <>
      <LoadingOverlay visible={loading} progress={loadingProgress} />

      {/* ── Hero ── */}
      <PhotographerBanner
        photographer={photographer}
        gallery={gallery}
        onYourPhotos={scrollToMoments}
      />

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

      {/* ── Your Moments — Sub-event cards ── */}
      <section className={styles.momentsSection} ref={momentsRef}>
        {/* Section header */}
        <div className={styles.sectionHeader}>
          <div className={styles.ornamentLine} />
          <span className={styles.sectionLabel}>Your Moments</span>
          <div className={styles.ornamentLine} />
        </div>

        <div className={styles.cardGrid}>
          {/* All Events card */}
          <DataCard
            to="/event/all"
            image="https://lh3.googleusercontent.com/d/1G2bE7jssSgpwqh9ekELRNx0C9gKBOxRH=s800"
            label="All Events"
            count={gallery.total_photos ?? photos.length}
            icon="🎊"
            delay={0}
          />

          {/* Sub-event cards */}
          {event_sections.map((section, i) => (
            <DataCard
              key={section.id}
              to={`/event/${section.id}`}
              image="https://lh3.googleusercontent.com/d/1G2bE7jssSgpwqh9ekELRNx0C9gKBOxRH=s800"
              label={section.label}
              count={section.photo_count}
              icon={section.icon}
              delay={(i + 1) * 0.12}
            />
          ))}
        </div>
      </section>

      {/* ── Thank You Section ── */}
      <section className={styles.thankYouSection}>
        <div className={styles.thankYouContent}>
          <p className={styles.thankYouLabel}>We appreciate you</p>
          <h2 className={styles.thankYouText}>Thank You for Visiting</h2>
          <div className={styles.thankYouDivider}>
            <div className={styles.ornamentLine} />
            <span style={{ color: 'var(--gold)', fontSize: '16px' }}>✦</span>
            <div className={styles.ornamentLine} />
          </div>
          <p className={styles.thankYouSub}>
            {photographer?.name
              ? `Photography by ${photographer.name}`
              : 'Your memories, beautifully preserved'}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer photographer={photographer} gallery={gallery} />

      {/* ── Hire Us FAB ── */}
      <HireUsFab photographer={photographer} />
    </>
  );
}
