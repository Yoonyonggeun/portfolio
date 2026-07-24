import {
  ScrollScrub,
  type ScrollScrubScene,
} from "./scroll-scrub";

/* Bespoke CTA components: one intent, one label, three garments. */

function HeroCta() {
  return (
    <a
      className="inline-block bg-[var(--k-accent)] px-7 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[var(--k-void)] transition-transform duration-150 hover:bg-[var(--k-bone)] active:scale-[0.98]"
      href="#offer"
    >
      Reserve a fit
    </a>
  );
}

function BuildCta() {
  return (
    <a
      className="group inline-block border border-[var(--k-accent)] px-7 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[var(--k-bone)] transition-colors duration-150 hover:bg-[var(--k-accent)] hover:text-[var(--k-void)] active:scale-[0.98]"
      href="#offer"
    >
      Reserve a fit
      <span className="ml-3 inline-block text-[var(--k-accent)] transition-transform duration-150 group-hover:translate-y-[2px] group-hover:text-[var(--k-void)]">
        ↓
      </span>
    </a>
  );
}

function OfferCta() {
  return (
    <a
      className="mt-10 flex items-center justify-between gap-4 bg-[var(--k-accent)] px-8 py-6 text-[var(--k-void)] transition-[background-color,transform] duration-150 hover:bg-[var(--k-bone)] active:scale-[0.99]"
      href="mailto:fit@kontakt.bike?subject=Fit%20reservation%2C%20KONTAKT%20ONE"
    >
      <span className="text-lg font-extrabold uppercase tracking-[0.12em]">
        Reserve a fit
      </span>
      <span className="k-mono text-sm font-bold">$2,190 · 30 builds/mo</span>
    </a>
  );
}

const WORLD = "/assets/kontakt/world";

const SCENES: ScrollScrubScene[] = [
  {
    id: "one",
    label: "ONE",
    poster: `${WORLD}/hero-poster.webp`,
    mobilePoster: `${WORLD}/hero-mobile-poster.webp`,
    clip: `${WORLD}/hero.mp4`,
    mobileClip: `${WORLD}/hero-mobile.mp4`,
    kicker: "Kontakt One",
    title: "100 km. Zero pain.",
    body: "An endurance road bike engineered around the five points where your body and the road actually touch.",
    tags: ["CONTACT-5 SYSTEM", "ENDURANCE GEOMETRY", "32C TUBELESS"],
    actions: <HeroCta />,
    align: "left",
    scroll: 1.6,
  },
  {
    id: "saddle",
    label: "SADDLE",
    poster: `${WORLD}/saddle-poster.webp`,
    mobilePoster: `${WORLD}/saddle-mobile-poster.webp`,
    clip: `${WORLD}/saddle.mp4`,
    mobileClip: `${WORLD}/saddle-mobile.mp4`,
    title: "We removed what presses.",
    body: "The 3D printed lattice stays firm under your sit bones and gives under soft tissue, and the full length cutout takes pressure off the perineum entirely. You get off after 100 km ready to ride tomorrow.",
    tags: ["3D LATTICE", "245 MM SHORT NOSE", "PEAK PRESSURE -37%*"],
    align: "right",
    scroll: 1.5,
  },
  {
    id: "bar",
    label: "BAR",
    poster: `${WORLD}/handlebar-poster.webp`,
    mobilePoster: `${WORLD}/handlebar-mobile-poster.webp`,
    clip: `${WORLD}/handlebar.mp4`,
    mobileClip: `${WORLD}/handlebar-mobile.mp4`,
    title: "Vibration ends before your hands.",
    body: "An 8 degree flare follows the natural angle of your wrists and a 65 mm short reach moves weight off your palms. Damping tape absorbs the road buzz that used to linger for days.",
    tags: ["8° FLARE", "65 MM REACH", "VIBRATION -42%*"],
    align: "left",
    scroll: 1.5,
  },
  {
    id: "pedal",
    label: "PEDAL",
    poster: `${WORLD}/pedal-poster.webp`,
    mobilePoster: `${WORLD}/pedal-mobile-poster.webp`,
    clip: `${WORLD}/pedal.mp4`,
    mobileClip: `${WORLD}/pedal-mobile.mp4`,
    title: "Knees were never the suspension.",
    body: "You turn the pedals about 5,400 times an hour. Six degrees of free float lets the cleat rotate so your knee tracks clean, and a 28 percent wider platform spreads the load.",
    tags: ["6° FREE FLOAT", "CONTACT AREA +28%"],
    align: "right",
    scroll: 1.5,
  },
  {
    id: "tire",
    label: "TIRE",
    poster: `${WORLD}/tire-poster.webp`,
    mobilePoster: `${WORLD}/tire-mobile-poster.webp`,
    clip: `${WORLD}/tire.mp4`,
    mobileClip: `${WORLD}/tire-mobile.mp4`,
    title: "The pros went wide first.",
    body: "The measured average tire width at the 2026 Tour de France was 30.3 mm. KONTAKT ONE ships 32c tubeless at low pressure: road buzz absorbed, rolling speed intact.",
    tags: ["32C TUBELESS", "TDF 2026 AVG 30.3 MM"],
    align: "left",
    scroll: 1.5,
  },
  {
    id: "post",
    label: "POST",
    poster: `${WORLD}/seatpost-poster.webp`,
    mobilePoster: `${WORLD}/seatpost-mobile-poster.webp`,
    clip: `${WORLD}/seatpost.mp4`,
    mobileClip: `${WORLD}/seatpost-mobile.mp4`,
    title: "The first 20 mm, not your spine.",
    body: "A carbon leaf spring flexes before impact reaches your lower back. It is the fifth contact point most bikes never get.",
    tags: ["CARBON LEAF SPRING", "20 MM TRAVEL"],
    align: "right",
    scroll: 1.5,
  },
  {
    id: "build",
    label: "BUILD",
    poster: `${WORLD}/assembly-poster.webp`,
    mobilePoster: `${WORLD}/assembly-mobile-poster.webp`,
    clip: `${WORLD}/assembly.mp4`,
    mobileClip: `${WORLD}/assembly-mobile.mp4`,
    kicker: "Contact-5 System",
    title: "Five contacts. One bicycle.",
    body: "Frames do not create pain. Contact points do. Five re-engineered parts come together as the bike your body was measured for.",
    actions: <BuildCta />,
    align: "left",
    scroll: 3.2,
    linger: 0.18,
  },
];

const THEME = {
  background: "#17191C",
  ink: "#F2EFE9",
  muted: "rgba(242, 239, 233, 0.64)",
  accent: "#FF4D00",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What if the saddle still hurts?",
    a: "Then the bike goes back and the money comes back. Get fitted, ride 500 km within 30 days, and if pain is still part of your ride we refund the full price and collect the bike ourselves.",
  },
  {
    q: "Will it fit my body?",
    a: "Every KONTAKT ONE includes a professional fitting session before delivery. The bike arrives set to your measurements: saddle height, reach, cleat angle, tire pressure for your weight. A follow-up fit at 90 days is included.",
  },
  {
    q: "Does comfortable mean slow?",
    a: "Not since the pros settled it. The average measured tire width at the 2026 Tour de France was 30.3 mm, and wider tires at lower pressure roll just as fast while absorbing what used to reach your body.",
  },
];

export default function KontaktPage() {
  return (
    <div className="k-site min-h-dvh">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center px-5 py-4 md:px-10">
        <a
          className="pointer-events-auto text-lg font-extrabold tracking-[0.22em] text-[var(--k-bone)]"
          href="#one"
        >
          KONTAKT<span className="text-[var(--k-accent)]">.</span>
        </a>
      </header>

      <main>
        <ScrollScrub scenes={SCENES} theme={THEME} />

        <section
          className="border-t border-[var(--k-line)] px-5 py-24 md:px-10 md:py-32"
          id="offer"
        >
          <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="k-mono mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--k-accent)]">
                The Offer
              </p>
              <h2 className="max-w-[14ch] text-5xl font-bold leading-[0.96] tracking-[-0.04em] md:text-6xl">
                If it hurts, it is free.
              </h2>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--k-muted)]">
                Every KONTAKT ONE is delivered fitted, not boxed. Ride it hard
                for a month. If your body still complains, we take the bike
                back and you keep your money.
              </p>

              <dl className="k-mono mt-10 space-y-3 text-sm">
                <div className="flex items-baseline justify-between border-b border-[var(--k-line)] pb-3">
                  <dt className="text-[var(--k-muted)]">
                    Component value, bought separately
                  </dt>
                  <dd className="text-[var(--k-muted)] line-through">$2,760</dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--k-line)] pb-3">
                  <dt className="text-[var(--k-muted)]">Regular price</dt>
                  <dd className="text-[var(--k-muted)] line-through">$2,490</dd>
                </div>
                <div className="flex items-baseline justify-between border-b border-[var(--k-accent)] pb-3">
                  <dt className="font-bold text-[var(--k-bone)]">
                    Launch price, fitted and delivered
                  </dt>
                  <dd className="text-2xl font-bold text-[var(--k-accent)]">
                    $2,190
                  </dd>
                </div>
              </dl>

              <ul className="mt-8 space-y-2 text-base text-[var(--k-muted)]">
                <li>Professional fitting session included, a $220 value</li>
                <li>Follow-up fit at 90 days, included</li>
                <li>One year of tubeless sealant, included</li>
              </ul>

              <OfferCta />
              <p className="k-mono mt-4 text-xs text-[var(--k-muted)]">
                Thirty builds a month. That is our fitting capacity, not a
                countdown.
              </p>
            </div>

            <aside className="h-fit border border-[var(--k-line)] p-8 md:mt-14">
              <p className="k-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--k-accent)]">
                30 Day Comfort Guarantee
              </p>
              <p className="mt-5 text-2xl font-bold leading-snug tracking-[-0.02em]">
                Get fitted. Ride 500 km in 30 days.
              </p>
              <p className="mt-4 leading-relaxed text-[var(--k-muted)]">
                If pain is still part of your ride after that, tell us. We
                refund the full price and collect the bike from your door. No
                forms to argue with, no restocking fee, no partial credit.
              </p>
              <p className="k-mono mt-6 text-xs text-[var(--k-muted)]">
                Applies to every launch build. The fit session is what makes
                this promise possible, so it is not optional.
              </p>
            </aside>
          </div>
        </section>

        <section className="border-t border-[var(--k-line)] px-5 py-24 md:px-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold tracking-[-0.03em] md:text-5xl">
              Asked before reserving
            </h2>
            <dl className="mt-12 divide-y divide-[var(--k-line)]">
              {FAQ.map((item) => (
                <div className="py-8" key={item.q}>
                  <dt className="text-xl font-bold">{item.q}</dt>
                  <dd className="mt-3 max-w-[62ch] leading-relaxed text-[var(--k-muted)]">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--k-line)] px-5 py-12 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-extrabold tracking-[0.22em]">
              KONTAKT<span className="text-[var(--k-accent)]">.</span>
            </p>
            <p className="k-mono mt-3 max-w-[64ch] text-xs leading-relaxed text-[var(--k-muted)]">
              Concept portfolio demonstration. Specifications marked * are
              illustrative. Tire width figure: BikeRadar field measurements,
              Tour de France 2026.
            </p>
          </div>
          <p className="k-mono text-xs text-[var(--k-muted)]">
            © 2026 KONTAKT. All contact points reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
