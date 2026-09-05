"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BOOK_CHALET,
  BOOK_DIRECT,
  BOOK_SUPERIOR,
  EL_CID_URL,
  FLIGHT,
  NODE_POSITIONS,
  WALK_NODES,
  beds24Url,
} from "@/lib/guest";
import { COPY, LANGS, detectLang, persistLang, type Lang } from "@/lib/i18n";
import { createOpeningPad, type PadHandle } from "@/lib/openingPad";

const LISTEN: Record<Lang, string> = {
  es: "Escuchar",
  en: "Listen",
  ru: "Слушать",
  fr: "Écouter",
  de: "Hören",
  nl: "Luisteren",
  it: "Ascolta",
  pt: "Escutar",
  ca: "Escoltar",
  pl: "Słuchaj",
  uk: "Слухати",
  sv: "Lyssna",
};

const QUIET: Record<Lang, string> = {
  es: "Silencio",
  en: "Quiet",
  ru: "Тишина",
  fr: "Silence",
  de: "Stille",
  nl: "Stil",
  it: "Silenzio",
  pt: "Silêncio",
  ca: "Silenci",
  pl: "Cisza",
  uk: "Тиша",
  sv: "Tystnad",
};

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
  const [lang, setLang] = useState<Lang>("es");
  const [langOpen, setLangOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const padRef = useRef<PadHandle | null>(null);

  const t = COPY[lang];
  const node = WALK_NODES[current];
  const nodeT = t.nodes[node.id] ?? t.nodes["01"];
  const searchHref = beds24Url({ checkin, checkout });
  const [h1a, h1b] = t.h1.split("\n");

  useEffect(() => {
    const next = detectLang();
    setLang(next);
    persistLang(next);
  }, []);

  useEffect(() => {
    persistLang(lang);
  }, [lang]);

  useEffect(() => {
    padRef.current = createOpeningPad();
    return () => {
      padRef.current?.stop();
      padRef.current = null;
    };
  }, []);

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

  function chooseLang(next: Lang) {
    setLang(next);
    setLangOpen(false);
  }

  async function toggleSound() {
    const pad = padRef.current;
    if (!pad) return;
    if (soundOn) {
      pad.stop();
      padRef.current = createOpeningPad();
      setSoundOn(false);
      return;
    }
    try {
      await pad.start();
      setSoundOn(true);
    } catch {
      setSoundOn(false);
    }
  }

  return (
    <>
      <header className="header">
        <a className="brand" href="#top" aria-label="AUMARA">
          <img
            src="/media/logo-mark.png?v=gold"
            alt=""
            className="brand-mark"
            width={48}
            height={48}
          />
          <span className="brand-word">
            <span className="brand-name">AUMARA</span>
            <span className="brand-tag">BY EL CID COUNTRY CLUB</span>
          </span>
        </a>
        <div className="header-tools">
          <nav className="nav">
            <a href="#explore">{t.navWalk}</a>
            <a href="#houses">{t.navHouses}</a>
            <a href="#retreats">{t.navRetreats}</a>
            <a className="elcid" href={EL_CID_URL} target="_blank" rel="noopener noreferrer">
              El Cid
            </a>
            <a href="#operator">{t.navOperator}</a>
            <a className="book" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
              {t.navBook}
            </a>
          </nav>
          <div className="lang">
            <button
              type="button"
              className="lang-btn"
              aria-label={t.langLabel}
              aria-expanded={langOpen}
              onClick={() => setLangOpen((v) => !v)}
            >
              {LANGS.find((item) => item.id === lang)?.code ?? "ES"}
            </button>
            {langOpen ? (
              <div className="lang-menu" role="listbox" aria-label={t.langLabel}>
                {LANGS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={item.id === lang}
                    className={item.id === lang ? "active" : undefined}
                    onClick={() => chooseLang(item.id)}
                  >
                    {item.code} · {item.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <video
            className="hero-bg"
            src={FLIGHT.video}
            poster={FLIGHT.poster}
            muted
            autoPlay
            playsInline
            loop
            preload="metadata"
            aria-label={t.flightAria}
          />
          <div className="hero-inner">
            <div className="wrap">
              <p className="eyebrow hero-in hero-in-1">{t.eyebrow}</p>
              <h1 className="hero-title">
                <span className="hero-line hero-line-1">{h1a}</span>
                {h1b ? <span className="hero-line hero-line-2">{h1b}</span> : null}
              </h1>
              <p className="lead hero-in hero-in-3">{t.lead}</p>
              <div className="actions hero-in hero-in-4">
                <a className="btn primary" href="#explore">
                  {t.ctaWalk}
                </a>
                <a className="btn secondary" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                  {t.ctaBookBeds}
                </a>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={soundOn ? "sound-btn on" : "sound-btn"}
            aria-pressed={soundOn}
            aria-label={soundOn ? QUIET[lang] : LISTEN[lang]}
            onClick={toggleSound}
          >
            <span className="sound-dot" aria-hidden="true" />
            {soundOn ? QUIET[lang] : LISTEN[lang]}
          </button>
        </section>

        <div className="quick" id="availability">
          <div className="wrap">
            <div className="quick-box">
              <div>
                <label htmlFor="checkin">{t.checkin}</label>
                <input
                  id="checkin"
                  type="date"
                  min={initial.minIn}
                  value={checkin}
                  onChange={(e) => onCheckin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="checkout">{t.checkout}</label>
                <input
                  id="checkout"
                  type="date"
                  min={minOut}
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
              <a className="btn primary" href={searchHref} target="_blank" rel="noopener noreferrer">
                {t.openAvail}
              </a>
              <p className="quick-note">{t.quickNote}</p>
            </div>
          </div>
        </div>

        <section className="section tight">
          <div className="wrap">
            <p className="eyebrow">{t.placeEyebrow}</p>
            <p className="manifesto">
              {t.manifestoBefore}
              <em>{t.manifestoEm}</em>
              {t.manifestoAfter}
            </p>
          </div>
        </section>

        <section className="explore-section" id="explore">
          <div className="wrap">
            <div className="explore-head">
              <div>
                <p className="eyebrow">{t.exploreEyebrow}</p>
                <h2>{t.exploreH2}</h2>
              </div>
              <p>{t.exploreP}</p>
            </div>
            <div className="explore-shell">
              <div className="map-viewport" id="mapViewport">
                <div className="site-map">
                  <img src="/media/site-plan.jpg" alt={t.mapAlt} />
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
                  <span className="map-tag tag-west">{t.tagWest}</span>
                  <span className="map-tag tag-road">{t.tagRoad}</span>
                  <span className="map-tag tag-north">N</span>
                  {WALK_NODES.map((n, i) => {
                    const label = t.nodes[n.id]?.label ?? n.label;
                    return (
                      <button
                        key={n.id}
                        className={`node ${NODE_POSITIONS[i]} ${i === current ? "active" : ""}`}
                        aria-label={`${t.openPoint} ${i + 1}: ${label}`}
                        onClick={() => {
                          setCurrent(i);
                          setOpen(true);
                        }}
                      >
                        <span className="node-dot">{i + 1}</span>
                        <span className="node-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <article className="explore-card">
                <div className="node-preview">
                  <img src={node.poster} alt={nodeT.title} />
                  <span className="preview-code">
                    {t.pointOf} {node.id} · {t.pointFootage}
                  </span>
                </div>
                <div className="explore-body">
                  <p className="eyebrow">{nodeT.title}</p>
                  <h3>{nodeT.subtitle}</h3>
                  <p>{nodeT.description}</p>
                  <div className="node-controls">
                    <button className="walk" type="button" onClick={() => setOpen(true)}>
                      {t.enterPoint}
                    </button>
                    <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                      {t.openBeds}
                    </a>
                  </div>
                  <div className="walk-note">{t.walkNote}</div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="houses">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">{t.stayEyebrow}</p>
              <h2>{t.stayH2}</h2>
              <p>{t.stayP}</p>
            </div>
            <div className="house-grid">
              <article className="card">
                <div className="photo">
                  <img
                    src="/media/stills/chalet-mezzanine.jpg"
                    alt={t.chaletH3}
                  />
                </div>
                <div className="body">
                  <p className="eyebrow">Chalet</p>
                  <h3>{t.chaletH3}</h3>
                  <p>{t.chaletP}</p>
                  <div className="facts">
                    <span className="fact">{t.factHouse}</span>
                    <span className="fact">{t.factOpen}</span>
                    <span className="fact">{t.factMezz}</span>
                    <span className="fact">{t.factPan}</span>
                  </div>
                  <div className="card-actions">
                    <a href={BOOK_CHALET} target="_blank" rel="noopener noreferrer">
                      {t.bookChalet}
                    </a>
                    <a className="alt" href="#explore">
                      {t.seeRoute}
                    </a>
                  </div>
                </div>
              </article>
              <article className="card">
                <div className="photo">
                  <img
                    src="/media/stills/superior-living.jpg"
                    alt={t.supH3}
                  />
                </div>
                <div className="body">
                  <p className="eyebrow">Superior Chalet</p>
                  <h3>{t.supH3}</h3>
                  <p>{t.supP}</p>
                  <div className="facts">
                    <span className="fact">{t.factLarger}</span>
                    <span className="fact">{t.factLiving}</span>
                    <span className="fact">{t.factBed}</span>
                    <span className="fact">{t.factOutdoor}</span>
                  </div>
                  <div className="card-actions">
                    <a href={BOOK_SUPERIOR} target="_blank" rel="noopener noreferrer">
                      {t.bookSup}
                    </a>
                    <a className="alt" href="#explore">
                      {t.seeRoute}
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="gift">
          <div className="wrap">
            <div className="section-head">
              <h2>{t.perkH2}</h2>
              <p>{t.perkP}</p>
            </div>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">{t.galEyebrow}</p>
              <h2>{t.galH2}</h2>
              <p>{t.galP}</p>
            </div>
            <div className="gallery">
              <figure>
                <img src="/media/stills/path-green-ochre.jpg" alt={t.capPath} />
                <figcaption>{t.capPath}</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/ochre-valley.jpg" alt={t.capValley} />
                <figcaption>{t.capValley}</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/inside-valley.jpg" alt={t.capInside} />
                <figcaption>{t.capInside}</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/colored-houses.jpg" alt={t.capColored} />
                <figcaption>{t.capColored}</figcaption>
              </figure>
              <figure>
                <img src="/media/stills/green-house.jpg" alt={t.capGreen} />
                <figcaption>{t.capGreen}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="section dark" id="retreats">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">{t.retEyebrow}</p>
              <h2>{t.retH2}</h2>
              <p>{t.retP}</p>
            </div>
            <div className="retreat-grid">
              <article className="retreat-card">
                <small>{t.r1s}</small>
                <h3>{t.r1h}</h3>
                <p>{t.r1p}</p>
              </article>
              <article className="retreat-card">
                <small>{t.r2s}</small>
                <h3>{t.r2h}</h3>
                <p>{t.r2p}</p>
              </article>
              <article className="retreat-card">
                <small>{t.r3s}</small>
                <h3>{t.r3h}</h3>
                <p>{t.r3p}</p>
              </article>
              <article className="retreat-card">
                <small>{t.r4s}</small>
                <h3>{t.r4h}</h3>
                <p>{t.r4p}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="events">
          <div className="wrap event-band">
            <div className="event-photo">
              <img src="/media/stills/inside-trees.jpg" alt={t.capInside} />
            </div>
            <div className="event-copy">
              <p className="eyebrow">{t.evEyebrow}</p>
              <h2>{t.evH2}</h2>
              <p>{t.evP}</p>
              <div className="event-list">
                <div>{t.ev1}</div>
                <div>{t.ev2}</div>
                <div>{t.ev3}</div>
                <div>{t.ev4}</div>
                <div>{t.ev5}</div>
                <div>{t.ev6}</div>
              </div>
              <div className="actions">
                <a className="btn primary" href="mailto:elcidspain@gmail.com?subject=AUMARA%20private%20gathering">
                  {t.discuss}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="operator">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">{t.opEyebrow}</p>
              <h2>{t.opH2}</h2>
              <p>{t.opP}</p>
            </div>
            <div className="identity">
              <div className="identity-card">
                <p className="eyebrow">{t.brandPlace}</p>
                <h3>AUMARA</h3>
                <p>{t.brandP}</p>
                <div className="identity-row">
                  <strong>{t.rowElcid}</strong>
                  <span>
                    <a href={EL_CID_URL} target="_blank" rel="noopener noreferrer">
                      {t.rowElcidV}
                    </a>
                  </span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowBook}</strong>
                  <span>
                    <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                      {t.rowBookV}
                    </a>
                  </span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowFmt}</strong>
                  <span>{t.rowFmtV}</span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowWalk}</strong>
                  <span>{t.rowWalkV}</span>
                </div>
              </div>
              <div className="identity-card">
                <p className="eyebrow">{t.legalEyebrow}</p>
                <h3>EL CID VENTURES BENIDOLEIG S.L.</h3>
                <p>
                  {t.legalP}{" "}
                  <a href={EL_CID_URL} target="_blank" rel="noopener noreferrer">
                    El Cid
                  </a>
                  .
                </p>
                <div className="identity-row">
                  <strong>{t.rowCif}</strong>
                  <span>B53816989</span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowAddr}</strong>
                  <span>{t.addr}</span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowEmail}</strong>
                  <span>
                    <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a>
                  </span>
                </div>
                <div className="identity-row">
                  <strong>{t.rowTel}</strong>
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
            <p className="eyebrow">{t.finalEyebrow}</p>
            <h2>{t.finalH2}</h2>
            <p>{t.finalP}</p>
            <div className="actions">
              <a className="btn primary" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
                {t.ctaBookBeds}
              </a>
              <a className="btn secondary" href="#explore">
                {t.walkAgain}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer">
          <div>
            <strong>AUMARA</strong> · {t.footerOp}
          </div>
          <div className="footer-links">
            <a href={EL_CID_URL} target="_blank" rel="noopener noreferrer">
              El Cid · elcidspain.com
            </a>
            <a href="mailto:elcidspain@gmail.com">elcidspain@gmail.com</a>
          </div>
        </div>
      </footer>

      <a className="mobile-book" href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
        {t.navBook}
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
              {t.pointOf} {node.id} {t.of08}
            </small>
            <strong id="viewerName">{nodeT.title}</strong>
          </div>
          <button className="viewer-close" type="button" aria-label={t.close} onClick={() => setOpen(false)}>
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
            aria-label={t.prev}
            onClick={() => setCurrent((i) => (i + WALK_NODES.length - 1) % WALK_NODES.length)}
          >
            ‹
          </button>
          <button
            className="viewer-arrow viewer-next"
            type="button"
            aria-label={t.next}
            onClick={() => setCurrent((i) => (i + 1) % WALK_NODES.length)}
          >
            ›
          </button>
        </div>
        <div className="viewer-foot">
          <div className="viewer-copy">{nodeT.subtitle}</div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {t.backMap}
          </button>
          <a href={BOOK_DIRECT} target="_blank" rel="noopener noreferrer">
            {t.navBook}
          </a>
        </div>
      </div>
    </>
  );
}
