(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const formNext = document.getElementById("form-next");
  if (formNext) {
    formNext.value = `${window.location.origin}${window.location.pathname}#join`;
  }

  // Header scroll state
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Cursor glow
  const glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    let mx = 0;
    let my = 0;
    let gx = 0;
    let gy = 0;
    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );
    const tickGlow = () => {
      gx += (mx - gx) * 0.12;
      gy += (my - gy) * 0.12;
      glow.style.left = `${gx}px`;
      glow.style.top = `${gy}px`;
      requestAnimationFrame(tickGlow);
    };
    tickGlow();
  }

  // Scroll hint
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.getAttribute("data-scroll"));
      target?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Reveal on scroll (hero content animates in immediately)
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
    const delay = el.getAttribute("data-delay");
    if (delay) el.style.setProperty("--delay", `${delay}s`);
    if (el.closest(".hero")) el.classList.add("in");
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    reveals.forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Typewriter
  const typeEl = document.querySelector(".typewriter");
  if (typeEl) {
    const full = typeEl.getAttribute("data-text") || "";
    typeEl.textContent = "";
    const startDelay = Number(typeEl.getAttribute("data-delay") || 0) * 1000 + 200;
    let i = 0;
    const type = () => {
      if (i <= full.length) {
        typeEl.textContent = full.slice(0, i);
        i += 1;
        window.setTimeout(type, 42 + Math.random() * 28);
      }
    };
    window.setTimeout(() => {
      typeEl.classList.add("in");
      type();
    }, startDelay);
  }

  // Hero neural particle field
  const canvas = document.getElementById("hero-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let nodes = [];
    let t = 0;
    let mouse = { x: 0.72, y: 0.42 };
    let running = true;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };

    const spawn = () => {
      const count = Math.floor(Math.min(120, Math.max(55, (w * h) / 14000)));
      nodes = Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.18 + Math.random() * 0.32;
        return {
          angle,
          radius,
          speed: 0.0015 + Math.random() * 0.0025,
          size: 1.2 + Math.random() * 2.2,
          z: Math.random(),
          pulse: Math.random() * Math.PI * 2,
          cx: 0.68 + (Math.random() - 0.5) * 0.08,
          cy: 0.45 + (Math.random() - 0.5) * 0.08,
          ring: i % 4,
        };
      });
    };

    const project = (n) => {
      const sway = Math.sin(t * 0.6 + n.pulse) * 0.015;
      const rx = n.radius + sway;
      const x = n.cx + Math.cos(n.angle) * rx * (h / w) * 1.35;
      const y = n.cy + Math.sin(n.angle) * rx * 0.92 + Math.cos(t * 0.4 + n.z) * 0.01;
      const depth = 0.55 + n.z * 0.45;
      return { x: x * w, y: y * h, depth };
    };

    const draw = () => {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // Soft orbital rings
      const ox = w * (0.68 + (mouse.x - 0.5) * 0.02);
      const oy = h * (0.45 + (mouse.y - 0.5) * 0.02);
      for (let r = 0; r < 4; r += 1) {
        const radius = Math.min(w, h) * (0.12 + r * 0.07);
        ctx.beginPath();
        ctx.ellipse(ox, oy, radius * 1.15, radius * 0.78, Math.sin(t * 0.002 + r) * 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(20, 18, 16, ${0.05 + r * 0.015})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const pts = nodes.map((n) => {
        n.angle += n.speed * (0.7 + n.ring * 0.15);
        return { n, p: project(n) };
      });

      // Connections
      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const a = pts[i].p;
          const b = pts[j].p;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.22 * Math.min(a.depth, b.depth);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(196, 18, 48, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Nodes
      pts.forEach(({ n, p }) => {
        const pulse = 0.65 + Math.sin(t * 0.04 + n.pulse) * 0.35;
        const r = n.size * p.depth * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        const isAccent = n.ring === 1;
        ctx.fillStyle = isAccent
          ? `rgba(196, 18, 48, ${0.55 + p.depth * 0.35})`
          : `rgba(20, 18, 16, ${0.35 + p.depth * 0.45})`;
        ctx.fill();
      });

      // Scanning beam
      const beamY = ((t * 0.7) % (h + 120)) - 60;
      const grad = ctx.createLinearGradient(0, beamY - 40, 0, beamY + 40);
      grad.addColorStop(0, "rgba(196, 18, 48, 0)");
      grad.addColorStop(0.5, "rgba(196, 18, 48, 0.08)");
      grad.addColorStop(1, "rgba(196, 18, 48, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(w * 0.35, beamY - 40, w * 0.65, 80);

      requestAnimationFrame(draw);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) draw();
    });

    resize();
    window.addEventListener("resize", resize);
    draw();
  }

  // Avatar micro-network
  const avatarCanvas = document.getElementById("avatar-canvas");
  if (avatarCanvas) {
    const ctx = avatarCanvas.getContext("2d");
    const size = 140;
    avatarCanvas.width = size * 2;
    avatarCanvas.height = size * 2;
    ctx.scale(2, 2);
    const dots = Array.from({ length: 18 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 28 + Math.random() * 28,
      s: 0.01 + Math.random() * 0.02,
    }));
    let frame = 0;
    const render = () => {
      frame += 1;
      ctx.clearRect(0, 0, size, size);
      const cx = 70;
      const cy = 70;
      const pts = dots.map((d) => {
        d.a += d.s;
        return { x: cx + Math.cos(d.a) * d.r, y: cy + Math.sin(d.a) * d.r * 0.85 };
      });
      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 42) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 42) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx % 3 === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
        ctx.fillStyle = idx % 3 === 0 ? "#c41230" : "rgba(255,255,255,0.85)";
        ctx.fill();
      });
      requestAnimationFrame(render);
    };
    render();
  }

  // Form UX: mark success hash if returned
  if (window.location.hash === "#join") {
    const panel = document.querySelector(".join-panel");
    panel?.classList.add("reveal", "in");
  }
})();
