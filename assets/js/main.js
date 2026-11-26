// UDKAM Flagship Motion & Interaction Engine — Tailwind + GSAP 3 + ScrollTrigger + Lenis
document.addEventListener("DOMContentLoaded", () => {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector("header.site-header");
  const navInner = document.querySelector(".nav-inner");
  const mobileBtn = document.querySelector(".mobile-btn");
  const mainNav = document.querySelector("nav.main-nav");

  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener("click", () => {
      const isHidden = mainNav.classList.toggle("hidden");
      mainNav.classList.toggle("flex", !isHidden);
      mobileBtn.setAttribute("aria-expanded", String(!isHidden));
    });
  }

  // 1. Unified Sticky Header Bar when scrolled (scrollY > 24)
  const updateNavbarState = (scrollY) => {
    if (!header || !navInner) return;
    const isScrolled = scrollY > 24;
    header.classList.toggle("is-scrolled", isScrolled);
    header.classList.toggle("bg-transparent", !isScrolled);
    header.classList.toggle("pointer-events-none", !isScrolled);
    header.classList.toggle("bg-white/95", isScrolled);
    header.classList.toggle("backdrop-blur-lg", isScrolled);
    header.classList.toggle("border-b", isScrolled);
    header.classList.toggle("border-slate-200/80", isScrolled);
    header.classList.toggle("shadow-md", isScrolled);
    header.classList.toggle("pointer-events-auto", isScrolled);
    navInner.classList.toggle("h-20", !isScrolled);
    navInner.classList.toggle("h-16", isScrolled);
  };
  updateNavbarState(window.scrollY);

  // Active nav indicator syncing for hash links (#projects, #contact)
  const setActiveNavByHash = (hash) => {
    if (!mainNav) return;
    const navLinks = mainNav.querySelectorAll("a[href]");
    let matchedHashLink = null;
    if (hash === "#projects" || hash === "#contact") {
      navLinks.forEach((a) => {
        if (a.getAttribute("href").endsWith(hash)) matchedHashLink = a;
      });
    }
    if (!matchedHashLink) return;

    navLinks.forEach((a) => {
      if (a.closest(".drop-panel")) return;
      a.classList.remove("relative", "inline-flex", "flex-col", "items-center", "font-semibold", "text-navy");
      a.classList.add("font-medium", "text-navy/70");
      a.querySelector(".nav-dot")?.remove();
    });

    matchedHashLink.classList.remove("font-medium", "text-navy/70");
    matchedHashLink.classList.add("relative", "inline-flex", "flex-col", "items-center", "font-semibold", "text-navy");
    if (!matchedHashLink.querySelector(".nav-dot")) {
      const dot = document.createElement("span");
      dot.className = "nav-dot w-1.5 h-1.5 rounded-full bg-[#F27121] shadow-[0_0_8px_rgba(242,113,33,0.75)] mt-0.5 md:absolute md:-bottom-2";
      matchedHashLink.appendChild(dot);
    }
  };

  // Mark existing active dot cleanly so JS can toggle it
  if (mainNav) {
    mainNav.querySelectorAll("a span.rounded-full").forEach((s) => s.classList.add("nav-dot"));
    mainNav.querySelectorAll('a[href*="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        const idx = a.getAttribute("href").indexOf("#");
        if (idx !== -1) setActiveNavByHash(a.getAttribute("href").slice(idx));
      });
    });
  }

  let lenis = null;
  const hasGSAP =
    typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  const revealTargetSectionImmediate = (hash) => {
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    const cards = target.querySelectorAll(".reveal-card");
    if (hasGSAP && cards.length) {
      window.gsap.set(cards, { opacity: 1, y: 0, clearProps: "transform,opacity" });
    }
  };

  if (!prefersReduced && hasGSAP) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof window.SplitText !== "undefined") {
      gsap.registerPlugin(window.SplitText);
    }

    // Lenis smooth inertial scrolling synced to GSAP ticker & ScrollTrigger
    if (typeof window.Lenis !== "undefined") {
      lenis = new window.Lenis({
        duration: 1.05,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4
      });

      lenis.on("scroll", ({ scroll }) => {
        ScrollTrigger.update();
        updateNavbarState(scroll);
      });

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      window.addEventListener("scroll", () => updateNavbarState(window.scrollY), {
        passive: true
      });
    }

    // Smooth anchor scroll + instant reveal on target section
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const hash = anchor.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (target) {
          revealTargetSectionImmediate(hash);
          setActiveNavByHash(hash);
          if (lenis) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -96, duration: 0.95 });
          }
          ScrollTrigger.refresh();
        }
      });
    });

    // Hero Load Choreography — ONLY run opacity/line entrance on homepage full-bleed hero
    // Inner page heroes stay opacity: 1 immediately to prevent any above-the-fold ghosting
    const isHomeHero = Boolean(document.querySelector(".hero-skyline-img"));
    const initHomeHero = () => {
      if (!isHomeHero) return;
      const heroBadge = document.querySelector(".hero-badge");
      const heroH1 = document.querySelector(".hero-title");
      const heroLead = document.querySelector(".hero-subcopy");
      const heroCtas = document.querySelector(".hero-ctas");
      const heroSkyImg = document.querySelector(".hero-skyline-img");

      if (heroBadge) {
        gsap.from(heroBadge, {
          y: 16,
          opacity: 0,
          duration: 0.55,
          ease: "power3.out",
          clearProps: "transform,opacity"
        });
      }

      if (heroH1 && typeof window.SplitText !== "undefined") {
        let done = false;
        window.SplitText.create(heroH1, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            if (done || !self.lines.length) return;
            done = true;
            return gsap.from(self.lines, {
              y: 36,
              opacity: 0,
              duration: 0.78,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "transform,opacity"
            });
          }
        });
      } else if (heroH1) {
        gsap.from(heroH1, {
          y: 32,
          opacity: 0,
          duration: 0.78,
          ease: "power3.out",
          clearProps: "transform,opacity"
        });
      }

      const followUps = [heroLead, heroCtas].filter(Boolean);
      if (followUps.length) {
        gsap.from(followUps, {
          y: 18,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          delay: 0.16,
          ease: "power3.out",
          clearProps: "transform,opacity"
        });
      }

      if (heroSkyImg) {
        gsap.fromTo(
          heroSkyImg,
          { scale: 1.07, transformOrigin: "center bottom" },
          {
            scale: 1.03,
            duration: 1.0,
            ease: "power3.out",
            onComplete() {
              gsap.fromTo(
                heroSkyImg,
                { yPercent: 0, scale: 1.06 },
                {
                  yPercent: 6,
                  scale: 1.06,
                  ease: "none",
                  scrollTrigger: {
                    trigger: heroSkyImg.parentElement,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.45,
                    invalidateOnRefresh: true
                  }
                }
              );
            }
          }
        );
      }
    };

    if (isHomeHero) {
      if (document.fonts && document.fonts.ready) {
        Promise.race([
          document.fonts.ready,
          new Promise((resolve) => window.setTimeout(resolve, 300))
        ]).then(initHomeHero);
      } else {
        initHomeHero();
      }
    }

    // Parallax on Why-Choose tower cutout & inner page hero media
    document.querySelectorAll(".parallax-tower, .page-hero-img").forEach((img) => {
      gsap.fromTo(
        img,
        { yPercent: -3 },
        {
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.45,
            invalidateOnRefresh: true
          }
        }
      );
    });

    // 3. KPI Counters trigger automatically 0.4s after page load (no scroll wait)
    const kpiBar = document.querySelector(".kpi-bar");
    if (kpiBar) {
      document.querySelectorAll("[data-count-to]").forEach((el) => {
        const target = Number(el.getAttribute("data-count-to"));
        const suffix = el.getAttribute("data-count-suffix") || "";
        if (!Number.isFinite(target)) return;
        const state = { val: 0 };
        gsap.to(state, {
          val: target,
          duration: 1.1,
          delay: 0.4,
          ease: "power3.out",
          onUpdate() {
            el.textContent = Math.round(state.val) + suffix;
          }
        });
      });
    }

    // Tightened ScrollTrigger Reveals (start: "top 98%", duration: 0.35, y: 16, opacity: 0.25 -> 1)
    const staggerEls = gsap.utils.toArray(".reveal-card");
    if (staggerEls.length) {
      gsap.set(staggerEls, { y: 16, opacity: 0.25 });
      ScrollTrigger.batch(staggerEls, {
        interval: 0.04,
        batchMax: 6,
        start: "top 98%",
        once: true,
        onEnter(batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.35,
            stagger: 0.05,
            ease: "power3.out",
            overwrite: "auto",
            clearProps: "transform,opacity"
          });
        }
      });
    }

    const handleHashSync = () => {
      if (window.location.hash) {
        revealTargetSectionImmediate(window.location.hash);
        setActiveNavByHash(window.location.hash);
      }
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", handleHashSync);
    window.addEventListener("hashchange", handleHashSync);
    handleHashSync();
  } else {
    window.addEventListener("scroll", () => updateNavbarState(window.scrollY), {
      passive: true
    });
    if (window.location.hash) setActiveNavByHash(window.location.hash);
    window.addEventListener("hashchange", () => setActiveNavByHash(window.location.hash));
  }

  // Partner strip marquee clone
  document.querySelectorAll(".marquee-viewport").forEach((vp) => {
    const track = vp.querySelector(".marquee-track");
    const firstSet = track?.querySelector(".marquee-set");
    if (!track || !firstSet) return;
    const clone = firstSet.cloneNode(true);
    clone.classList.add("marquee-clone");
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  // Slide-over Technical RFQ Drawer
  const backdrop = document.getElementById("rfq-backdrop");
  const drawer = document.getElementById("rfq-drawer");
  const openBtns = document.querySelectorAll("[data-open-rfq]");
  const closeBtn = document.getElementById("rfq-close");
  const divSelect = document.getElementById("rfq-division");

  const openDrawer = (preset) => {
    if (preset && divSelect) divSelect.value = preset;
    if (backdrop) backdrop.classList.add("open");
    if (drawer) drawer.classList.add("open");
    if (lenis) lenis.stop();
    if (closeBtn) closeBtn.focus();
  };
  const closeDrawer = () => {
    if (backdrop) backdrop.classList.remove("open");
    if (drawer) drawer.classList.remove("open");
    if (lenis) lenis.start();
  };

  openBtns.forEach((b) =>
    b.addEventListener("click", () => openDrawer(b.getAttribute("data-open-rfq")))
  );
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // RFQ & Contact Form Submit
  document.querySelectorAll("form.udkam-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = form.querySelector(".form-msg");
      const name = form.querySelector("[name='name']")?.value.trim() || "Engineer";
      if (msg) {
        msg.textContent = `Thank you, ${name}. Your technical RFQ payload is validated locally. Connect this form to sales@udkam.com or your backend API on deployment.`;
        msg.classList.remove("hidden");
      }
      form.reset();
    });
  });

  // Filter buttons (Divisions / Clients)
  document.querySelectorAll("[data-filter-group]").forEach((bar) => {
    const group = bar.getAttribute("data-filter-group");
    const items = Array.from(document.querySelectorAll(`[data-filter-item='${group}']`));
    const countLabel = document.querySelector(`[data-filter-count='${group}']`);

    const updateCount = (n) => {
      if (countLabel) countLabel.textContent = `SHOWING ${n} OF ${items.length}`;
    };
    updateCount(items.length);

    bar.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bar.querySelectorAll(".filter-btn").forEach((b) => {
          b.classList.remove("bg-orange", "text-white", "border-orange");
          b.classList.add("bg-white", "text-navy", "border-slate-200");
        });
        btn.classList.add("bg-orange", "text-white", "border-orange");
        btn.classList.remove("bg-white", "text-navy", "border-slate-200");

        const val = btn.getAttribute("data-filter");
        const shown = [];
        items.forEach((it) => {
          const match = val === "all" || it.getAttribute("data-cat") === val;
          it.style.display = match ? "" : "none";
          if (match) shown.push(it);
        });
        updateCount(shown.length);

        if (!prefersReduced && hasGSAP) {
          window.gsap.fromTo(
            shown,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.38,
              stagger: { amount: 0.14 },
              ease: "power3.out",
              overwrite: "auto",
              clearProps: "transform,opacity"
            }
          );
          window.ScrollTrigger.refresh();
        }
      });
    });
  });

  // Certificate Lightbox
  const lb = document.getElementById("cert-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  const lbClose = document.getElementById("lb-close");

  const closeLightbox = () => {
    if (!lb) return;
    lb.classList.remove("open");
    if (lenis) lenis.start();
  };

  document.querySelectorAll("[data-lightbox-src]").forEach((card) => {
    card.addEventListener("click", () => {
      if (lb && lbImg && lbCap) {
        lbImg.src = card.getAttribute("data-lightbox-src");
        lbCap.textContent = card.getAttribute("data-lightbox-title") || "";
        lb.classList.add("open");
        if (lenis) lenis.stop();
        if (lbClose) lbClose.focus();
      }
    });
  });
  if (lb) {
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.id === "lb-close") closeLightbox();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lb && lb.classList.contains("open")) closeLightbox();
      if (drawer && drawer.classList.contains("open")) closeDrawer();
    }
  });
});
