import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, onValue, onChildAdded, onChildChanged, onChildRemoved, set, push, serverTimestamp, remove, onDisconnect, update, increment } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1ivyeUKAoNFZ-NQIlQ9AVlvfTTYqmgA0",
  authDomain: "nexysnet-43a4d.firebaseapp.com",
  databaseURL: "https://nexysnet-43a4d-default-rtdb.firebaseio.com",
  projectId: "nexysnet-43a4d",
  storageBucket: "nexysnet-43a4d.appspot.com",
  messagingSenderId: "756843839147",
  appId: "1:756843839147:web:56a7f6bc8d797142be41ee"
};

class NexysNetApp {
  constructor() {
    this.state = {
      user: 'Guest',
      uid: null,
      feedReady: false,
      searchQuery: '',
      captchaAns: 0,
      activeView: 'home',
      reactionsList: ['❤️', '🚀', '🤯', '🔥', '👍', '😂']
    };

    // Firebase Init
    this.app = initializeApp(firebaseConfig);
    this.db = getDatabase(this.app);
    this.auth = getAuth(this.app);
    this.postsRef = ref(this.db, 'posts');
    this.connRef = ref(this.db, 'connections');
    this.presenceRef = ref(this.db, '.info/connected');

    // DOM Elements Cache
    this.DOM = {
      navBtns: document.querySelectorAll('.nav-btn'),
      views: document.querySelectorAll('.view'),
      mobileTitle: document.getElementById('mobilePageTitle'),

      // Top Level Views
      viewHome: document.getElementById('view-home'),
      viewExplore: document.getElementById('view-explore'),
      exploreGrid: document.getElementById('exploreGrid'),

      // Composer
      composeInput: document.getElementById('composeInput'),
      composeExtras: document.getElementById('composeExtras'),
      postImageURL: document.getElementById('postImageURL'),
      postTags: document.getElementById('postTags'),
      charCount: document.getElementById('charCount'),
      submitBtn: document.getElementById('submitPostBtn'),
      cancelBtn: document.getElementById('cancelPostBtn'),

      // Feed
      postsContainer: document.getElementById('postsContainer'),
      skeleton: document.getElementById('feedSkeleton'),

      // Profile / Settings
      userNameInput: document.getElementById('userNameInput'),
      captchaQ: document.getElementById('captchaQuestion'),
      captchaA: document.getElementById('captchaAnswer'),
      saveUserBtn: document.getElementById('saveUserBtn'),
      profileName: document.getElementById('profileNameDisplay'),
      avatars: document.querySelectorAll('.current-user-avatar'),

      // Search & Stats
      searchInputs: [document.getElementById('searchInput')],
      trendLists: [document.getElementById('exploreTrendingList'), document.getElementById('sidebarTrendingList')],
      statPosts: document.getElementById('statTotalPosts'),
      statReactions: document.getElementById('statTotalReactions'),
      statUsers: document.getElementById('statActiveUsers'),
      onlineCounts: [document.getElementById('navOnlineCount'), document.getElementById('mobileOnlineCount')],

      // Utilities
      postTemplate: document.getElementById('post-template'),
      toast: document.getElementById('toast'),
      toastMsg: document.getElementById('toastMessage'),
      toastIcon: document.getElementById('toastIcon')
    };

    this.init();
  }

  init() {
    this.setupRouter();
    this.bindEvents();
    this.initAuth();
    this.initFirebase();
    this.generateCaptcha();
    this.parseURL();
    this.initScrollBehavior(); // Separated and improved
  }

  // --- SPA ROUTER ---
  setupRouter() {
    this.DOM.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        this.switchView(target);
      });
    });
  }

  switchView(viewId) {
    if (this.state.activeView === viewId) return;

    // UI RESTORE: If going back to home, reset search state so the feed looks normal.
    if (viewId === 'home') {
      this.DOM.searchInputs.forEach(i => { if (i) i.value = ''; });
      this.state.searchQuery = '';
      this.DOM.exploreGrid.style.display = '';
      this.DOM.viewHome.appendChild(this.DOM.postsContainer); // Move feed back
      this.filterPosts();
    }

    // Update Nav
    this.DOM.navBtns.forEach(b => b.classList.toggle('active', b.dataset.target === viewId));

    // Update Views
    this.DOM.views.forEach(v => {
      v.classList.remove('active');
      if (v.id === `view-${viewId}`) v.classList.add('active');
    });

    // Update Mobile Header
    const titles = { home: 'Home', explore: 'Explore', profile: 'Profile' };
    this.DOM.mobileTitle.textContent = titles[viewId];

    this.state.activeView = viewId;
    window.scrollTo(0, 0);
  }

  parseURL() {
    const p = new URLSearchParams(location.search);
    const postId = p.get('post');
    if (postId) {
      this.switchView('home');
      this.state.pendingHighlight = postId;
    }
  }

  getUserColor(name) {
    // Hash the name to a consistent number
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0; // Convert to 32-bit int
    }

    // Map to a set of nice-looking gradient pairs
    const gradients = [
      ['#4fc3f7', '#a78bfa'], // blue → purple
      ['#f87171', '#fb923c'], // red → orange
      ['#34d399', '#4fc3f7'], // green → blue
      ['#f472b6', '#a78bfa'], // pink → purple
      ['#fb923c', '#fbbf24'], // orange → yellow
      ['#a78bfa', '#f472b6'], // purple → pink
      ['#34d399', '#a78bfa'], // green → purple
      ['#60a5fa', '#34d399'], // blue → green
    ];

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

  // --- EVENTS & UI LOGIC ---
  bindEvents() {
    this.DOM.composeInput.addEventListener('focus', () => this.expandComposer());
    this.DOM.composeInput.addEventListener('input', () => this.updateComposerCounter());
    this.DOM.postImageURL.addEventListener('input', () => this.updateComposerCounter());
    this.DOM.cancelBtn.addEventListener('click', () => this.collapseComposer());
    this.DOM.submitBtn.addEventListener('click', () => this.createPost());

    // Fix for Search: dynamically move feed to Explore when searching
    this.DOM.searchInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        this.DOM.searchInputs.forEach(i => { if (i && i !== e.target) i.value = q; });
        this.state.searchQuery = q;

        if (q.length > 0) {
          this.DOM.exploreGrid.style.display = 'none';
          this.DOM.viewExplore.appendChild(this.DOM.postsContainer);
        } else {
          this.DOM.exploreGrid.style.display = '';
          this.DOM.viewHome.appendChild(this.DOM.postsContainer);
        }

        this.filterPosts();
      });
    });

    // Trend Click Support (Click a trend to auto-search)
    document.addEventListener('click', e => {
      const trendItem = e.target.closest('.trending-item');
      if (trendItem && trendItem.dataset.tag) {
        this.switchView('explore');
        const sInput = this.DOM.searchInputs[0];
        sInput.value = trendItem.dataset.tag;
        sInput.dispatchEvent(new Event('input')); // Trigger search logic
      }
    });

    this.DOM.saveUserBtn.addEventListener('click', () => this.saveProfile());
    this.DOM.captchaA.addEventListener('keypress', e => e.key === 'Enter' && this.saveProfile());
    this.DOM.postsContainer.addEventListener('click', e => this.handleFeedClick(e));
  }

  // --- SCROLL BEHAVIOR (mobile hide/show nav) ---
  initScrollBehavior() {
    const bottomNav = document.querySelector('.app-nav');
    if (!bottomNav) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    // Use requestAnimationFrame to throttle scroll handler — prevents jank
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Only run on mobile
          if (window.innerWidth <= 860) {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;

            // Only react to meaningful scroll (>4px threshold prevents micro-jitter)
            if (Math.abs(delta) > 4) {
              if (delta > 0 && currentScrollY > 80) {
                // Scrolling down — hide nav
                bottomNav.classList.add('nav-hidden');
              } else if (delta < 0) {
                // Scrolling up — show nav
                bottomNav.classList.remove('nav-hidden');
              }
              lastScrollY = currentScrollY;
            }
          } else {
            // Always visible on desktop
            bottomNav.classList.remove('nav-hidden');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // passive: true is CRITICAL — tells browser this handler won't call preventDefault()
    // which allows the browser to scroll immediately without waiting for JS
    window.addEventListener('scroll', onScroll, { passive: true });

    // Also show nav when at the very top (handles momentum scroll past 0)
    const onScrollEnd = () => {
      if (window.scrollY <= 10) {
        bottomNav.classList.remove('nav-hidden');
      }
    };
    window.addEventListener('scrollend', onScrollEnd, { passive: true });
  }

  expandComposer() {
    if (this.state.user === 'Guest') {
      this.showToast('Please set your username in Profile first!', 'error');
      this.switchView('profile');
      this.DOM.userNameInput.focus();
      return;
    }
    this.DOM.composeInput.rows = 3;
    this.DOM.composeExtras.classList.add('active');
  }

  collapseComposer() {
    this.DOM.composeInput.value = '';
    this.DOM.postImageURL.value = '';
    this.DOM.postTags.value = '';
    this.DOM.composeInput.rows = 1;
    this.DOM.composeExtras.classList.remove('active');
    this.updateComposerCounter();
  }

  updateComposerCounter() {
    const len = this.DOM.composeInput.value.length;
    const left = 500 - len;
    this.DOM.charCount.textContent = left;
    this.DOM.charCount.style.color = left < 0 ? 'var(--accent-danger)' : 'var(--text-muted)';

    const hasContent = this.DOM.composeInput.value.trim() || this.DOM.postImageURL.value.trim();
    this.DOM.submitBtn.disabled = left < 0 || !hasContent;
  }

  // --- AUTH & PROFILE ---
  initAuth() {
    signInAnonymously(this.auth).catch(() => this.showToast('Connection failed.', 'error'));
    onAuthStateChanged(this.auth, user => {
      if (!user) return;
      this.state.uid = user.uid;
      const savedName = localStorage.getItem('nexysUserName');
      if (savedName) {
        this.applyProfile(savedName);
      }
      this.initPresence();
    });
  }

  generateCaptcha() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    this.state.captchaAns = n1 + n2;
    this.DOM.captchaQ.textContent = `Human check: What is ${n1} + ${n2}?`;
    this.DOM.captchaA.value = '';
  }

  saveProfile() {
    if (parseInt(this.DOM.captchaA.value) !== this.state.captchaAns) {
      this.showToast('Incorrect math answer.', 'error');
      this.generateCaptcha();
      return;
    }
    const name = this.DOM.userNameInput.value.trim();
    if (name.length < 3) {
      this.showToast('Username must be at least 3 characters.', 'error');
      return;
    }
    localStorage.setItem('nexysUserName', name);
    this.applyProfile(name);
    this.showToast(`Welcome, ${name}!`, 'success');
    this.switchView('home');
  }

  applyProfile(name) {
    this.state.user = name;
    this.DOM.profileName.textContent = name;
    this.DOM.userNameInput.value = name;

    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const [c1, c2] = this.getUserColor(name);  // ← add this
    this.DOM.avatars.forEach(av => {
      av.textContent = initials;
      av.style.background = `linear-gradient(135deg, ${c1}, ${c2})`; // ← add this
    });
  }

  initPresence() {
    onValue(this.presenceRef, snap => {
      if (!snap.val()) return;
      const conn = push(this.connRef);
      onDisconnect(conn).remove();
      set(conn, { user: this.state.user, ts: serverTimestamp() });
    });

    onValue(this.connRef, snap => {
      const c = snap.exists() ? snap.size : 0;
      this.DOM.onlineCounts.forEach(el => { if (el) el.textContent = `${c} online`; });
      if (this.DOM.statUsers) this.DOM.statUsers.textContent = c;
    });
  }

  // --- FIREBASE DB ---
  initFirebase() {
    onChildAdded(this.postsRef, snap => {
      if (!this.state.feedReady) {
        this.DOM.skeleton.style.display = 'none';
        this.state.feedReady = true;
      }
      const el = this.buildPost(snap.key, snap.val());
      this.DOM.postsContainer.prepend(el);
      this.filterPosts();

      if (this.state.pendingHighlight === snap.key) {
        setTimeout(() => this.highlightPost(el), 300);
        this.state.pendingHighlight = null;
      }
    });

    onChildChanged(this.postsRef, snap => {
      const el = document.querySelector(`[data-post-id="${snap.key}"]`);
      if (el) this.updatePostDOM(el, snap.val());
    });

    onChildRemoved(this.postsRef, snap => {
      const el = document.querySelector(`[data-post-id="${snap.key}"]`);
      if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    });

    // Global Stats Aggregation
    onValue(this.postsRef, snap => {
      if (!snap.exists()) return;
      const posts = snap.val();
      const count = Object.keys(posts).length;
      let reactions = 0;
      let tags = {};

      for (const k in posts) {
        reactions += Object.values(posts[k].reactions || {}).reduce((a, b) => a + b, 0);
        if (posts[k].tags) {
          posts[k].tags.split(/\s+/).filter(Boolean).forEach(t => {
            const tl = t.toLowerCase();
            tags[tl] = (tags[tl] || 0) + 1;
          });
        }
      }

      if (this.DOM.statPosts) this.DOM.statPosts.textContent = count;
      if (this.DOM.statReactions) this.DOM.statReactions.textContent = reactions;

      const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const trendsHtml = sortedTags.length
        ? sortedTags.map(([t, c]) => `<div class="trending-item" data-tag="${this.escapeHTML(t)}"><span class="trend-tag">${this.escapeHTML(t)}</span><span class="trend-count">${c} posts</span></div>`).join('')
        : '<p style="color:var(--text-muted);font-size:0.85rem">No trends yet.</p>';

      this.DOM.trendLists.forEach(l => { if (l) l.innerHTML = trendsHtml; });
    });
  }

  // --- POST CREATION & DOM ---
  createPost() {
    const content = this.DOM.composeInput.value.trim();
    const imageUrl = this.DOM.postImageURL.value.trim();
    const tags = this.DOM.postTags.value.trim();

    this.DOM.submitBtn.disabled = true;
    this.DOM.submitBtn.textContent = 'Posting...';

    set(push(this.postsRef), {
      content, tags, imageUrl: imageUrl || null,
      author: this.state.user,
      authorUid: this.state.uid,
      timestamp: serverTimestamp()
    }).then(() => {
      this.collapseComposer();
      this.showToast('Posted successfully! ✨', 'success');
    }).catch(() => this.showToast('Failed to post.', 'error'))
      .finally(() => { this.DOM.submitBtn.textContent = 'Post ✨'; });
  }

  buildPost(id, post) {
    const clone = this.DOM.postTemplate.content.cloneNode(true);
    const card = clone.querySelector('.post-card');
    card.dataset.postId = id;
    card.dataset.searchable = (post.content + ' ' + post.author + ' ' + (post.tags || '')).toLowerCase();

    card.querySelector('[data-author-initials]').textContent = this.getInitials(post.author);
    const [c1, c2] = this.getUserColor(post.author);
    card.querySelector('[data-author-initials]').style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    card.querySelector('[data-author-name]').textContent = this.escapeHTML(post.author);
    card.querySelector('[data-timestamp]').textContent = this.timeAgo(post.timestamp);

    if (post.authorUid === this.state.uid) {
      card.querySelector('.delete-btn').style.display = 'block';
    }

    const tagsEl = card.querySelector('[data-post-tags]');
    if (post.tags) {
      tagsEl.innerHTML = post.tags.split(/\s+/).filter(Boolean)
        .map(t => `<span class="post-tag">${this.escapeHTML(t)}</span>`).join('');
    }

    card.querySelector('[data-post-content]').innerHTML = this.formatRichText(post.content);

    if (post.imageUrl) {
      const img = card.querySelector('[data-post-image]');
      img.src = post.imageUrl;
      img.style.display = 'block';
    }

    card.querySelector('[data-reactions-panel]').innerHTML = this.state.reactionsList
      .map(r => `<button class="reaction-btn" data-action="react" data-reaction="${r}">${r}</button>`).join('');

    card.querySelector('[data-share-link]').value = `${location.origin}${location.pathname}?post=${id}`;
    card.querySelector('[data-current-user-initials]').textContent = this.getInitials(this.state.user);

    this.updatePostDOM(card, post);
    return card;
  }

  updatePostDOM(card, post) {
    const totalReactions = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);
    const myReaction = post.userReactions?.[this.state.uid];

    card.dataset.userReaction = myReaction || '';
    card.querySelector('[data-reaction-emoji]').textContent = myReaction || '🤍';
    card.querySelector('[data-reaction-count]').textContent = totalReactions;

    const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
    card.querySelector('[data-comment-count]').textContent = commentsCount;

    const cList = card.querySelector('[data-comments-container]');
    cList.innerHTML = '';
    if (post.comments) {
  Object.values(post.comments).sort((a, b) => a.timestamp - b.timestamp).forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
      <div class="user-avatar comment-avatar">${this.getInitials(c.author)}</div>
      <div class="comment-bubble">
        <div class="comment-header">
          <span class="comment-author">${this.escapeHTML(c.author)}</span>
          <span class="comment-time">${this.timeAgo(c.timestamp)}</span>
        </div>
        <div class="comment-text">${this.formatRichText(c.text)}</div>
      </div>`;

    // Apply per-user color to comment avatar
    const [c1, c2] = this.getUserColor(c.author);
    div.querySelector('.comment-avatar').style.background = `linear-gradient(135deg, ${c1}, ${c2})`;

    cList.appendChild(div);
  });
}
  }

  // --- INTERACTIONS ---
  handleFeedClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.post-card');
    const pid = card.dataset.postId;
    const action = btn.dataset.action;

    const togglePanel = (sel) => {
      const panel = card.querySelector(sel);
      const isOpen = panel.classList.toggle('active');
      card.querySelectorAll('.action-btn').forEach(b => { if (b !== btn) b.classList.remove('active'); });
      if (btn.classList.contains('action-btn')) btn.classList.toggle('active', isOpen);
      if (isOpen && sel.includes('comments')) panel.querySelector('[data-comment-input]').focus();
    };

    if (action === 'toggle-reactions') togglePanel('[data-reactions-panel]');
    if (action === 'toggle-comments') togglePanel('[data-comments-section]');
    if (action === 'toggle-share') togglePanel('[data-share-panel]');

    if (action === 'delete') this.deletePost(pid, card);
    if (action === 'copy-share-link') {
      navigator.clipboard.writeText(card.querySelector('[data-share-link]').value);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    }

    if (action === 'react') {
      if (this.state.user === 'Guest') return this.showToast('Please set your username first.', 'error');
      this.toggleReaction(pid, btn.dataset.reaction, card);
    }

    if (action === 'add-comment') {
      if (this.state.user === 'Guest') return this.showToast('Please set your username first.', 'error');
      this.addComment(pid, card);
    }
  }

  toggleReaction(pid, reaction, card) {
    const old = card.dataset.userReaction;
    const updates = {};
    if (old === reaction) {
      updates[`posts/${pid}/reactions/${old}`] = increment(-1);
      updates[`posts/${pid}/userReactions/${this.state.uid}`] = null;
    } else {
      if (old) updates[`posts/${pid}/reactions/${old}`] = increment(-1);
      updates[`posts/${pid}/reactions/${reaction}`] = increment(1);
      updates[`posts/${pid}/userReactions/${this.state.uid}`] = reaction;
    }
    update(ref(this.db), updates).catch(() => this.showToast('Reaction failed', 'error'));
  }

  addComment(pid, card) {
    const input = card.querySelector('[data-comment-input]');
    const text = input.value.trim();
    if (!text) return;

    set(push(ref(this.db, `posts/${pid}/comments`)), {
      author: this.state.user,
      authorUid: this.state.uid,
      text,
      timestamp: serverTimestamp()
    }).then(() => { input.value = ''; }).catch(() => this.showToast('Comment failed', 'error'));
  }

  deletePost(pid, card) {
    if (!confirm('Permanently delete this post?')) return;
    remove(ref(this.db, `posts/${pid}`))
      .then(() => this.showToast('Post deleted', 'success'))
      .catch(() => this.showToast('Failed to delete', 'error'));
  }

  // --- HELPERS ---
  filterPosts() {
    const q = this.state.searchQuery;
    const cards = Array.from(this.DOM.postsContainer.children);
    cards.forEach(card => {
      const match = !q || card.dataset.searchable.includes(q);
      card.style.display = match ? '' : 'none';
    });
  }

  highlightPost(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 3000);
  }

  showToast(msg, type = 'info') {
    this.DOM.toastMsg.textContent = msg;
    this.DOM.toastIcon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    this.DOM.toast.className = `toast show ${type}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.DOM.toast.classList.remove('show'), 3000);
  }

  getInitials(name) {
    return (name || '??').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  escapeHTML(str) {
    if (!str) return '';
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return String(str).replace(/[&<>"]/g, m => escapeMap[m]); // ← apostrophe REMOVED
  }

  formatRichText(text) {
    if (!text) return '';
    let t = this.escapeHTML(text);
    t = t.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    t = t.replace(/(#[\w-]+)/g, tag => `<span class="hashtag">${tag}</span>`);
    t = t.replace(/\n/g, '<br>');
    return t;
  }
  // ← second formatRichText is GONE

  timeAgo(ts) {
    if (!ts) return '';
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return `${Math.floor(s)}s`;
    const m = s / 60;
    if (m < 60) return `${Math.floor(m)}m`;
    const h = m / 60;
    if (h < 24) return `${Math.floor(h)}h`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

document.addEventListener('DOMContentLoaded', () => new NexysNetApp());