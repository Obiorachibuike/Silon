(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  $('#year').textContent = new Date().getFullYear();

  // Reveal sections as they enter view, while leaving content visible if motion is reduced.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Mobile navigation.
  const menuButton = $('.menu-toggle');
  const nav = $('#primary-nav');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  });
  $$('.nav-left a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('is-open');
  }));

  // Search panel and local product search.
  const searchButton = $('.search-toggle');
  const searchPanel = $('#search-panel');
  const searchInput = $('#site-search');
  const productCards = $$('.product-card');
  const emptyState = $('.empty-state');
  const setSearchOpen = (open) => {
    searchPanel.hidden = !open;
    searchButton.setAttribute('aria-expanded', String(open));
    if (open) searchInput.focus();
  };
  searchButton.addEventListener('click', () => setSearchOpen(searchPanel.hidden));
  $('[data-close-search]').addEventListener('click', () => setSearchOpen(false));
  $('.search-form').addEventListener('submit', (event) => event.preventDefault());
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    if (term) {
      $$('.filter-button').forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
      });
    }
    let visible = 0;
    productCards.forEach((card) => {
      const matches = !term || `${card.dataset.name} ${card.textContent}`.toLowerCase().includes(term);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    emptyState.hidden = visible !== 0;
  });

  // Product category filters.
  $$('.filter-button').forEach((button) => button.addEventListener('click', () => {
    searchInput.value = '';
    const selected = button.dataset.filter;
    $$('.filter-button').forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    productCards.forEach((card) => {
      const matches = selected === 'all' || card.dataset.category === selected;
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    emptyState.hidden = visible !== 0;
  }));

  // Favourites have a small, immediate visual state.
  $$('.favorite-button').forEach((button) => button.addEventListener('click', () => {
    const selected = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(selected));
    const title = button.closest('.product-card').dataset.name;
    showToast(selected ? `${title} saved to your favourites` : `${title} removed from your favourites`);
  }));

  // Lightweight bag interactions for the static storefront demo.
  const bag = [];
  const bagPanel = $('#bag-panel');
  const bagToggle = $('.bag-toggle');
  const bagScrim = $('.drawer-scrim');
  const bagCount = $('.bag-count');
  const drawerBagCount = $('.drawer-bag-count');
  const bagItems = $('.bag-items');
  const bagFooter = $('.bag-footer');
  let lastFocused = null;
  let toastTimer;
  let drawerTimer;

  function showToast(message) {
    const toast = $('.toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function renderBag() {
    bagCount.textContent = String(bag.reduce((sum, item) => sum + item.quantity, 0));
    drawerBagCount.textContent = `(${bag.reduce((sum, item) => sum + item.quantity, 0)})`;
    bagItems.replaceChildren();
    if (!bag.length) {
      const empty = document.createElement('p');
      empty.className = 'bag-empty';
      empty.innerHTML = 'Your bag is having a quiet moment.<br />Find something you love.';
      bagItems.append(empty);
      bagFooter.hidden = true;
      return;
    }
    let total = 0;
    bag.forEach((item) => {
      total += item.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'bag-item';
      const image = document.createElement('img');
      image.className = 'bag-item-thumb';
      image.src = item.image;
      image.alt = '';
      const details = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.name;
      const quantity = document.createElement('p');
      quantity.textContent = `Qty ${item.quantity}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'bag-item-remove';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        const index = bag.findIndex((entry) => entry.name === item.name);
        if (index > -1) bag.splice(index, 1);
        renderBag();
      });
      details.append(title, quantity, remove);
      const price = document.createElement('span');
      price.className = 'bag-item-price';
      price.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
      row.append(image, details, price);
      bagItems.append(row);
    });
    $('.bag-subtotal strong').textContent = `$${total.toFixed(2)}`;
    bagFooter.hidden = false;
  }

  function openBag() {
    window.clearTimeout(drawerTimer);
    lastFocused = document.activeElement;
    bagScrim.hidden = false;
    requestAnimationFrame(() => bagScrim.classList.add('is-open'));
    bagPanel.classList.add('is-open');
    bagPanel.setAttribute('aria-hidden', 'false');
    bagPanel.inert = false;
    bagToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    $('.drawer-close').focus();
  }

  function closeBag() {
    bagScrim.classList.remove('is-open');
    bagPanel.classList.remove('is-open');
    bagPanel.setAttribute('aria-hidden', 'true');
    bagPanel.inert = true;
    bagToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    window.clearTimeout(drawerTimer);
    drawerTimer = window.setTimeout(() => { bagScrim.hidden = true; }, 320);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  bagToggle.addEventListener('click', openBag);
  $('.drawer-close').addEventListener('click', closeBag);
  bagScrim.addEventListener('click', closeBag);
  $$('.quick-add').forEach((button) => button.addEventListener('click', () => {
    const name = button.dataset.add;
    const price = Number(button.dataset.price);
    const image = button.closest('.product-card').querySelector('img').src;
    const existing = bag.find((item) => item.name === name);
    if (existing) existing.quantity += 1;
    else bag.push({ name, price, image, quantity: 1 });
    renderBag();
    showToast(`${name} added to your bag`);
  }));
  $('.checkout-button').addEventListener('click', () => showToast('Checkout is coming soon. Thanks for being here!'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!bagPanel.inert) closeBag();
      if (!searchPanel.hidden) setSearchOpen(false);
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-open');
    }
    if (event.key === 'Tab' && !bagPanel.inert) {
      const focusable = $$('button:not([disabled]), a[href], input:not([disabled])', bagPanel).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Front-end form confirmation; connect to a mailing-list provider before launch.
  $('.newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#email');
    if (!input.reportValidity()) return;
    $('.form-message').textContent = 'You’re on the list. Keep an eye on your inbox ✳';
    input.value = '';
  });
})();
