(function(){
  "use strict";

  /* ---- contact wiring: swap these values ---- */
  var WA_NUMBER = "917620813847"; // +91 7620 813 847 - confirm this line is on WhatsApp
  var WA_TEXT   = "Hello Club 5 Pillars, I would like to enquire about a corporate Relax Like a Monk session for my team.";
  var EMAIL     = "hello@example.com"; // PLACEHOLDER - no email supplied yet
  var EMAIL_SUBJECT = "Corporate enquiry: Relax Like a Monk";

  var waHref = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_TEXT);
  document.querySelectorAll('[data-wa]').forEach(function(a){
    // keep the in-page anchor jump for the masthead link, real WA link everywhere else
    if(a.getAttribute('href') === '#enquire') return;
    a.setAttribute('href', waHref);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
  document.querySelectorAll('[data-email]').forEach(function(a){
    a.setAttribute('href', 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(EMAIL_SUBJECT));
  });

  /* ---- scroll reveal: section headings + their bodies rise in as they enter ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('[data-reveal]');
  if(reduce || !('IntersectionObserver' in window)){
    reveals.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function(el){ io.observe(el); });
  }

  /* ---- breathing pacer ---- */
  var pacer = document.getElementById('pacer');
  var btn = document.getElementById('pacerBtn');
  var phase = document.getElementById('pacerPhase');
  if(pacer && btn && phase && !reduce){
    var running = false, timer = null, t0 = 0;
    var CYCLE = 10000, IN_END = 4000, HOLD_END = 4500;
    function tick(){
      var ms = (Date.now() - t0) % CYCLE;
      var word = ms < IN_END ? 'Breathe in' : (ms < HOLD_END ? 'Hold' : 'Breathe out');
      if(phase.textContent !== word){
        pacer.classList.add('swap');
        setTimeout(function(){ phase.textContent = word; pacer.classList.remove('swap'); }, 200);
      }
    }
    function start(){
      running = true; t0 = Date.now();
      pacer.classList.add('is-running');
      btn.textContent = 'Pause'; btn.setAttribute('aria-pressed', 'true');
      tick(); timer = setInterval(tick, 250);
    }
    function stop(){
      running = false;
      pacer.classList.remove('is-running');
      btn.textContent = 'Begin the practice'; btn.setAttribute('aria-pressed', 'false');
      phase.textContent = 'In 4 · Out 6';
      if(timer){ clearInterval(timer); timer = null; }
    }
    btn.addEventListener('click', function(){ running ? stop() : start(); });
  }

  /* ---- scroll progress bar + cover parallax + stuck masthead (one rAF loop, passive) ---- */
  var bar = document.querySelector('.progress');
  var cover = document.querySelector('.cover');
  var ringwrap = document.querySelector('.cover__ringwrap');
  var mast = document.querySelector('.masthead');
  var mini = document.querySelector('.minicta');
  var miniDismissed = false;
  if(mini){
    mini.hidden = false;
    var mx = mini.querySelector('.minicta__x');
    if(mx) mx.addEventListener('click', function(){ miniDismissed = true; mini.classList.remove('show'); });
  }
  /* ---- back-to-top control (all viewports; most useful on mobile) ---- */
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Scroll back to top');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 12l6-6 6 6"/></svg>';
  toTop.addEventListener('click', function(){
    if(window.__lenis){ window.__lenis.scrollTo(0, { duration: 0.9 }); }
    else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.body.appendChild(toTop);

  /* ---- mobile nav: hamburger opens the link list as a full-bleed
     dropdown, closes on link click / Escape / outside click ---- */
  var navToggle = document.querySelector('.nav-toggle');
  var sitenav = document.getElementById('sitenav');
  if(navToggle && sitenav && mast){
    function closeNav(){
      mast.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      if(window.__lenis) window.__lenis.start();
    }
    function openNav(){
      mast.classList.add('nav-open');
      mast.classList.remove('nav-hidden');
      navToggle.setAttribute('aria-expanded', 'true');
      if(window.__lenis) window.__lenis.stop();
    }
    navToggle.addEventListener('click', function(){
      mast.classList.contains('nav-open') ? closeNav() : openNav();
    });
    sitenav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeNav);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && mast.classList.contains('nav-open')) closeNav();
    });
    document.addEventListener('click', function(e){
      if(!mast.classList.contains('nav-open')) return;
      if(mast.contains(e.target)) return;
      closeNav();
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 640 && mast.classList.contains('nav-open')) closeNav();
    });
  }

  var lastY = window.scrollY || 0;
  var ticking = false;
  function frame(){
    ticking = false;
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    var y = window.scrollY || doc.scrollTop || 0;
    var pv = Math.min(1, y / max).toFixed(4);
    doc.style.setProperty('--p', pv);
    if(mast && !window.__motion) mast.classList.toggle('stuck', y > 8);
    /* hide the nav while scrolling down (past the hero), show it on the way up —
       never while the mobile dropdown is open */
    if(mast && !mast.classList.contains('nav-open')){
      if(y > lastY + 4 && y > 260) mast.classList.add('nav-hidden');
      else if(y < lastY - 4 || y < 120) mast.classList.remove('nav-hidden');
    }
    toTop.classList.toggle('show', y > window.innerHeight * 0.9);
    lastY = y;
    if(mini && !miniDismissed) mini.classList.toggle('show', (y / max) > 0.55 && (y / max) < 0.985);
    if(!reduce && cover && ringwrap){
      var ch = cover.offsetHeight || 1;
      var t = Math.min(1, y / ch);
      ringwrap.style.setProperty('--coverShift', (t * -120).toFixed(1) + 'px');
      ringwrap.style.setProperty('--coverFade', (1 - t * 0.9).toFixed(3));
    }
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();

  /* ---- count up any [data-count] numeral when it scrolls in ---- */
  if(!reduce && 'IntersectionObserver' in window){
    var countIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        countIO.unobserve(e.target);
        var el = e.target, target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = null, dur = 1100;
        el.textContent = '0';
        function step(ts){
          if(start === null) start = ts;
          var k = Math.min(1, (ts - start) / dur);
          el.textContent = Math.round((1 - Math.pow(1 - k, 3)) * target);
          if(k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 1 });
    document.querySelectorAll('[data-count]').forEach(function(el){ countIO.observe(el); });
  }

  /* ---- section rail: track which movement is in view ---- */
  var rail = document.querySelector('.rail');
  if(rail && 'IntersectionObserver' in window){
    var dots = [].slice.call(rail.querySelectorAll('a'));
    var targets = dots.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var railIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        dots.forEach(function(a){ a.removeAttribute('aria-current'); });
        var d = rail.querySelector('a[href="#' + e.target.id + '"]');
        if(d) d.setAttribute('aria-current','true');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    targets.forEach(function(t){ railIO.observe(t); });
  }

  /* ---- seams: gold hairline draws across each ground change ---- */
  var seams = document.querySelectorAll('.seam');
  if(seams.length){
    if(reduce || !('IntersectionObserver' in window)){
      seams.forEach(function(s){ s.classList.add('in'); });
    } else {
      var seamIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); seamIO.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -20% 0px' });
      seams.forEach(function(s){ seamIO.observe(s); });
    }
  }

  /* ---- colonnade: hovering a pillar name lights its column ---- */
  var colo = document.querySelector('.colonnade');
  if(colo && !reduce){
    var cols = colo.querySelectorAll('.stroke g[data-col]');
    colo.querySelectorAll('.colonnade__row div[data-col]').forEach(function(cell){
      var g = colo.querySelector('.stroke g[data-col="' + cell.getAttribute('data-col') + '"]');
      function on(){ colo.classList.add('has-hover'); if(g) g.classList.add('lit'); }
      function off(){ colo.classList.remove('has-hover'); if(g) g.classList.remove('lit'); }
      cell.addEventListener('mouseenter', on);
      cell.addEventListener('mouseleave', off);
      cell.addEventListener('focusin', on);
      cell.addEventListener('focusout', off);
    });
  }
  /* ===== WIDGETS ============================================= */

  /* --- cover: sixty-second try --- */
  (function(){
    var cover = document.querySelector('.cover');
    var btn = document.querySelector('[data-try]');
    var out = document.getElementById('coverCount');
    if(!cover || !btn || !out) return;
    var running = false, tid = null, t0 = 0;
    var CYCLES = 6, CYCLE = 10000, IN_END = 4000, HOLD_END = 4500;
    function fmt(ms){
      var c = Math.floor(ms / CYCLE) + 1;
      var p = ms % CYCLE;
      var phase = p < IN_END ? 'Breathe in' : (p < HOLD_END ? 'Hold' : 'Breathe out');
      return phase + '  ·  round ' + c + ' of ' + CYCLES;
    }
    function tick(){
      var ms = Date.now() - t0;
      if(ms >= CYCLES * CYCLE){ stop(true); return; }
      out.textContent = fmt(ms);
    }
    function start(){
      running = true; t0 = Date.now();
      cover.classList.add('breathing');
      btn.textContent = 'Stop'; btn.setAttribute('aria-pressed','true');
      tick(); tid = setInterval(tick, 250);
    }
    function stop(done){
      running = false; if(tid){ clearInterval(tid); tid = null; }
      cover.classList.remove('breathing');
      btn.textContent = done ? 'Again' : 'Try sixty seconds';
      btn.setAttribute('aria-pressed','false');
      out.textContent = done ? "That is the technique. The session is two hours of it." : ' ';
    }
    btn.addEventListener('click', function(){ running ? stop(false) : start(); });
  })();

  /* --- arc scrubber --- */
  (function(){
    var fig = document.querySelector('[data-arc]');
    if(!fig) return;
    var svg = fig.querySelector('svg');
    var path = fig.querySelector('.curve');
    var marker = fig.querySelector('.marker');
    var now = fig.querySelector('.arc__now') || document.getElementById('arcNow');
    if(!svg || !path || !marker || !now) return;
    var isSleep = /sleep/i.test(document.title);
    var beats = [
      ['0:00','You arrive. Phones down, nothing to solve yet.'],
      ['0:15','You learn to calm the mind on demand: a single move you can make anywhere.'],
      ['0:30','You rehearse it against a hard moment: a demanding client, a deadline, bad news.'],
      ['0:45','Again, and again, until the response is automatic rather than effortful.'],
      ['1:00','Part two begins. You lie back. Nothing is required of you now.'],
      ['1:15','Tension leaves the body one region at a time: jaw, shoulders, chest, hands.'],
      ['1:30','The mind goes quiet. Thoughts arrive slower, and matter less.'],
      ['1:45', isSleep ? 'The relaxation carries all the way down into deep sleep.' : 'Deep rest, the kind the body only reaches when it feels safe.'],
      ['2:00','You return: calm, clear, unhurried. Most people cannot remember the last time they felt it.']
    ];
    var len = path.getTotalLength();
    function set(tp){
      tp = Math.max(0, Math.min(1, tp));
      var pt = path.getPointAtLength(tp * len);
      marker.setAttribute('cx', pt.x.toFixed(1));
      marker.setAttribute('cy', pt.y.toFixed(1));
      var b = beats[Math.round(tp * (beats.length - 1))];
      now.innerHTML = '<time>' + b[0] + '</time>' + b[1];
    }
    function fromEvent(e){
      var r = svg.getBoundingClientRect();
      var x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width;
      set((x - 18/720) / ((702-18)/720));
    }
    var dragging = false;
    svg.addEventListener('pointerdown', function(e){ dragging = true; svg.setPointerCapture(e.pointerId); fromEvent(e); });
    svg.addEventListener('pointermove', function(e){ if(dragging) fromEvent(e); });
    svg.addEventListener('pointerup', function(){ dragging = false; });
    svg.addEventListener('pointercancel', function(){ dragging = false; });
    // reveal at start position, first beat already in markup
    set(0);
  })();

  /* --- scenario chips --- */
  (function(){
    var wrap = document.querySelector('.chips');
    var ans = document.getElementById('chipsAns');
    if(!wrap || !ans) return;
    wrap.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        var pressed = b.getAttribute('aria-pressed') === 'true';
        wrap.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
        if(!pressed){ b.setAttribute('aria-pressed','true'); ans.textContent = b.getAttribute('data-ans'); }
        else{ ans.textContent = 'Pick a moment. The same technique works in all of them.'; }
      });
    });
  })();

  /* --- 24-hour dial --- */
  (function(){
    var dial = document.querySelector('.dial');
    if(!dial) return;
    var nodes = dial.querySelectorAll('.node');
    var items = dial.querySelectorAll('.dial__list li');
    function pick(i){
      nodes.forEach(function(n){ n.classList.toggle('on', n.getAttribute('data-i') == i); });
      items.forEach(function(li){ li.classList.toggle('on', li.getAttribute('data-i') == i); });
    }
    nodes.forEach(function(n){ n.addEventListener('mouseenter', function(){ pick(n.getAttribute('data-i')); }); n.addEventListener('click', function(){ pick(n.getAttribute('data-i')); }); });
    items.forEach(function(li){ li.addEventListener('mouseenter', function(){ pick(li.getAttribute('data-i')); }); li.addEventListener('click', function(){ pick(li.getAttribute('data-i')); }); });
  })();

  /* --- cost calculator --- */
  (function(){
    var box = document.querySelector('[data-calc]');
    if(!box) return;
    function inr(n){
      n = Math.round(n);
      var s = String(n), last3 = s.slice(-3), rest = s.slice(0, -3);
      if(rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',';
      return '₹' + rest + last3;
    }
    var team = box.querySelector('[name=team]'), sal = box.querySelector('[name=sal]'), hrs = box.querySelector('[name=hrs]');
    function calc(){
      var t = +team.value, sv = +sal.value, h = +hrs.value;
      var hourly = sv / 46 / 40;
      var total = hourly * h * 46 * t;
      box.querySelector('[data-out=team]').textContent = t;
      box.querySelector('[data-out=sal]').textContent = inr(sv);
      box.querySelector('[data-out=hrs]').textContent = h;
      box.querySelector('[data-out=total]').textContent = inr(total);
    }
    [team, sal, hrs].forEach(function(el){ el.addEventListener('input', calc); });
    calc();
  })();

  /* --- sleep-debt bar --- */
  (function(){
    var box = document.querySelector('[data-debt]');
    if(!box) return;
    var slept = box.querySelector('[name=slept]');
    function calc(){
      var s = +slept.value, need = 8;
      var deficitPerNight = Math.max(0, need - s);
      var week = deficitPerNight * 7;
      box.querySelector('[data-out=slept]').textContent = s;
      box.querySelector('[data-out=fill]').style.width = Math.min(100, (deficitPerNight / 4) * 100) + '%';
      box.querySelector('[data-out=cap]').textContent = week === 0
        ? 'No debt this week. Rare, and worth protecting.'
        : week.toFixed(1) + ' hours of sleep owed by Friday: a full night and then some.';
    }
    slept.addEventListener('input', calc);
    calc();
  })();

  /* --- founder storyboard: active scene tracking --- */
  (function(){
    var sb = document.querySelector('[data-sb]');
    if(!sb || !('IntersectionObserver' in window)) return;
    var scenes = [].slice.call(sb.querySelectorAll('.sb__scene'));
    var meta = sb.querySelector('[data-scene-out]');
    function setActive(el){
      scenes.forEach(function(s){ s.classList.toggle('is-active', s === el); });
      var n = +el.getAttribute('data-scene');
      if(meta) meta.textContent = ('0' + n).slice(-2);
      sb.classList.toggle('sb--turned', n >= 3);
    }
    setActive(scenes[0]);
    var sbIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) setActive(e.target); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    scenes.forEach(function(s){ sbIO.observe(s); });
  })();

  /* --- body map: before / after --- */
  (function(){
    var bm = document.querySelector('.bodymap');
    if(!bm) return;
    var cap = bm.querySelector('.bodymap__cap');
    var texts = {
      before: cap ? cap.textContent : '',
      after: 'Released, one region at a time. The jaw softens, the shoulders drop, the breath reaches the belly. Most people cannot recall the last time they felt this.'
    };
    bm.querySelectorAll('.bodymap__toggle button').forEach(function(b){
      b.addEventListener('click', function(){
        var st = b.getAttribute('data-state');
        bm.querySelectorAll('.bodymap__toggle button').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        bm.classList.toggle('released', st === 'after');
        if(cap) cap.textContent = texts[st];
      });
    });
  })();

  /* --- five pillars expand --- */
  (function(){
    var colo = document.querySelector('.colonnade');
    if(!colo) return;
    var panel = null, openCell = null;
    colo.querySelectorAll('.colonnade__row div[data-panel]').forEach(function(cell){
      function toggle(){
        if(openCell === cell){
          if(panel) panel.remove(); panel = null;
          cell.setAttribute('aria-expanded','false'); openCell = null; return;
        }
        colo.querySelectorAll('[data-panel]').forEach(function(c){ c.setAttribute('aria-expanded','false'); });
        if(panel) panel.remove();
        panel = document.createElement('div');
        panel.className = 'pillar-panel';
        panel.innerHTML = '<h3>' + cell.getAttribute('data-panel-title') + '</h3><p>' + cell.getAttribute('data-panel') + '</p>';
        colo.appendChild(panel);
        cell.setAttribute('aria-expanded','true'); openCell = cell;
      }
      cell.addEventListener('click', toggle);
      cell.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
    });
  })();

})();
