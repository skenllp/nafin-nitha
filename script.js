/* ==========================================================
   Nafis & Nitha — Nikah & Reception Invitation
   Envelope opening · music · countdown · calendar · reveals
   ========================================================== */
(() => {
  'use strict';

  /* ---------- Configuration (edit here) ---------- */
  const CONFIG = {
    eventStart: '2026-12-20T11:30:00+05:30',     // Asia/Kolkata (IST)
    eventEnd: '2026-12-20T15:30:00+05:30',
    title: 'Nikah & Reception of Nafis Rehim & Dr. Nitha Subair',
    location: 'Valencia Gallery, Markaz Knowledge City, Kaithapoyil, Adivaram',
    description: 'Nikah & Reception ceremony of Nafis Rehim & Dr. Nitha Subair. Directions: https://maps.app.goo.gl/RMgZuZKRfiQbfHcw8',
    musicVolume: 0.45,
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Music ---------- */
  function initMusic() {
    const audio = $('#bgm');
    const btn = $('#music-toggle');
    if (!audio || !btn) return { start() {} };
    let fade = null, wantPlaying = false, hiddenPause = false;

    const render = () => {
      const on = wantPlaying && !audio.paused;
      btn.classList.toggle('is-playing', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Mute music' : 'Play music');
    };
    function fadeTo(target, ms, done) {
      window.clearInterval(fade);
      const from = audio.volume, steps = Math.max(1, Math.round(ms / 50)); let i = 0;
      fade = window.setInterval(() => {
        i++; audio.volume = Math.min(1, Math.max(0, from + (target - from) * (i / steps)));
        if (i >= steps) { window.clearInterval(fade); if (done) done(); }
      }, 50);
    }
    function play() {
      wantPlaying = true; audio.volume = 0;
      const p = audio.play();
      const ok = () => { fadeTo(CONFIG.musicVolume, 2200); render(); };
      if (p && p.then) p.then(ok).catch(() => { wantPlaying = false; render(); }); else ok();
    }
    function mute() { wantPlaying = false; fadeTo(0, 700, () => { audio.pause(); render(); }); render(); }

    btn.addEventListener('click', () => { hiddenPause = false; (wantPlaying && !audio.paused) ? mute() : play(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (wantPlaying && !audio.paused) { hiddenPause = true; window.clearInterval(fade); audio.pause(); }
      } else if (hiddenPause) {
        hiddenPause = false; audio.volume = 0; audio.play().then(() => fadeTo(CONFIG.musicVolume, 1500)).catch(render);
      }
      render();
    });
    audio.addEventListener('pause', render); audio.addEventListener('play', render);
    render();
    return { start: play };
  }

  /* ---------- Envelope ---------- */
  function initOpening(music) {
    const root = document.documentElement;
    const opening = $('#opening'), seal = $('#open-btn'), main = $('#invitation');
    if (!opening || !seal || !main) return;
    main.inert = true;
    let busy = false;
    const finish = () => {
      root.classList.add('is-open'); root.classList.remove('is-locked');
      main.inert = false; window.scrollTo(0, 0); main.focus({ preventScroll: true });
      initReveal();
      window.setTimeout(() => { opening.hidden = true; }, reduced.matches ? 50 : 1500);
    };
    seal.addEventListener('click', () => {
      if (busy) return; busy = true;
      seal.disabled = true;
      music.start();                       // inside the tap, so browsers allow playback
      if (reduced.matches) { finish(); return; }
      root.classList.add('is-unfolding');                          // flap hinges open
      window.setTimeout(() => root.classList.add('is-washing'), 1500);  // seal fades, pale wash rises
      window.setTimeout(finish, 2250);                                   // wash dissolves into the hero
    }, { once: true });
  }

  /* ---------- Scroll reveals + parallax ---------- */
  function initReveal() {
    const items = $$('.reveal'), panels = $$('.panel');
    if (!('IntersectionObserver' in window) || reduced.matches) {
      items.forEach((e) => e.classList.add('is-visible')); panels.forEach((p) => p.classList.add('is-in')); return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach((e) => io.observe(e));
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); pio.unobserve(en.target); } });
    }, { threshold: 0.15 });
    panels.forEach((p) => pio.observe(p));

    // minimal parallax
    const px = $$('[data-parallax]');
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      px.forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0;
        if (k > 0) el.style.setProperty('--py', Math.min(y, 800) * k + 'px');
        else { const r = el.getBoundingClientRect(); el.style.setProperty('--py', ((r.top - innerHeight) * k).toFixed(1) + 'px'); }
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    const target = new Date(CONFIG.eventStart).getTime();
    const grid = $('#countdown'), done = $('#countdown-done');
    if (!grid || !done || Number.isNaN(target)) return;
    const u = { days: $('[data-unit="days"]'), hours: $('[data-unit="hours"]'), minutes: $('[data-unit="minutes"]'), seconds: $('[data-unit="seconds"]') };
    const pad = (n) => String(n).padStart(2, '0');
    let timer;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { grid.hidden = true; done.hidden = false; window.clearInterval(timer); return; }
      const s = Math.floor(diff / 1000);
      u.days.textContent = pad(Math.floor(s / 86400));
      u.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      u.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      u.seconds.textContent = pad(s % 60);
    };
    tick(); timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }

  /* ---------- Add to calendar (.ics) ---------- */
  function initCalendar() {
    const btn = $('#calendar-btn');
    if (!btn) return;
    const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    btn.addEventListener('click', () => {
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nikkah Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:nikah-nafis-nitha-${utc(CONFIG.eventStart)}@invitation`,
        `DTSTAMP:${utc(new Date().toISOString())}`,
        `DTSTART:${utc(CONFIG.eventStart)}`,
        `DTEND:${utc(CONFIG.eventEnd)}`,
        `SUMMARY:${esc(CONFIG.title)}`,
        `LOCATION:${esc(CONFIG.location)}`,
        `DESCRIPTION:${esc(CONFIG.description)}`,
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'nafis-nitha-nikah-reception.ics';
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    });
  }

  initOpening(initMusic());
  initCountdown();
  initCalendar();
})();
