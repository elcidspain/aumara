"use client";

import { useEffect, useState } from "react";
import { BOOK_DIRECT, FLIGHT } from "@/lib/guest";
import styles from "./SpatialGuestPreview.module.css";

const CANONICAL_RUNTIME_URL = "https://elcidspain.github.io/aumara/#flight";

const HOUSE_MEDIA = [
  ["A", "1kqkrNee01qgdmwpMVnVZtZbiDLF8k9td"],
  ["B", "1psM9FIivd5bV32-Uf4pLRyIX4D6unVRD"],
  ["C", "1FxoqCE_VDf9t2rMXT0M3hvmIvE9eo3Um"],
  ["D", "1aHUq9vyjNMukIgJutvUylzOMhmcesmkO"],
  ["E", "1ySxA72RMAl8NDVVEKDOAaG0PC1co16RA"],
  ["F", "1IZnfpL_ohBC67-TqvVHA0nOZtM5BhqGu"],
] as const;

const DESCENT = ["WORLD", "SPAIN", "COSTA BLANCA", "BENIDOLEIG", "AUMARA"];

function googlePhoto(id: string, width = 1800) {
  return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

function SpatialRuntimeBoundary() {
  const [mountRuntime, setMountRuntime] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMountRuntime(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={styles.runtimeShell}>
      <img
        className={styles.runtimeFallback}
        src={FLIGHT.poster}
        alt="AUMARA in Benidoleig"
        fetchPriority="high"
      />
      {mountRuntime ? (
        <iframe
          className={`${styles.runtimeFrame} ${runtimeReady ? styles.runtimeFrameReady : ""}`}
          src={CANONICAL_RUNTIME_URL}
          title="AUMARA spatial experience"
          allow="autoplay; fullscreen"
          allowFullScreen
          loading="eager"
          onLoad={() => setRuntimeReady(true)}
        />
      ) : null}
      <div className={styles.runtimeVeil} aria-hidden="true" />
    </div>
  );
}

export default function SpatialGuestPreview() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} id="top">
        <SpatialRuntimeBoundary />

        <header className={styles.header}>
          <a href="#top" className={styles.brand} aria-label="AUMARA">
            <img src="/media/logo.png?v=lockup" alt="AUMARA" />
          </a>
          <a className={styles.stayButton} href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
            STAY
          </a>
        </header>

        <div className={styles.descent} aria-label="From world to AUMARA">
          {DESCENT.map((step, index) => (
            <span key={step} style={{ "--step": index } as React.CSSProperties}>
              {step}
            </span>
          ))}
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.location}>RINCÓN DEL SILENCIO · BENIDOLEIG · ALICANTE</p>
          <h1>AUMARA</h1>
          <p className={styles.anchor}>Geodesic houses on this land.</p>
          <nav className={styles.heroNav} aria-label="AUMARA experience">
            <a href="#orient">ORIENT</a>
            <a href="#descend">DESCEND</a>
            <a href="#traverse">TRAVERSE</a>
            <a href="#inhabit">INHABIT</a>
          </nav>
        </div>

        <a className={styles.scrollCue} href="#orient" aria-label="Continue into AUMARA">
          <span />
        </a>
      </section>

      <section className={styles.editorial} id="orient">
        <div className={styles.sectionIndex}>01 · ORIENT</div>
        <div className={styles.editorialCopy}>
          <p className={styles.eyebrow}>PLACE</p>
          <h2>From the Costa Blanca to one real piece of land.</h2>
          <p>
            Rincón del Silencio, Benidoleig. The experience begins at landscape scale, then resolves into AUMARA itself.
          </p>
        </div>
        <figure className={styles.editorialImage}>
          <img src={googlePhoto("1wdC_rqzts2T_PRgF3fNWdCOm_7pn3oRO", 2200)} alt="AUMARA landscape" />
        </figure>
      </section>

      <section className={styles.descentSection} id="descend">
        <div className={styles.sectionIndex}>02 · DESCEND</div>
        <div className={styles.descentCopy}>
          <p className={styles.eyebrow}>LANDSCAPE → LAND → PLACE</p>
          <h2>The journey becomes local.</h2>
          <p>
            The spatial opening carries the guest from world scale toward the parcel. Real AUMARA photography remains the visual fallback whenever the live world cannot render.
          </p>
          <a href={CANONICAL_RUNTIME_URL} target="_blank" rel="noopener noreferrer">
            ENTER THE PLACE
          </a>
        </div>
      </section>

      <section className={styles.houses} id="traverse">
        <div className={styles.sectionIndex}>03 · TRAVERSE</div>
        <div className={styles.housesHead}>
          <div>
            <p className={styles.eyebrow}>HOUSES</p>
            <h2>Six geodesic houses. One continuous place.</h2>
          </div>
          <p>
            Move through AUMARA as a spatial world first. The houses become points of interaction inside the place, not isolated product cards.
          </p>
        </div>
        <div className={styles.houseGrid}>
          {HOUSE_MEDIA.map(([house, imageId]) => (
            <article className={styles.houseCard} key={house}>
              <img src={googlePhoto(imageId, 1400)} alt={`AUMARA house ${house}`} loading="lazy" />
              <div>
                <span>AUMARA HOUSE</span>
                <h3>{house}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.inhabit} id="inhabit">
        <div className={styles.inhabitMedia}>
          <img src="/media/stills/chalet-mezzanine.jpg" alt="Inside an AUMARA house" loading="lazy" />
        </div>
        <div className={styles.inhabitCopy}>
          <div className={styles.sectionIndex}>04 · INHABIT</div>
          <p className={styles.eyebrow}>PRIVACY · EXPERIENCE · STAY</p>
          <h2>Arrive through the landscape. Stay inside it.</h2>
          <p>
            The guest experience stays quiet and direct: place first, house second, booking when intent is already formed.
          </p>
          <a className={styles.bookingButton} href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
            CHECK AVAILABILITY
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <img src="/media/logo.png?v=lockup" alt="AUMARA" />
          <p>Rincón del Silencio · Benidoleig · Alicante · Spain</p>
        </div>
        <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
          STAY AT AUMARA
        </a>
      </footer>
    </main>
  );
}
