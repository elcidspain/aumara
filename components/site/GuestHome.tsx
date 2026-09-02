"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOOK_CHALET,
  BOOK_DIRECT,
  BOOK_SUPERIOR,
  NODE_POSITIONS,
  WALK_NODES,
  beds24Url,
} from "@/lib/guest";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultDates(): { checkin: string; checkout: string; minIn: string; minOut: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  start.setDate(start.getDate() + 1);
  end.setDate(end.getDate() + 3);
  const next = new Date(start);
  next.setDate(next.getDate() + 1);
  return { checkin: iso(start), checkout: iso(end), minIn: iso(today), minOut: iso(next) };
}

export default function GuestHome() {
  const initial = useMemo(defaultDates, []);
  const [checkin, setCheckin] = useState(initial.checkin);
  const [checkout, setCheckout] = useState(initial.checkout);
  const [minOut, setMinOut] = useState(initial.minOut);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const node = WALK_NODES[current];
  const searchHref = beds24Url({ checkin, checkout });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setCurrent((i) => (i + WALK_NODES.length - 1) % WALK_NODES.length);
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % WALK_NODES.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  function onCheckin(value: string) {
    setCheckin(value);
    const d = new Date(value + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const next = iso(d);
    setMinOut(next);
    if (!checkout || checkout <= value) setCheckout(next);
  }

  return (
    <>
      <header className="header">
        <a className="brand" href="#top">
          <span className="mark">A</span>
          <span>AUMARA</span>
        </a>
        <nav className="nav">
          <a href="#explore">Walk the site</a>
          <a href="#houses">Houses</a>
          <a href="#retreats">Retreats</a>
          <a href="#operator">Operator</a>
          <a className="book" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
            Book direct
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <img
            className="hero-bg"
            src="/media/hero-houses.jpg"
            alt="Ochre and terracotta geodesic houses among pines at AUMARA"
          />
          <div className="hero-inner">
            <div className="wrap">
              <p className="eyebrow">Benidoleig · Marina Alta · Costa Blanca</p>
              <h1>Walk the place before you choose the house.</h1>
              <p className="lead">
                AUMARA is a private nature stay above the valley: geodesic houses on paths through
                trees, terraces and changing views. Each booking is for a complete house.
              </p>
              <div className="actions">
                <a className="btn primary" href="#explore">
                  Start the walkthrough
                </a>
                <a className="btn secondary" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                  Book direct with Beds24
                </a>
              </div>
              <div className="operator">
                <strong>AUMARA</strong> is operated by <strong>EL CID VENTURES BENIDOLEIG S.L.</strong>{" "}
                Direct availability and reservations are handled through Beds24.
              </div>
            </div>
          </div>
        </section>

        <div className="quick" id="availability">
          <div className="wrap">
            <div className="quick-box">
              <div>
                <label htmlFor="checkin">Check-in</label>
                <input
                  id="checkin"
                  type="date"
                  min={initial.minIn}
                  value={checkin}
                  onChange={(e) => onCheckin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="checkout">Check-out</label>
                <input
                  id="checkout"
                  type="date"
                  min={minOut}
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
              <a className="btn primary" href={searchHref} target="_blank" rel="noopener noreferrer">
                Open live availability
              </a>
              <p className="quick-note">
                Dates are passed to the AUMARA Beds24 page (property 324882). Live prices, house
                availability and reservation terms are confirmed there.
              </p>
            </div>
          </div>
        </div>

        <section className="section tight">
          <div className="wrap">
            <p className="eyebrow">The place</p>
            <p className="manifesto">
              Not a row of rooms and not a generic resort. AUMARA is a small landscape of private
              houses where <em>the route, the distance, the trees and the view</em> are part of the
              stay.
            </p>
          </div>
        </section>

        <section className="explore-section" id="explore">
          <div className="wrap">
            <div className="explore-head">
              <div>
                <p className="eyebrow">Interactive walkthrough</p>
                <h2>Choose a point. Enter the real video.</h2>
              </div>
              <p>
                The plan is the navigation layer. Tap any numbered point to open footage recorded on
                site, then move forward or backward through the route.
              </p>
            </div>
            <div className="explore-shell">
              <div className="map-viewport" id="mapViewport">
                <div className="site-map">
                  <img src="/media/site-plan.jpg" alt="AUMARA site plan with houses along the paths" />
                  <svg className="route-svg" viewBox="0 0 1000 562" preserveAspectRatio="none">
                    <path
                      className="route-base"
                      d="M220 365 C280 342 330 330 400 305 C445 285 480 270 490 250 C515 220 555 210 580 214 C610 245 625 300 630 343 C555 345 465 334 400 305 C350 325 290 350 220 365"
                    />
                    <path
                      className="route-line"
                      d="M220 365 C280 342 330 330 400 305 C445 285 480 270 490 250 C515 220 555 210 580 214 C610 245 625 300 630 343 C555 345 465 334 400 305 C350 325 290 350 220 365"
                    />
                  </svg>
                  <span className="map-tag tag-west">← West / EL CID</span>
                  <span className="map-tag tag-road">Valley road</span>
                  <span className="map-tag tag-north">N</span>
                  {WALK_NODES.map((n, i) => (
                    <button
                      key={n.id}
                      className={`node ${NODE_POSITIONS[i]} ${i === current ? "active" : ""}`}
                      aria-label={`Open point ${i + 1}: ${n.label}`}
                      onClick={() => {
                        setCurrent(i);
                        setOpen(true);
                      }}
                    >
                      <span className="node-dot">{i + 1}</span>
                      <span className="node-label">{n.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <article className="explore-card">
                <div className="node-preview">
                  <img src={node.poster} alt={node.title} />
                  <span className="preview-code">Point {node.id} · real site footage</span>
                </div>
                <div className="explore-body">
                  <p className="eyebrow">{node.title}</p>
                  <h3>{node.subtitle}</h3>
                  <p>{node.description}</p>
                  <div className="node-controls">
                    <button className="walk" type="button" onClick={() => setOpen(true)}>
                      Enter this point
                    </button>
                    <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                      Open Beds24 availability
                    </a>
                  </div>
                  <div className="walk-note">
                    The videos are short, muted by default and recorded on the paths between houses.
                    Use the arrows inside the viewer to move through the eight points.
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="houses">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Stay</p>
              <h2>Two house formats. One landscape.</h2>
              <p>
                Each booking is for a complete private house with its own entrance and outdoor
                relationship to the site. Live availability is on Beds24.
              </p>
            </div>
            <div className="house-grid">
              <article className="card">
                <div className="photo">
                  <img
                    src="/media/stills/chalet-mezzanine.jpg"
                    alt="Chalet interior seen from the mezzanine toward the dining table and windows"
                  />
                </div>
                <div className="body">
                  <p className="eyebrow">Chalet</p>
                  <h3>Open volume. Bed with the windows.</h3>
                  <p>
                    A complete compact house: the bed sits in the glazed volume, the kitchen is in
                    the same room, and a ladder reaches the mezzanine. Warm timber, a private
                    entrance, and a direct path into the planting.
                  </p>
                  <div className="facts">
                    <span className="fact">Complete house</span>
                    <span className="fact">Open-plan living</span>
                    <span className="fact">Mezzanine</span>
                    <span className="fact">Panoramic windows</span>
                  </div>
                  <div className="card-actions">
                    <a href={BOOK_CHALET} target="_blank" rel="noopener noreferrer">
                      Book Chalet direct
                    </a>
                    <a className="alt" href="#explore">
                      See on the route
                    </a>
                  </div>
                </div>
              </article>
              <article className="card">
                <div className="photo">
                  <img
                    src="/media/stills/superior-living.jpg"
                    alt="Superior Chalet living room with white sofa, stair and timber window wall"
                  />
                </div>
                <div className="body">
                  <p className="eyebrow">Superior Chalet</p>
                  <h3>Sitting room. Separate bedroom.</h3>
                  <p>
                    The larger house format: a living room with a white sofa and stair, a separate
                    bedroom, and more space for longer stays. Same geodesic structure, a quieter
                    split between living and sleeping.
                  </p>
                  <div className="facts">
                    <span className="fact">Larger house</span>
                    <span className="fact">Living room</span>
                    <span className="fact">Separate bedroom</span>
                    <span className="fact">Private outdoor space</span>
                  </div>
                  <div className="card-actions">
                    <a href={BOOK_SUPERIOR} target="_blank" rel="noopener noreferrer">
                      Book Superior direct
                    </a>
                    <a className="alt" href="#explore">
                      See on the route
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Daylight and open views</p>
              <h2>Houses in the trees. Valley beyond the frames.</h2>
              <p>
                Exteriors, coloured houses, paths and the view from inside the timber geometry.
                Photographs from the AUMARA stills archive — not generated, not a stock landscape.
              </p>
            </div>
            <div className="gallery">
              <figure>
                <img src="/media/stills/path-green-ochre.jpg" alt="Green and ochre houses beside a stone-edged path" />
                <figcaption>Path between houses</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/ochre-valley.jpg" alt="Ochre house above the Marina Alta valley" />
                <figcaption>Valley below</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/inside-valley.jpg" alt="View from inside a house across the valley" />
                <figcaption>From inside the dome</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/colored-houses.jpg" alt="Coloured geodesic houses among pines" />
                <figcaption>Coloured houses</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/green-house.jpg" alt="Green house with terrace chairs at golden hour" />
                <figcaption>Green house</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="section dark" id="retreats">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Hosted time</p>
              <h2>A place for small groups that usually meet online.</h2>
              <p>
                Sleep, movement, food, attention and a quiet landscape. Programmes are hosted and
                reviewed; the houses remain the accommodation.
              </p>
            </div>
            <div className="retreat-grid">
              <article className="retreat-card">
                <small>Hosted rest</small>
                <h3>Women’s Reset</h3>
                <p>Rest, body, food, nature and relief from the operational load of daily life.</p>
              </article>
              <article className="retreat-card">
                <small>Communities</small>
                <h3>Community Retreats</h3>
                <p>Established learning groups brought carefully into real space.</p>
              </article>
              <article className="retreat-card">
                <small>Movement</small>
                <h3>NeuroAdventure</h3>
                <p>Outdoor formats with structure: mountains, games and time outdoors.</p>
              </article>
              <article className="retreat-card">
                <small>Your programme</small>
                <h3>Bring Your Own Retreat</h3>
                <p>You bring the content; AUMARA provides houses, food, local routes and operations.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="events">
          <div className="wrap event-band">
            <div className="event-photo">
              <img src="/media/stills/inside-trees.jpg" alt="Timber window frames looking into pines from inside a house" />
            </div>
            <div className="event-copy">
              <p className="eyebrow">Private gatherings</p>
              <h2>Take the place as a whole.</h2>
              <p>
                AUMARA can host small-scale formats that need privacy, accommodation and a coherent
                setting rather than a conventional event hall.
              </p>
              <div className="event-list">
                <div>Family weekends</div>
                <div>Creative residencies</div>
                <div>Leadership off-sites</div>
                <div>Community gatherings</div>
                <div>Small celebrations</div>
                <div>Hosted food experiences</div>
              </div>
              <div className="actions">
                <a className="btn primary" href="mailto:elcidspain@gmail.com?subject=AUMARA%20private%20gathering">
                  Discuss a gathering
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="operator">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Operator and booking</p>
              <h2>Clear identity. Direct reservation path.</h2>
              <p>
                AUMARA is the public place and accommodation brand. The legal operator and
                direct-booking system are stated separately.
              </p>
            </div>
            <div className="identity">
              <div className="identity-card">
                <p className="eyebrow">Brand and place</p>
                <h3>AUMARA</h3>
                <p>Private houses and hosted gatherings in Benidoleig, Alicante.</p>
                <div className="identity-row">
                  <strong>Direct booking</strong>
                  <span>
                    <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                      Beds24 property 324882
                    </a>
                  </span>
                </div>
                <div className="identity-row">
                  <strong>House formats</strong>
                  <span>Chalet and Superior Chalet</span>
                </div>
                <div className="identity-row">
                  <strong>On-site walk</strong>
                  <span>Eight video points from the recorded route</span>
                </div>
              </div>
              <div className="identity-card">
                <p className="eyebrow">Legal operator</p>
                <h3>EL CID VENTURES BENIDOLEIG S.L.</h3>
                <p>The company responsible for the accommodation operation.</p>
                <div className="identity-row">
                  <strong>CIF</strong>
                  <span>B53816989</span>
                </div>
                <div className="identity-row">
                  <strong>Address</strong>
                  <span>Urb. Rincón del Silencio, 3, 03759 Benidoleig, Alicante</span>
                </div>
                <div className="identity-row">
                  <strong>Email</strong>
                  <span>
                    <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a>
                  </span>
                </div>
                <div className="identity-row">
                  <strong>Telephone</strong>
                  <span>
                    <a href="tel:+34966579970">+34 966 57 99 70</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap final">
            <p className="eyebrow">Choose your way into AUMARA</p>
            <h2>Walk it. Choose it. Book it.</h2>
            <p>
              Explore the recorded route, compare the two house formats, then continue to the
              AUMARA Beds24 page for live availability and terms.
            </p>
            <div className="actions">
              <a className="btn primary" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                Book direct with Beds24
              </a>
              <a className="btn secondary" href="#explore">
                Walk the site again
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer">
          <div>
            <strong>AUMARA</strong> · Operated by EL CID VENTURES BENIDOLEIG S.L. · CIF B53816989
          </div>
          <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a>
        </div>
      </footer>

      <a className="mobile-book" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
        Book direct
      </a>

      <div
        className={`viewer ${open ? "open" : ""}`}
        id="viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewerName"
        hidden={!open}
      >
        <div className="viewer-head">
          <div className="viewer-title">
            <small>
              Point {node.id} of 08
            </small>
            <strong id="viewerName">{node.title}</strong>
          </div>
          <button className="viewer-close" type="button" aria-label="Close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="viewer-stage">
          {open ? (
            <video key={node.video} src={node.video} muted playsInline loop autoPlay preload="metadata" />
          ) : null}
          <button
            className="viewer-arrow viewer-prev"
            type="button"
            aria-label="Previous point"
            onClick={() => setCurrent((i) => (i + WALK_NODES.length - 1) % WALK_NODES.length)}
          >
            ‹
          </button>
          <button
            className="viewer-arrow viewer-next"
            type="button"
            aria-label="Next point"
            onClick={() => setCurrent((i) => (i + 1) % WALK_NODES.length)}
          >
            ›
          </button>
        </div>
        <div className="viewer-foot">
          <div className="viewer-copy">{node.subtitle}</div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Back to map
          </button>
          <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
            Book direct
          </a>
        </div>
      </div>
    </>
  );
}
