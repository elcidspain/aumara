"use client";

import { useMemo, useState } from "react";
import { BOOK_CHALET, BOOK_DIRECT, BOOK_SUPERIOR, FLIGHT, beds24Url } from "@/lib/guest";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkin = new Date(today);
  checkin.setDate(checkin.getDate() + 1);
  const checkout = new Date(today);
  checkout.setDate(checkout.getDate() + 3);
  return { checkin: iso(checkin), checkout: iso(checkout), minIn: iso(today) };
}

export default function PreviewLanding() {
  const initial = useMemo(defaultDates, []);
  const [checkin, setCheckin] = useState(initial.checkin);
  const [checkout, setCheckout] = useState(initial.checkout);
  const liveAvailability = beds24Url({ checkin, checkout });

  return (
    <main className="preview-root">
      <section className="preview-hero">
        <video
          className="preview-hero-media"
          src={FLIGHT.video}
          poster={FLIGHT.poster}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-label="AUMARA recorded flight over the geodesic houses and landscape"
        />
        <div className="preview-hero-shade" />
        <div className="preview-shell preview-hero-copy">
          <p className="preview-kicker">AUMARA · Benidoleig · Marina Alta</p>
          <h1>Land here. Stay inside the landscape.</h1>
          <p>
            Private geodesic houses set into the hillside between pines and open valley views. The
            flight brings you onto the property; from there the experience slows down.
          </p>
          <div className="preview-actions">
            <a href="#houses" className="preview-btn preview-btn-primary">Choose your house</a>
            <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer" className="preview-btn preview-btn-ghost">
              Book direct
            </a>
          </div>
        </div>
      </section>

      <section className="preview-transition">
        <div className="preview-shell preview-transition-grid">
          <div>
            <p className="preview-kicker">Arrival</p>
            <h2>From the sky to the houses.</h2>
          </div>
          <p>
            The opening flight gives orientation. The next layer is designed as a continuous float
            through the property: trees, paths, coloured houses, interiors, then direct booking.
            Reconstruction assets can replace the still-based motion layer without changing the page architecture.
          </p>
        </div>
        <div className="preview-cinematic-strip" aria-label="AUMARA arrival sequence">
          <figure><img src="/media/stills/pines-domes.jpg" alt="Geodesic houses among pines" /></figure>
          <figure><img src="/media/stills/path-green-ochre.jpg" alt="Path between AUMARA houses" /></figure>
          <figure><img src="/media/stills/ochre-valley.jpg" alt="AUMARA house above the valley" /></figure>
          <figure><img src="/media/stills/inside-valley.jpg" alt="Valley view from inside an AUMARA house" /></figure>
        </div>
      </section>

      <section className="preview-houses" id="houses">
        <div className="preview-shell">
          <p className="preview-kicker">Choose your house</p>
          <h2>Two ways to stay in the same landscape.</h2>
          <div className="preview-house-grid">
            <article className="preview-house-card">
              <div className="preview-house-image"><img src="/media/stills/chalet-mezzanine.jpg" alt="AUMARA Chalet interior" /></div>
              <div className="preview-house-body">
                <span>Chalet</span>
                <h3>Open volume. Warm timber. Windows to the valley.</h3>
                <p>Compact, self-contained living with the bed, kitchen and mezzanine gathered into one bright geodesic space.</p>
                <a href={BOOK_CHALET} target="_blank" rel="noopener noreferrer">Book Chalet direct</a>
              </div>
            </article>
            <article className="preview-house-card">
              <div className="preview-house-image"><img src="/media/stills/superior-living.jpg" alt="AUMARA Superior Chalet interior" /></div>
              <div className="preview-house-body">
                <span>Superior Chalet</span>
                <h3>More room. Separate bedroom. Longer-stay comfort.</h3>
                <p>A larger format with a dedicated living room, separate sleeping space and a quieter split between day and night.</p>
                <a href={BOOK_SUPERIOR} target="_blank" rel="noopener noreferrer">Book Superior direct</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="preview-booking">
        <div className="preview-shell preview-booking-grid">
          <div>
            <p className="preview-kicker">Direct availability</p>
            <h2>Set your dates. Go straight to the houses.</h2>
            <p>Availability and final reservation terms are confirmed in the AUMARA Beds24 booking engine.</p>
          </div>
          <div className="preview-booking-box">
            <label>Check-in<input type="date" min={initial.minIn} value={checkin} onChange={(e) => setCheckin(e.target.value)} /></label>
            <label>Check-out<input type="date" min={checkin} value={checkout} onChange={(e) => setCheckout(e.target.value)} /></label>
            <a href={liveAvailability} target="_blank" rel="noopener noreferrer" className="preview-btn preview-btn-primary">Open live availability</a>
          </div>
        </div>
      </section>
    </main>
  );
}
