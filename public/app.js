const storageKey = 'medicart-cart-v1';
let products = [];
let cart = {};
let category = 'All products';
let query = '';
let toastTimer;
const money = value => `Rs. ${value.toLocaleString('en-LK')}`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function renderProducts() {
  const visible = products.filter(product => (category === 'All products' || product.category === category) && `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(query));
  document.querySelector('#product-count').textContent = `${visible.length} products`;
  document.querySelector('#products').innerHTML = visible.length ? visible.map(product => `
    <article class="product"><div class="product-art ${escapeHtml(product.color)}"><span class="category-label">${escapeHtml(product.category)}</span><span class="product-icon" aria-hidden="true">${escapeHtml(product.icon)}</span></div><div class="product-info"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.detail)}</p><div class="product-bottom"><strong>${money(product.price)}</strong><button class="add-button" data-add="${escapeHtml(product.id)}" aria-label="Add ${escapeHtml(product.name)} to cart">+ Add</button></div></div></article>
  `).join('') : '<div class="empty-results"><h3>No products found</h3><p>Try another search or category.</p><button id="reset-filters">Clear filters</button></div>';
}

function totals() {
  return products.reduce((result, product) => {
    const quantity = cart[product.id] || 0;
    return { count: result.count + quantity, total: result.total + product.price * quantity };
  }, { count: 0, total: 0 });
}

function renderCart() {
  const summary = totals();
  document.querySelector('#cart-count').textContent = summary.count;
  document.querySelector('#subtotal').textContent = money(summary.total);
  document.querySelector('#total').textContent = money(summary.total);
  document.querySelector('#checkout').disabled = summary.count === 0;
  document.querySelector('#cart-items').innerHTML = summary.count ? products.filter(product => cart[product.id]).map(product => `
    <div class="cart-item"><span class="cart-item-icon ${escapeHtml(product.color)}" aria-hidden="true">${escapeHtml(product.icon)}</span><div class="cart-item-detail"><h3>${escapeHtml(product.name)}</h3><p>${money(product.price)}</p><div class="quantity"><button data-change="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button><span>${cart[product.id]}</span><button data-change="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase ${escapeHtml(product.name)} quantity" ${cart[product.id] >= 99 ? 'disabled' : ''}>+</button></div></div><button class="remove" data-remove="${escapeHtml(product.id)}" aria-label="Remove ${escapeHtml(product.name)}">×</button></div>
  `).join('') : '<div class="empty-cart"><span aria-hidden="true">♡</span><h3>A little room for care</h3><p>Your cart is empty.<br>Add an essential to get started.</p></div>';
}

function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
  catch { notify('Cart updated. Browser storage is unavailable, so it will not be saved.'); }
  renderCart();
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw Error('Products unavailable');
    products = await response.json();
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        cart = Object.fromEntries(products.flatMap(({ id }) => Number.isInteger(stored[id]) && stored[id] > 0 ? [[id, Math.min(stored[id], 99)]] : []));
      }
    } catch { cart = {}; }
    renderProducts();
    renderCart();
  } catch {
    document.querySelector('#products').innerHTML = '<div class="empty-results"><h3>Could not load products</h3><p>Check that the Node server is running, then try again.</p><button id="retry">Try again</button></div>';
  }
}

document.querySelector('#search').addEventListener('input', event => {
  query = event.target.value.trim().toLowerCase();
  if (products.length) renderProducts();
});
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.category) {
    category = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(item => {
      const active = item.dataset.category === category;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (products.length) renderProducts();
  }
  if (button.dataset.add) {
    const product = products.find(item => item.id === button.dataset.add);
    if (!product) return;
    if ((cart[product.id] || 0) >= 99) return notify('Maximum quantity is 99 per product.');
    cart[product.id] = (cart[product.id] || 0) + 1;
    notify(`${product.name} added to your cart`);
    saveCart();
  }
  if (button.dataset.change) {
    const id = button.dataset.change;
    cart[id] = Math.min(99, (cart[id] || 0) + Number(button.dataset.delta));
    if (cart[id] <= 0) delete cart[id];
    saveCart();
  }
  if (button.dataset.remove) { delete cart[button.dataset.remove]; saveCart(); }
  if (button.id === 'reset-filters') {
    query = '';
    document.querySelector('#search').value = '';
    document.querySelector('[data-category="All products"]').click();
  }
  if (button.id === 'retry') loadProducts();
  if (button.id === 'checkout') {
    const summary = totals();
    if (!summary.count) return;
    document.querySelector('#order-message').textContent = `Your sample cart contained ${summary.count} ${summary.count === 1 ? 'item' : 'items'}, totaling ${money(summary.total)}.`;
    document.querySelector('#confirmation').showModal();
    cart = {};
    saveCart();
  }
  if (button.id === 'close-confirmation') document.querySelector('#confirmation').close();
});
renderCart();
loadProducts();
