/* =========================================================
   Vance & Hyde — Theme JS
   Vanilla, no dependencies. Progressive enhancement: every form
   here works with a full page reload if JS fails (native <form>
   actions/GET params), this file just makes it feel instant.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Utilities ---------------- */
  var moneyFormat = document.body.getAttribute('data-money-format') || '${{amount}}';

  function formatMoney(cents) {
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var formatted = parts.join('.');
    return moneyFormat.replace(/\{\{\s*amount\s*\}\}/, formatted).replace(/<[^>]+>/g, '');
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function trapFocus(container) {
    var focusable = qsa('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container);
    if (!focusable.length) return;
    focusable[0].focus();
  }

  /* ---------------- Scroll reveal ---------------- */
  (function scrollReveal() {
    var items = qsa('[data-animate]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- Header: hide on scroll down, show on scroll up ---------------- */
  (function headerScroll() {
    var header = qs('[data-header]');
    if (!header) return;
    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      if (y > lastY && y > header.offsetHeight) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ---------------- Announcement bar autoplay ---------------- */
  (function announcementSlider() {
    var slider = qs('[data-announcement-slider]');
    if (!slider) return;
    var slides = qsa('.announcement-bar__slide', slider);
    if (slides.length < 2) return;
    var interval = parseInt(slider.getAttribute('data-autoplay'), 10) || 5000;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, interval);
  })();

  /* ---------------- Generic drawer/panel toggles ---------------- */
  function bindDrawer(toggleSel, panelSel, closeSel) {
    var toggles = qsa(toggleSel);
    var panel = qs(panelSel);
    if (!panel) return;
    var closers = qsa(closeSel, panel).concat(qsa(closeSel));

    function open() {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      trapFocus(panel);
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    }
    function close() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    }
    toggles.forEach(function (t) { t.addEventListener('click', open); });
    closers.forEach(function (c) { c.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    return { open: open, close: close };
  }

  var mobileMenu = bindDrawer('[data-mobile-menu-toggle]', '[data-mobile-menu]', '[data-mobile-menu-close]');
  var filterDrawer = bindDrawer('[data-filter-drawer-toggle]', '[data-filter-drawer]', '[data-filter-drawer-close]');
  var sizeGuideDrawer = bindDrawer('[data-size-guide-open]', '[data-size-guide-drawer]', '[data-size-guide-close]');
  var cartDrawer = bindDrawer('[data-cart-drawer-toggle]', '[data-cart-drawer]', '[data-cart-drawer-close]');

  /* ---------------- Header search toggle ---------------- */
  (function headerSearch() {
    var toggle = qs('[data-search-toggle]');
    var panel = qs('[data-search-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', function () {
      var isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        qs('input', panel).focus();
      } else {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* ---------------- Cart: shared state ---------------- */
  var Cart = (function () {
    var freeShippingThreshold = 0;
    var bar = qs('[data-cart-shipping-bar]');
    if (bar) freeShippingThreshold = parseInt(bar.getAttribute('data-threshold'), 10) || 0;

    function get() {
      return fetch('/cart.js').then(function (r) { return r.json(); });
    }

    function add(id, quantity) {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: id, quantity: quantity || 1 })
      }).then(function (r) {
        if (!r.ok) return r.json().then(function (err) { throw err; });
        return r.json();
      });
    }

    function change(key, quantity) {
      return fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      }).then(function (r) { return r.json(); });
    }

    function updateCountBadge(count) {
      var badge = qs('[data-cart-count]');
      if (!badge) return;
      badge.textContent = count;
      badge.classList.toggle('is-visible', count > 0);
    }

    function updateShippingBar(cart) {
      if (!bar || !freeShippingThreshold) return;
      var msg = qs('[data-cart-shipping-message]', bar);
      var fill = qs('[data-cart-shipping-fill]', bar);
      var remaining = freeShippingThreshold - cart.total_price;
      var pct = Math.min(100, (cart.total_price / freeShippingThreshold) * 100);
      fill.style.width = pct + '%';
      if (remaining <= 0) {
        msg.textContent = bar.getAttribute('data-achieved-text') || "You've unlocked free shipping";
      } else {
        msg.textContent = 'You are ' + formatMoney(remaining) + ' away from free shipping';
      }
    }

    function lineHTML(item, index) {
      var imgSrc = item.image ? item.image.replace(/(\.[a-zA-Z]+)(\?|$)/, '_200x$1$2') : '';
      var variantLine = item.variant_title && item.variant_title !== 'Default Title'
        ? '<p class="cart-line__variant">' + item.variant_title + '</p>' : '';
      return (
        '<div class="cart-line" data-cart-line data-key="' + item.key + '">' +
          '<a href="' + item.url + '" class="cart-line__img">' + (imgSrc ? '<img src="' + imgSrc + '" alt="" width="84" height="100" loading="lazy">' : '') + '</a>' +
          '<div class="cart-line__meta">' +
            '<a href="' + item.url + '" class="cart-line__title">' + item.product_title + '</a>' +
            variantLine +
            '<div class="cart-line__controls">' +
              '<div class="qty-input" data-qty-input data-key="' + item.key + '">' +
                '<button type="button" data-qty-decrease aria-label="Decrease quantity">−</button>' +
                '<input type="number" min="0" value="' + item.quantity + '" aria-label="Quantity" data-qty-value>' +
                '<button type="button" data-qty-increase aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<span class="tabular-nums">' + formatMoney(item.final_line_price) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function render(cart) {
      updateCountBadge(cart.item_count);
      updateShippingBar(cart);

      var itemsEl = qs('[data-cart-items]');
      var footer = qs('.cart-drawer__footer');
      var header = qs('.cart-drawer__header p');
      if (header) header.textContent = 'Your bag (' + cart.item_count + ')';

      if (!itemsEl) return;

      if (cart.item_count === 0) {
        itemsEl.innerHTML = '<div class="cart-drawer__empty"><p class="h4">Your bag is empty</p><a href="/collections/all" class="btn btn--primary mt-6">Continue shopping</a></div>';
        if (footer) footer.style.display = 'none';
        return;
      }
      if (footer) footer.style.display = '';
      itemsEl.innerHTML = cart.items.map(lineHTML).join('');
      var subtotalEl = qs('[data-cart-subtotal]');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
      bindQtyControls(itemsEl);
    }

    return { get: get, add: add, change: change, render: render };
  })();

  /* Restore cart state on load so badge/drawer are correct after navigation */
  Cart.get().then(Cart.render).catch(function () {});

  /* ---------------- Quantity steppers (cart drawer + PDP) ---------------- */
  function bindQtyControls(scope) {
    qsa('[data-qty-input]', scope).forEach(function (wrap) {
      if (wrap.dataset.bound) return;
      wrap.dataset.bound = 'true';
      var input = qs('[data-qty-value]', wrap);
      var key = wrap.getAttribute('data-key');

      function commit(newVal) {
        newVal = Math.max(0, newVal);
        input.value = newVal;
        if (key) {
          Cart.change(key, newVal).then(Cart.render);
        }
      }
      qs('[data-qty-decrease]', wrap).addEventListener('click', function () { commit(parseInt(input.value, 10) - 1); });
      qs('[data-qty-increase]', wrap).addEventListener('click', function () { commit(parseInt(input.value, 10) + 1); });
      input.addEventListener('change', function () { commit(parseInt(input.value, 10) || 0); });
    });
  }
  bindQtyControls(document);

  /* ---------------- Add to cart: product form + quick add ---------------- */
  function flashSuccess(button) {
    var label = button.textContent;
    button.classList.add('btn--loading');
    return function finish(ok) {
      button.classList.remove('btn--loading');
      if (ok) {
        var original = button.innerHTML;
        button.textContent = 'Added ✓';
        setTimeout(function () { button.innerHTML = original; }, 1400);
      }
    };
  }

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    var button = qs('[data-atc-button]', form);
    var idInput = qs('[data-variant-id]', form);
    var qtyInput = qs('[data-qty-value]', form);
    var done = flashSuccess(button);
    Cart.add(idInput.value, parseInt(qtyInput.value, 10) || 1)
      .then(function () { return Cart.get(); })
      .then(function (cart) {
        Cart.render(cart);
        done(true);
        if (cartDrawer) cartDrawer.open();
      })
      .catch(function () { done(false); });
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-quick-add]');
    if (!btn) return;
    e.preventDefault();
    var done = flashSuccess(btn);
    Cart.add(btn.getAttribute('data-product-id'), 1)
      .then(function () { return Cart.get(); })
      .then(function (cart) {
        Cart.render(cart);
        done(true);
        if (cartDrawer) cartDrawer.open();
      })
      .catch(function () { done(false); });
  });

  /* ---------------- PDP: variant selection ---------------- */
  (function productVariants() {
    var section = qs('[data-product-section]');
    if (!section) return;
    var variantsScript = qs('[data-product-variants]');
    if (!variantsScript) return;
    var variants = JSON.parse(variantsScript.textContent);
    var form = qs('[data-product-form]', section);
    var optionInputs = qsa('[data-option-input]');

    function selectedOptions() {
      var groups = {};
      optionInputs.forEach(function (input) {
        if (input.checked) groups[input.name] = input.value;
      });
      return Object.keys(groups).sort().map(function (k) { return groups[k]; });
    }

    function findVariant() {
      var selected = selectedOptions();
      return variants.find(function (v) {
        var opts = [v.option1, v.option2, v.option3].filter(Boolean);
        return opts.length === selected.length && opts.every(function (o, i) { return o === selected[i]; });
      });
    }

    function updateUI(variant) {
      var idInput = qs('[data-variant-id]', form);
      var atcButton = qs('[data-atc-button]', form);
      var atcPrice = qs('[data-atc-price]', form);
      var priceEl = qs('[data-product-price]', section);
      var stickyPrice = qs('[data-sticky-price]');
      var stickyBtn = qs('[data-sticky-atc-button]');

      if (!variant) {
        atcButton.setAttribute('disabled', 'disabled');
        atcButton.querySelector('[data-atc-label]').textContent = 'Unavailable';
        return;
      }
      idInput.value = variant.id;
      if (variant.available) {
        atcButton.removeAttribute('disabled');
        if (stickyBtn) stickyBtn.removeAttribute('disabled');
        atcButton.querySelector('[data-atc-label]').innerHTML = 'Add to bag — <span data-atc-price>' + formatMoney(variant.price) + '</span>';
      } else {
        atcButton.setAttribute('disabled', 'disabled');
        if (stickyBtn) stickyBtn.setAttribute('disabled', 'disabled');
        atcButton.querySelector('[data-atc-label]').textContent = 'Sold out';
      }
      if (priceEl) {
        priceEl.innerHTML = variant.compare_at_price && variant.compare_at_price > variant.price
          ? '<span class="price__compare">' + formatMoney(variant.compare_at_price) + '</span><span class="price__sale">' + formatMoney(variant.price) + '</span>'
          : '<span>' + formatMoney(variant.price) + '</span>';
      }
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);

      if (variant.featured_media) {
        var img = qs('.pdp-gallery__image[data-media-id="' + variant.featured_media.id + '"]');
        if (img) {
          qsa('.pdp-gallery__image').forEach(function (i) { i.style.display = 'none'; i.classList.remove('is-active'); });
          img.style.display = '';
          img.classList.add('is-active');
          var thumb = qs('.pdp-gallery__thumb[data-media-id="' + variant.featured_media.id + '"]');
          if (thumb) {
            qsa('.pdp-gallery__thumb').forEach(function (t) { t.classList.remove('is-active'); });
            thumb.classList.add('is-active');
          }
        }
      }

      history.replaceState({}, '', updateQueryParam(window.location.search, 'variant', variant.id));
    }

    function updateQueryParam(search, key, value) {
      var params = new URLSearchParams(search);
      params.set(key, value);
      return window.location.pathname + '?' + params.toString();
    }

    optionInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        var wrap = input.closest('.option-group');
        var selectedLabel = qs('[data-option-selected]', wrap);
        if (selectedLabel) selectedLabel.textContent = input.value;
        updateUI(findVariant());
      });
    });
  })();

  /* ---------------- PDP: gallery thumbnails ---------------- */
  (function galleryThumbs() {
    qsa('[data-gallery-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var id = thumb.getAttribute('data-media-id');
        qsa('.pdp-gallery__image').forEach(function (img) {
          var match = img.getAttribute('data-media-id') === id;
          img.style.display = match ? '' : 'none';
          img.classList.toggle('is-active', match);
        });
        qsa('[data-gallery-thumb]').forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });
  })();

  /* ---------------- PDP: tap-to-zoom ---------------- */
  (function gallerZoom() {
    var main = qs('[data-zoom]');
    if (!main) return;
    main.addEventListener('click', function () {
      var img = qs('.pdp-gallery__image.is-active', main);
      if (!img) return;
      main.classList.toggle('is-zoomed');
      img.style.transform = main.classList.contains('is-zoomed') ? 'scale(1.6)' : '';
      img.style.cursor = main.classList.contains('is-zoomed') ? 'zoom-out' : 'zoom-in';
    });
  })();

  /* ---------------- PDP: sticky add-to-cart ---------------- */
  (function stickyAtc() {
    var bar = qs('[data-sticky-atc]');
    var mainButton = qs('[data-atc-button]');
    if (!bar || !mainButton) return;
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
    }, { threshold: 0 });
    io.observe(mainButton);

    qs('[data-sticky-atc-button]').addEventListener('click', function () {
      mainButton.closest('form').requestSubmit ? mainButton.closest('form').requestSubmit() : mainButton.click();
    });
  })();

  /* ---------------- Sold-out variant qty stepper on PDP already covered by bindQtyControls (no key) ---------------- */
})();
