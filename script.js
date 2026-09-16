/* ============================================================
   ST. THOMAS AQUINAS SEMINARY — SITE SCRIPT
   Loaded with <script src="script.js" defer></script>
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     0. HEADER HEIGHT → CSS VARIABLE
     ============================================================ */
  var header = document.querySelector('.site-header');

  function syncHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--hdr', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('orientationchange', syncHeaderHeight);
  window.addEventListener('load', syncHeaderHeight);
  if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);

  /* ============================================================
     1. MOBILE NAV
     ============================================================ */
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    syncHeaderHeight();
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      syncHeaderHeight();
    }
  });

  /* ============================================================
     2. CAROUSEL
     ============================================================ */
  (function () {
    var carousel = document.getElementById('carousel');
    if (!carousel) return;

    var slides   = [].slice.call(carousel.querySelectorAll('.slide'));
    var dotsWrap = carousel.querySelector('.carousel-dots');
    var prevBtn  = carousel.querySelector('.carousel-prev');
    var nextBtn  = carousel.querySelector('.carousel-next');
    var playBtn  = carousel.querySelector('.carousel-playpause');

    if (slides.length < 2) {
      [prevBtn, nextBtn, playBtn].forEach(function (b) { if (b) b.hidden = true; });
      return;
    }

    var DELAY = 7000, index = 0, timer = null, cleanup = null, playing = false;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot';
      b.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { goTo(i); reset(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function sync() {
      slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-current', i === index);
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function goTo(n, dir) {
      n = ((n % slides.length) + slides.length) % slides.length;
      if (n === index) return;
      var forward = (typeof dir === 'number') ? dir > 0 : n > index;
      var prev = slides[index], next = slides[n];

      next.classList.remove('is-exit-left', 'is-exit-right');
      next.classList.toggle('from-left', !forward);
      void next.offsetWidth;

      prev.classList.remove('is-active');
      prev.classList.add(forward ? 'is-exit-left' : 'is-exit-right');
      next.classList.add('is-active');

      index = n;
      sync();

      clearTimeout(cleanup);
      cleanup = setTimeout(function () {
        slides.forEach(function (s) {
          s.classList.remove('is-exit-left', 'is-exit-right', 'from-left');
        });
      }, 700);
    }

    function clearT() { clearInterval(timer); timer = null; }
    function reset() {
      clearT();
      if (playing) timer = setInterval(function () { goTo(index + 1, 1); }, DELAY);
    }
    function play() {
      playing = true;
      playBtn.textContent = 'Pause';
      playBtn.setAttribute('aria-label', 'Pause slideshow');
      reset();
    }
    function pause() {
      playing = false;
      clearT();
      playBtn.textContent = 'Play';
      playBtn.setAttribute('aria-label', 'Play slideshow');
    }

    playBtn.addEventListener('click', function () { playing ? pause() : play(); });
    prevBtn.addEventListener('click', function () { goTo(index - 1, -1); reset(); });
    nextBtn.addEventListener('click', function () { goTo(index + 1, 1); reset(); });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1, -1); reset(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, 1); reset(); }
    });

    carousel.addEventListener('mouseenter', clearT);
    carousel.addEventListener('mouseleave', function () { if (playing) reset(); });
    carousel.addEventListener('focusin', clearT);
    carousel.addEventListener('focusout', function (e) {
      if (playing && !carousel.contains(e.relatedTarget)) reset();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearT(); else if (playing) reset();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { if (playing) reset(); } else clearT();
      }, { threshold: 0.25 }).observe(carousel);
    }

    sync();
    if (reduceMotion) { pause(); playBtn.hidden = true; } else { play(); }
  })();

  /* ============================================================
     3. ACCESSIBLE TABS (mouse click activates)
     ============================================================ */
  function setupTabs(tablist, onActivate) {
    var tabs = [].slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return null;
    var panel = document.getElementById(tabs[0].getAttribute('aria-controls'));

    function activate(tab, moveFocus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (panel) panel.setAttribute('aria-labelledby', tab.id);
      if (moveFocus) tab.focus();
      if (onActivate) onActivate(tab, panel);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1
                 : (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  ? -1 : 0;
        if (step) { e.preventDefault(); activate(tabs[(i + step + tabs.length) % tabs.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); activate(tabs[0], true); }
        else if (e.key === 'End')  { e.preventDefault(); activate(tabs[tabs.length - 1], true); }
      });
    });

    return { activate: activate, tabs: tabs, panel: panel };
  }

  /* ---------- ADMINISTRATION (4 offices) ---------- */
  var adminData = {
    'rector': {
      name: 'Very Rev. Fr. Vincent Simba',
      role: 'Rector',
      img: 'https://picsum.photos/seed/rector/400/400',
      bio: 'The Rector leads the seminary community, oversees all four dimensions of formation, and represents the institution before the sponsoring dioceses and the Episcopal Conference.'
    },
    'dean-of-students': {
      name: 'Rev. Fr. Charles Oloo',
      role: 'Dean of Students',
      img: 'https://picsum.photos/seed/deanstudents/400/400',
      bio: 'The Dean of Students accompanies seminarians in discipline, welfare, health and the practical arrangements of community life.'
    },
    'dean-of-studies': {
      name: 'Rev. Fr. Joseph Nkalami',
      role: 'Dean of Studies',
      img: 'https://picsum.photos/seed/deanstudies/400/400',
      bio: 'The Dean of Studies coordinates the academic programme, the faculty, examinations, library provision and the intellectual formation of the students.'
    },
    
    'spiritual': {
      name: 'Rev. Fr. P. Y. Kiprop',
      role: 'Spiritual Director',
      img: 'https://picsum.photos/seed/spiritual/400/400',
      bio: 'The Spiritual Director oversees the spiritual formation of the community, coordinates spiritual directors, retreats and days of recollection.'
    }
  };

  var adminTablist = document.querySelector('#administration [role="tablist"]');
  if (adminTablist) {
    var adminTabs = setupTabs(adminTablist, function (tab, panel) {
      var d = adminData[tab.dataset.office] || {
        name: tab.textContent.trim(), role: tab.textContent.trim(),
        img: 'https://picsum.photos/seed/office/400/400',
        bio: 'Information about this office will be displayed here.'
      };
      panel.innerHTML =
        '<div class="admin-profile">' +
          '<img class="round-img" src="' + d.img + '" alt="' + d.name + ', ' + d.role + '" width="400" height="400" loading="lazy" decoding="async">' +
          '<div class="bio">' +
            '<h2>' + d.name + '</h2>' +
            '<p class="role">' + d.role + '</p>' +
            '<p>' + d.bio + '</p>' +
          '</div>' +
        '</div>';
    });
    if (adminTabs) adminTabs.activate(adminTabs.tabs[0], false);
  }

  /* ---------- COMMUNITY ---------- */
  function buildPeople(seed, count, label, extra) {
    var out = [];
    for (var i = 1; i <= count; i++) {
      out.push({
        name: label + ' ' + i,
        img: 'https://picsum.photos/seed/' + seed + i + '/300/300',
        short: extra && extra.short ? extra.short(i) : 'Brief introduction for ' + label + ' ' + i + '.',
        more: extra && extra.more ? extra.more(i) : 'Further details, responsibilities and areas of service.'
      });
    }
    return out;
  }

  var communityData = {
    formators: buildPeople('form', 14, 'Formator', {
      short: function (i) { return 'Member of the formation team accompanying seminarians in human and spiritual growth.'; },
      more:  function (i) { return 'Responsible for a group of seminarians, leading weekly conferences, individual accompaniment and community activities.'; }
    }),
    staff: buildPeople('staff', 10, 'Staff', {
      short: function () { return 'Member of the support staff serving the daily life of the seminary.'; },
      more:  function () { return 'Responsibilities include kitchen, maintenance, grounds, laundry, security and administration.'; }
    }),
    students: [
      { name: 'First Year',  img: 'https://picsum.photos/seed/class1/300/300', short: 'Pre-philosophy and spiritual formation year.', more: 'An introductory year of spiritual formation, study skills and discernment.' },
      { name: 'Second Year', img: 'https://picsum.photos/seed/class2/300/300', short: 'First year of philosophy.', more: 'Logic, metaphysics and introduction to the history of philosophy.' },
      { name: 'Third Year',  img: 'https://picsum.photos/seed/class3/300/300', short: 'Second year of philosophy.', more: 'Ethics, epistemology and philosophy of God, with supervised apostolate.' },
      { name: 'Fourth Year', img: 'https://picsum.photos/seed/class4/300/300', short: 'Third year of philosophy.', more: 'Anthropology, political philosophy and the thought of St. Thomas Aquinas.' },
      { name: 'Fifth Year',  img: 'https://picsum.photos/seed/class5/300/300', short: 'Pastoral internship year.', more: 'A full year of supervised pastoral placement in a parish or institution.' }
    ],
    alumni: buildPeople('alum', 20, 'Alumnus', {
      short: function (i) { return 'Alumnus of St. Thomas Aquinas Seminary, ordained for priestly ministry.'; },
      more:  function (i) { return 'Currently serving in a diocese or religious institute. Please keep him and his ministry in your prayers.'; }
    })
  };

  function renderCommunity(key, label) {
    var data = communityData[key] || [];
    var cards = data.map(function (item, i) {
      var id = 'dd-' + key + '-' + i;
      return '' +
        '<article class="profile-card">' +
          '<img class="round-img" src="' + item.img + '" alt="" width="300" height="300" loading="lazy" decoding="async">' +
          '<h3>' + item.name + '</h3>' +
          '<div class="dropdown">' +
            '<button type="button" class="dropdown-toggle" aria-expanded="false" aria-controls="' + id + '">' +
              '<span>Details</span><span class="chev" aria-hidden="true">&#9662;</span>' +
            '</button>' +
            '<div class="dropdown-panel" id="' + id + '">' +
              '<p>' + item.short + '</p>' +
              '<div class="dd-more" hidden><p>' + item.more + '</p></div>' +
              '<button type="button" class="btn-mini show-more">Show more</button>' +
              '<button type="button" class="btn-mini show-less" hidden>Show less</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    return '<h2>' + label + '</h2><div class="profile-grid">' + cards + '</div>';
  }

  var communityPanel = document.getElementById('community-panel');
  var communityTablist = document.querySelector('#community [role="tablist"]');

  if (communityTablist && communityPanel) {
    var communityTabs = setupTabs(communityTablist, function (tab, panel) {
      panel.innerHTML = renderCommunity(tab.dataset.target, tab.textContent.trim());
    });
    if (communityTabs) communityTabs.activate(communityTabs.tabs[0], false);
  }

  if (communityPanel) {
    communityPanel.addEventListener('click', function (e) {
      var toggle = e.target.closest('.dropdown-toggle');
      if (toggle) {
        var dd = toggle.closest('.dropdown');
        var open = dd.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        return;
      }
      var more = e.target.closest('.show-more');
      if (more) {
        var p1 = more.closest('.dropdown-panel');
        p1.querySelector('.dd-more').hidden = false;
        p1.querySelector('.show-less').hidden = false;
        more.hidden = true;
        return;
      }
      var less = e.target.closest('.show-less');
      if (less) {
        var p2 = less.closest('.dropdown-panel');
        p2.querySelector('.dd-more').hidden = true;
        p2.querySelector('.show-more').hidden = false;
        less.hidden = true;
      }
    });
  }

  /* ============================================================
     4. MEDIA — Google Drive
     ============================================================ */
  var DRIVE_FOLDERS = {
    images: 'PASTE_GOOGLE_DRIVE_IMAGES_FOLDER_ID',
    videos: 'PASTE_GOOGLE_DRIVE_VIDEOS_FOLDER_ID',
    live:   'PASTE_GOOGLE_DRIVE_LIVE_FOLDER_ID'
  };

  function driveReady(id) { return !!id && id.indexOf('PASTE_') !== 0; }

  function driveNote() {
    return '<p class="note">' +
      'This gallery loads live from the seminary Google Drive folder. To connect your own, ' +
      'open the folder in Drive, share it as &ldquo;Anyone with the link&rdquo;, copy the ID from the URL ' +
      '(<code>drive.google.com/drive/folders/&lt;FOLDER_ID&gt;</code>) and paste it into ' +
      '<code>DRIVE_FOLDERS</code> in <code>script.js</code>.' +
    '</p>';
  }

  function demoImages() {
    return '<div class="media-grid">' + [1,2,3,4,5,6].map(function (i) {
      return '<a class="media-card" href="https://drive.google.com" target="_blank" rel="noopener">' +
               '<span class="media-thumb"><img src="https://picsum.photos/seed/media' + i + '/600/400" alt="" width="600" height="400" loading="lazy" decoding="async"></span>' +
               '<span class="media-label">Seminary photo ' + i + '</span>' +
             '</a>';
    }).join('') + '</div>';
  }

  function demoVideos() {
    return '<div class="media-grid">' + [1,2,3].map(function (i) {
      return '<a class="media-card" href="https://drive.google.com" target="_blank" rel="noopener">' +
               '<span class="media-thumb"><img src="https://picsum.photos/seed/video' + i + '/600/400" alt="" width="600" height="400" loading="lazy" decoding="async">' +
                 '<span class="play-badge" aria-hidden="true">&#9654;</span></span>' +
               '<span class="media-label">Seminary video ' + i + '</span>' +
             '</a>';
    }).join('') + '</div>';
  }

  function demoLive() {
    return '<div class="content-box" style="box-shadow:none;background:var(--cream)">' +
             '<h3>Sunday Mass &mdash; Live</h3>' +
             '<p>Our Sunday Mass is streamed live each week at 08:00 (EAT). Past liturgies ' +
             'remain available in the archive on our YouTube channel.</p>' +
             '<div class="btn-row">' +
               '<a class="btn btn--solid" href="https://youtube.com" target="_blank" rel="noopener">Watch on YouTube</a>' +
             '</div>' +
           '</div>' + driveNote();
  }

  function renderMedia(kind) {
    var id = DRIVE_FOLDERS[kind];

    if (kind === 'live' && !driveReady(id)) return demoLive();
    if (!driveReady(id)) return (kind === 'videos' ? demoVideos() : demoImages()) + driveNote();

    var src = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(id) +
              (kind === 'videos' ? '#list' : '#grid');

    return '<iframe class="drive-frame" src="' + src + '" title="Seminary ' + kind +
           ' on Google Drive" loading="lazy"></iframe>' + driveNote();
  }

  var mediaTablist = document.querySelector('#media [role="tablist"]');
  if (mediaTablist) {
    var mediaTabs = setupTabs(mediaTablist, function (tab, panel) {
      panel.innerHTML = renderMedia(tab.dataset.media);
    });
    if (mediaTabs) mediaTabs.activate(mediaTabs.tabs[0], false);
  }

  /* ============================================================
     5. ACTIVE NAV LINK ON SCROLL
     ============================================================ */
  var sections = [].slice.call(document.querySelectorAll('main .page'));
  var navLinks = [].slice.call(document.querySelectorAll('.nav a'));

  function setCurrent(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ============================================================
     6. COOKIE NOTICE
     ============================================================ */
  var cookie = document.getElementById('cookie');
  var accept = document.getElementById('cookie-accept');
  var decline = document.getElementById('cookie-decline');

  if (cookie) {
    var stored = null;
    try { stored = localStorage.getItem('stas-cookie'); } catch (e) {}
    if (!stored) cookie.classList.add('is-visible');

    function dismiss(val) {
      try { localStorage.setItem('stas-cookie', val); } catch (e) {}
      cookie.classList.remove('is-visible');
    }
    if (accept) accept.addEventListener('click', function () { dismiss('accepted'); });
    if (decline) decline.addEventListener('click', function () { dismiss('declined'); });
  }

  /* ============================================================
     7. INITIAL HASH
     ============================================================ */
  if (window.location.hash) {
    var target = document.querySelector(window.location.hash);
    if (target) {
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 150);
    }
  }
})();