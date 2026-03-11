import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import galleryData from '../data.json';
import SelfieFilter from './SelfieFilter';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import LoadingOverlay from './LoadingOverlay';
import HireUsFab from './HireUsFab';
import Footer from './Footer';
import styles from './EventPage.module.css';

export default function EventPage() {
  const { sectionId } = useParams();
  const { gallery, photographer, event_sections, photos } = galleryData;

  const isAll = sectionId === 'all';
  const section = isAll ? null : event_sections.find(s => s.id === sectionId);
  const sectionLabel = isAll ? 'All Events' : (section?.label || sectionId);

  // Scroll to top on page load / route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectionId]);

  // ── State ──
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [selfieMatchIds, setSelfieMatchIds] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // ── Filtered photos for this sub-event ──
  const sectionPhotos = useMemo(() => {
    let filtered = isAll ? [...photos] : photos.filter(p => p.event_section === sectionId);
    if (selfieMatchIds) {
      filtered = filtered.filter(p => selfieMatchIds.includes(p.id));
    }
    return filtered;
  }, [photos, sectionId, selfieMatchIds, isAll]);

  const handleSelfieResult = (ids) => setSelfieMatchIds(ids);

  return (
    <>
      <LoadingOverlay visible={loading} progress={loadingProgress} />

      {/* ── Header bar ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </Link>
          <div className={styles.headerCenter}>
            <p className={styles.headerLabel}>Gallery</p>
            <h1 className={styles.headerTitle}>{sectionLabel}</h1>
          </div>
          <div style={{ width: '72px' }} /> {/* Spacer for symmetry */}
        </div>

        {/* Ornamental line below header */}
        <div className={styles.headerLine} />
      </header>

      {/* ── Main content ── */}
      <main className={styles.main}>
        {/* Find My Photos */}
        <SelfieFilter
          allPhotos={isAll ? photos : photos.filter(p => p.event_section === sectionId)}
          onResult={handleSelfieResult}
          onLoadingChange={setLoading}
          onProgressChange={setLoadingProgress}
          isActive={selfieMatchIds !== null}
          matchCount={selfieMatchIds?.length ?? 0}
        />

        {/* Photo grid */}
        <PhotoGrid
          photos={sectionPhotos}
          onPhotoClick={(photo) => setLightboxPhoto(photo)}
        />
      </main>

      {/* ── Footer ── */}
      <Footer photographer={photographer} gallery={gallery} />

      {/* ── Hire Us FAB ── */}
      <HireUsFab photographer={photographer} />

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={sectionPhotos}
          onClose={() => setLightboxPhoto(null)}
          onNav={(photo) => setLightboxPhoto(photo)}
        />
      )}
    </>
  );
}
