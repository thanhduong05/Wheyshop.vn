/* WheyShop.vn v2 - main JS
   - Slider (3 ảnh) (you add images/banner1.jpg..)
   - Left fixed menu
   - Flash sale (2 products)
   - All other products displayed in grid (no pagination)
   - Search (debounce)
   - Modal product: like, comment + rating, add to cart
   - Cart modal: CHECKOUT with "mailto:" link (Code 06)
   - Mock login (localStorage) with SOCIAL/EMAIL options (Code 05)
   - Theme toggle (localStorage)
*/

/* ========== DATA: 10 sản phẩm (2 flash + 8 others) ========== */
/* Update image filenames in /images/ as you wish */
const PRODUCTS = [
  // Flash 2
  { id: 'f1', name: 'Whey Isolate 2kg - PureWhey', type: 'Whey', brand: 'NutriCore', priceNew: 899000, priceOld: 1199000, img: 'images/whey-1.jpg', rating: 4.7, reviews: 512, sold: 1400, promo: ['FREESHIP'], flash: true },
  { id: 'f2', name: 'Whey Gold 2kg - OptiGold', type: 'Whey', brand: 'Opti', priceNew: 1199000, priceOld: 1499000, img: 'images/whey-gold.jpg', rating: 4.9, reviews: 1050, sold: 2300, promo: ['GIẢM 20%'], flash: true },

  // Others (8) — giữ nguyên giá, không giảm
  { id: 's3', name: 'BCAA 2:1:1 400g - AminoFuel', type: 'BCAA', brand: 'AminoFuel', priceNew: 459000, img: 'images/bcaa-1.jpg', rating: 4.5, reviews: 140, sold: 610, promo: [] },
  { id: 's4', name: 'BCAA Ultra 300g - Recovery', type: 'BCAA', brand: 'MySupp', priceNew: 499000, img: 'images/bcaa-ultra.jpg', rating: 4.6, reviews: 400, sold: 720, promo: [] },
  { id: 's5', name: 'Creatine Monohydrate 300g', type: 'Creatine', brand: 'PureChem', priceNew: 299000, img: 'images/creatine-1.jpg', rating: 4.7, reviews: 180, sold: 980, promo: [] },
  { id: 's6', name: 'Pre-Workout Nitro 300g', type: 'Pre-workout', brand: 'NitroLab', priceNew: 549000, img: 'images/preworkout-1.jpg', rating: 4.4, reviews: 210, sold: 780, promo: [] },
  { id: 's7', name: 'Vitamin D3+K2 60 viên', type: 'Vitamin', brand: 'HealthPlus', priceNew: 189000, img: 'images/d3k2.jpg', rating: 4.6, reviews: 90, sold: 420, promo: [] },
  { id: 's8', name: 'Omega-3 100 viên', type: 'Omega', brand: 'OmegaPro', priceNew: 259000, img: 'images/omega.jpg', rating: 4.5, reviews: 70, sold: 310, promo: [] },
  { id: 's9', name: 'Mass Gainer 4kg - BulkUp', type: 'Mass', brand: 'BulkLab', priceNew: 1299000, img: 'images/mass.jpg', rating: 4.2, reviews: 60, sold: 200, promo: [] },
  { id: 's10', name: 'Zinc 100 viên - ZincPlus', type: 'Mineral', brand: 'Blackmores', priceNew: 329000, img: 'images/zinc.jpg', rating: 4.7, reviews: 220, sold: 620, promo: [] }
];

/* ========== STATE & SELECTORS ========== */
const state = {
  query: '',
  cart: JSON.parse(localStorage.getItem('ws_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('ws_user') || 'null'),
  flashEnd: localStorage.getItem('ws_flash_end') ? new Date(localStorage.getItem('ws_flash_end')) : new Date(Date.now() + 1000*60*60*24*3) // default 3 days
};

const $ = {
  bannerSlider: document.getElementById('bannerSlider'),
  flashGrid: document.getElementById('flashGrid'),
  productGrid: document.getElementById('productGrid'),
  globalSearch: document.getElementById('globalSearch'),
  countdown: document.getElementById('countdown'),
  modalRoot: document.getElementById('modalRoot'),
  cartBtn: document.getElementById('cartBtn'),
  cartCount: document.getElementById('cartCount'),
  loginBtn: document.getElementById('loginBtn'),
  themeToggle: document.getElementById('themeToggle'),
  categoryNav: document.querySelectorAll('.category-nav .cat-item')
};

/* ========== UTILS ========== */
const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
const escapeHTML = s => s ? String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]) : '';

/* ========== INIT ========== */
init();
function init(){
  renderBanner();
  renderFlashSale();
  renderAllProducts();
  renderCartCount();
  startCountdown();
  restoreTheme();
  attachEvents();
  highlightCategory('flash');
  renderAuth(); // Cập nhật tên user khi tải trang
}

/* ========== BANNER (simple slider) ========== */
let slideIndex = 0;
function renderBanner(){
  const slides = $.bannerSlider.querySelector('.slides');
  const total = slides.children.length;
  document.getElementById('prevSlide').addEventListener('click', ()=> moveSlide(-1));
  document.getElementById('nextSlide').addEventListener('click', ()=> moveSlide(1));
  // auto
  setInterval(()=> moveSlide(1), 5000);
  function moveSlide(delta){
    slideIndex = (slideIndex + delta + total) % total;
    slides.style.transform = `translateX(-${slideIndex * 100}%)`;
  }
}

/* ========== FLASH SALE ========== */
function renderFlashSale(){
  const flash = PRODUCTS.filter(p => p.flash);
  $.flashGrid.innerHTML = '';
  flash.forEach(p => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div style="position:relative">
        <img src="${p.img}" alt="${escapeHTML(p.name)}" />
        <div class="badge">${Math.round((1 - p.priceNew / p.priceOld) * 100)}% GIẢM</div>
      </div>
      <div class="title">${escapeHTML(p.name)}</div>
      <div class="meta"><div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div><div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div><div class="price-old">${fmt(p.priceOld)}</div></div></div>
      <div class="promos">${p.promo.map(x => `<span class="promo">${escapeHTML(x)}</span>`).join('')}</div>
    `;
    card.addEventListener('click', ()=> openProductModal(p.id));
    $.flashGrid.appendChild(card);
  });
}

/* ========== ALL PRODUCTS GRID ========== */
function renderAllProducts(){
  $.productGrid.innerHTML = '';
  const others = PRODUCTS.filter(p => !p.flash);
  others.forEach(p => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <div style="position:relative">
        <img src="${p.img}" alt="${escapeHTML(p.name)}" />
        ${p.priceOld ? `<div class="badge">${Math.round((1 - p.priceNew / p.priceOld) * 100)}% GIẢM</div>` : ''}
      </div>
      <div class="title">${escapeHTML(p.name)}</div>
      <div class="meta"><div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div><div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div>${p.priceOld?`<div class="price-old">${fmt(p.priceOld)}</div>`:''}</div></div>
      <div class="promos">${(p.promo||[]).map(x => `<span class="promo">${escapeHTML(x)}</span>`).join('')}</div>
    `;
    c.addEventListener('click', ()=> openProductModal(p.id));
    $.productGrid.appendChild(c);
  });
}

/* ========== COUNTDOWN ========== */
function startCountdown(){
  if(!localStorage.getItem('ws_flash_end')) localStorage.setItem('ws_flash_end', state.flashEnd.toISOString());
  state.flashEnd = new Date(localStorage.getItem('ws_flash_end'));
  function tick(){
    const now = new Date();
    let diff = Math.max(0, state.flashEnd - now);
    const days = Math.floor(diff / (1000*60*60*24)); diff -= days*(1000*60*60*24);
    const hrs = String(Math.floor(diff / (1000*60*60))).padStart(2,'0'); diff -= hrs*(1000*60*60);
    const mins = String(Math.floor(diff / (1000*60))).padStart(2,'0'); diff -= mins*(1000*60);
    const secs = String(Math.floor(diff / 1000)).padStart(2,'0');
    $.countdown.textContent = `${days} ngày ${hrs}:${mins}:${secs}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ========== PRODUCT MODAL (like, comment, add to cart) ========== */
function openProductModal(id){
  const p = PRODUCTS.find(x=>x.id === id); if(!p) return;
  $.modalRoot.innerHTML = ''; $.modalRoot.classList.add('show');
  const commentsStore = JSON.parse(localStorage.getItem('ws_comments') || '{}');
  const likesStore = JSON.parse(localStorage.getItem('ws_likes') || '{}');
  const comments = commentsStore[id] || [];
  const likes = likesStore[id] || [];
  const liked = state.user ? likes.includes(state.user.name) : false;

  const modal = document.createElement('div'); modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-top">
      <img src="${p.img}" alt="${escapeHTML(p.name)}" />
      <div class="modal-info">
        <h2>${escapeHTML(p.name)}</h2>
        <div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div>
        <div style="margin-top:8px;font-weight:800;color:var(--brand)">${fmt(p.priceNew)} ${p.priceOld?`<span class="small-muted" style="text-decoration: line-through;">${fmt(p.priceOld)}</span>`:''}</div>
        <div style="margin-top:10px">${p.sold} đã bán • ${p.rating}★ (${p.reviews} đánh giá)</div>
        <div style="margin-top:12px">
          <button id="addCartBtn" class="btn">Thêm vào giỏ</button>
          <button id="likeBtn" class="icon-btn" style="margin-left:8px">${liked ? '♥ Đã thích' : '♡ Thích'}</button>
          <button id="closeModal" class="page-btn" style="margin-left:8px">Đóng</button>
        </div>
        <div class="hr"></div>

        <strong>Bình luận & Đánh giá</strong>
        <div class="comment-list" id="commentList" style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 8px; margin-top: 8px;">
           ${comments.length ? comments.map(c=>`<div class="comment-item" style="border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 8px; margin-bottom: 8px;"><div style="display:flex;justify-content:space-between"><div><strong>${escapeHTML(c.user)}</strong> <span class="small-muted">- ${c.stars}★</span></div><div class="small-muted">${new Date(c.time).toLocaleString()}</div></div><div style="margin-top:6px">${escapeHTML(c.text)}</div></div>`).join('') : '<div class="small-muted">Chưa có bình luận nào.</div>'}
        </div>

        <div class="form-row" style="display:flex; gap: 8px; margin-top: 10px;">
          <select id="starSelect" style="border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 8px;"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option></select>
          <input id="commentInput" type="text" placeholder="Viết bình luận..." style="flex: 1; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 8px;" />
          <button id="submitComment" class="btn small">Gửi</button>
        </div>
        <div class="small-muted" style="margin-top:6px">Bạn cần đăng nhập để bình luận/like.</div>
      </div>
    </div>
  `;
  $.modalRoot.appendChild(modal);

  // handlers
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('addCartBtn').addEventListener('click', ()=>{ addToCart(id); closeModal(); });
  document.getElementById('likeBtn').addEventListener('click', ()=> toggleLike(id));
  document.getElementById('submitComment').addEventListener('click', ()=> submitComment(id));
  $.modalRoot.addEventListener('click', e=> { if(e.target === $.modalRoot) closeModal(); });
}

function closeModal(){ $.modalRoot.classList.remove('show'); $.modalRoot.innerHTML = ''; }

/* ========== Likes ========== */
function toggleLike(productId){
  if(!state.user){ alert('Bạn cần đăng nhập để thích sản phẩm.'); return; }
  const likesStore = JSON.parse(localStorage.getItem('ws_likes') || '{}');
  const arr = likesStore[productId] || [];
  if(arr.includes(state.user.name)) likesStore[productId] = arr.filter(u=>u !== state.user.name);
  else likesStore[productId] = [...arr, state.user.name];
  localStorage.setItem('ws_likes', JSON.stringify(likesStore));
  // refresh modal if open
  const title = document.querySelector('.modal .modal-info h2')?.textContent;
  if(title){
    const p = PRODUCTS.find(x=>x.name === title);
    if(p) openProductModal(p.id);
  } else renderFlashSale();
}

/* ========== Comments ========== */
function submitComment(productId){
  if(!state.user){ alert('Bạn cần đăng nhập để bình luận.'); return; }
  const textEl = document.getElementById('commentInput');
  const starEl = document.getElementById('starSelect');
  const text = textEl.value.trim(); const stars = Number(starEl.value);
  if(!text){ alert('Nhập nội dung bình luận.'); return; }
  const commentsStore = JSON.parse(localStorage.getItem('ws_comments') || '{}');
  const arr = commentsStore[productId] || [];
  arr.unshift({ user: state.user.name, text, stars, time: Date.now() });
  commentsStore[productId] = arr;
  localStorage.setItem('ws_comments', JSON.stringify(commentsStore));
  // naive update product rating/reviews
  const p = PRODUCTS.find(x=>x.id === productId);
  if(p){ p.reviews = (p.reviews||0) + 1; p.rating = Math.min(5, ((p.rating*(p.reviews-1)) + stars)/p.reviews); }
  openProductModal(productId);
}

/* ========== CART ========== */
function addToCart(id){
  const existing = state.cart.find(i=>i.id === id);
  if(existing) existing.qty += 1; else state.cart.push({ id, qty: 1 });
  saveCart(); alert('Đã thêm vào giỏ hàng');
}
function saveCart(){ localStorage.setItem('ws_cart', JSON.stringify(state.cart)); renderCartCount(); }
function renderCartCount(){ const count = state.cart.reduce((s,i)=>s + i.qty, 0); $.cartCount.textContent = count; }

/* show cart modal (VIẾT LẠI TRONG CODE 06) */
$.cartBtn.addEventListener('click', showCartModal);
function showCartModal(){
  $.modalRoot.innerHTML = ''; $.modalRoot.classList.add('show');
  const modal = document.createElement('div'); modal.className = 'modal';
  let total = 0;
  
  // Tạo danh sách item và tính tổng tiền
  const itemsTextArray = []; // Dùng để tạo nội dung email
  
  const itemsHTML = state.cart.map(ci => {
    const p = PRODUCTS.find(x=>x.id === ci.id);
    if(!p) return '';
    const sub = p.priceNew * ci.qty; total += sub;
    
    // Thêm vào mảng text
    itemsTextArray.push(`- ${ci.qty} x ${p.name} (${fmt(sub)})`);
    
    // HTML để hiển thị
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 8px;">
      <div><strong>${escapeHTML(p.name)}</strong><div class="small-muted">x${ci.qty}</div></div>
      <div>${fmt(sub)} <button data-id="${ci.id}" class="page-btn del-item">Xóa</button></div>
    </div>`;
  }).join('');
  
  modal.innerHTML = `
    <h2>Giỏ hàng</h2>
    ${itemsHTML || '<div class="small-muted">Giỏ hàng trống</div>'}
    <div class="hr"></div>
    <div><strong>Tổng: ${fmt(total)}</strong></div>
    <div style="margin-top:12px; display:flex; justify-content:flex-end; gap: 8px;">
      <button id="clearCart" class="page-btn">Xóa toàn bộ</button>
      <button id="closeCart" class="page-btn">Đóng</button>
      <button id="checkoutBtn" class="btn" style="background: var(--brand); color: white;">Thanh toán</button>
    </div>
  `;
  $.modalRoot.appendChild(modal);
  
  // Gán sự kiện
  document.getElementById('closeCart').addEventListener('click', closeModal);
  document.getElementById('clearCart').addEventListener('click', ()=> { 
    if(confirm('Xóa toàn bộ giỏ hàng?')){ state.cart = []; saveCart(); closeModal(); } 
  });
  modal.querySelectorAll('.del-item').forEach(b=> b.addEventListener('click', ()=> { 
    const id = b.dataset.id; 
    state.cart = state.cart.filter(ci=>ci.id !== id); 
    saveCart(); 
    showCartModal(); 
  }));
  $.modalRoot.addEventListener('click', e=> { if(e.target === $.modalRoot) closeModal(); });

  // === LOGIC THANH TOÁN "mailto:" MỚI (CODE 06) ===
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (state.cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống.'); return;
    }
    if (!state.user) {
      alert('Bạn cần đăng nhập để tiến hành thanh toán.');
      closeModal(); // Đóng giỏ hàng
      openLoginModal(); // Mở đăng nhập
      return;
    }
    
    // CHUẨN BỊ NỘI DUNG EMAIL
    const emailTo = 'phamthanhduongoppo@gmail.com'; // Email của bạn
    const subject = `Đơn hàng mới từ WheyShop.vn - Khách: ${state.user.name}`;
    
    // Nội dung email
    let body = `
      Có đơn hàng mới từ khách: ${state.user.name}
      -------------------------------------
      CHI TIẾT ĐƠN HÀNG:
      
      ${itemsTextArray.join('\n')}
      
      -------------------------------------
      TỔNG CỘNG: ${fmt(total)}
      
      (Đây là email được tạo tự động từ website, vui lòng liên hệ khách hàng để xác nhận.)
    `;
    
    // Mã hóa nội dung để đưa vào link mailto:
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Tạo link mailto:
    const mailtoLink = `mailto:${emailTo}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Mở ứng dụng email của khách hàng
    window.location.href = mailtoLink;
    
    // Giả lập thanh toán thành công (xóa giỏ hàng)
    alert(`Đang mở ứng dụng Email để gửi hóa đơn... \nSau khi gửi, đơn hàng của bạn sẽ được xử lý.`);
    state.cart = [];
    saveCart();
    closeModal();
  });
}

/* ========== MOCK LOGIN (Từ Code 05) ========== */
$.loginBtn.addEventListener('click', ()=> { if(state.user) openProfileModal(); else openLoginModal(); });

// Hàm helper để xử lý đăng nhập
function doLogin(name) {
  if(!name){ alert('Vui lòng nhập tên hiển thị'); return; }
  state.user = { name };
  localStorage.setItem('ws_user', JSON.stringify(state.user));
  renderAuth();
  closeModal();
}

// Hàm đăng nhập mới với Google/Facebook/Email
function openLoginModal(){
  $.modalRoot.innerHTML=''; $.modalRoot.classList.add('show');
  const modal = document.createElement('div'); modal.className='modal';
  modal.style.maxWidth = '450px'; // Thu nhỏ modal đăng nhập cho đẹp
  
  modal.innerHTML = `
    <h2 style="text-align: center;">Đăng nhập</h2>
    <div class="login-options">
      <button id="googleLogin" class="social-btn google">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,5 12,5C14.6,5 16.1,6.1 17.05,7.05L19.25,4.85C17.1,2.9 14.4,2 12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,11.64 21.95,11.36 21.85,11.1Z"></path></svg>
        Tiếp tục với Google
      </button>
      <button id="fbLogin" class="social-btn facebook">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.32 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 12 2.04Z"></path></svg>
        Tiếp tục với Facebook
      </button>
    </div>
    <div class="login-divider"><span>HOẶC</span></div>
    <div class="form-group">
      <label for="loginEmail">Tên hiển thị (hoặc email)</label>
      <input id="loginEmail" type="text" placeholder="Nhập tên của bạn...">
    </div>
    <div class="form-group">
      <label for="loginPass">Mật khẩu (giả lập)</label>
      <input id="loginPass" type="password" placeholder="••••••••">
    </div>
    <div style="margin-top:16px; display:flex; gap: 8px;">
      <button id="closeLogin" class="page-btn" style="flex:1;">Hủy</button>
      <button id="doLogin" class="btn" style="flex:2;">Đăng nhập</button>
    </div>`;
  $.modalRoot.appendChild(modal);

  // Gán event
  document.getElementById('doLogin').addEventListener('click', ()=> doLogin(document.getElementById('loginEmail').value.trim()));
  document.getElementById('googleLogin').addEventListener('click', ()=> doLogin('Google User')); // Giả lập
  document.getElementById('fbLogin').addEventListener('click', ()=> doLogin('Facebook User')); // Giả lập
  document.getElementById('closeLogin').addEventListener('click', closeModal);
  $.modalRoot.addEventListener('click', e=> { if(e.target === $.modalRoot) closeModal(); });
}

// Cập nhật Profile Modal cho đẹp hơn
function openProfileModal(){
  $.modalRoot.innerHTML=''; $.modalRoot.classList.add('show');
  const modal = document.createElement('div'); modal.className='modal';
  modal.style.maxWidth = '450px'; // Thu nhỏ modal
  
  modal.innerHTML = `
    <h2>Tài khoản</h2>
    <div class="small-muted">Bạn đang đăng nhập với tên: <strong>${escapeHTML(state.user.name)}</strong></div>
    <div style="margin-top:12px; display: flex; gap: 8px;">
      <button id="logoutNow" class="page-btn" style="flex:1;">Đăng xuất</button>
      <button id="closeProfile" class="btn" style="flex:1;">Đóng</button>
    </div>`;
  $.modalRoot.appendChild(modal);
  
  document.getElementById('logoutNow').addEventListener('click', ()=> { state.user = null; localStorage.removeItem('ws_user'); renderAuth(); closeModal(); });
  document.getElementById('closeProfile').addEventListener('click', closeModal);
  $.modalRoot.addEventListener('click', e=> { if(e.target === $.modalRoot) closeModal(); });
}

function renderAuth(){ $.loginBtn.textContent = state.user ? state.user.name : 'Đăng nhập'; }

/* ========== THEME ========== */
function restoreTheme(){ if(localStorage.getItem('ws_theme') === 'dark') document.body.classList.add('dark'); }
$.themeToggle.addEventListener('click', ()=> { document.body.classList.toggle('dark'); localStorage.setItem('ws_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); });

/* ========== SEARCH (debounce) ========== */
function debounce(fn, delay=350){ let t; return (...args) => { clearTimeout(t); t = setTimeout(()=> fn(...args), delay); }; }
$.globalSearch.addEventListener('input', debounce((e)=> {
  state.query = e.target.value.trim().toLowerCase();
  renderFlashSale(); // Vẫn giữ lọc flash sale
  renderAllFilteredProducts(); // Lọc các sản phẩm khác
}, 350));

/* helper to re-render flash and products with search */
function renderAllFilteredProducts(){
  // flash remain same but we filter displayed others by search
  const others = PRODUCTS.filter(p => !p.flash && (!state.query || p.name.toLowerCase().includes(state.query) || p.brand.toLowerCase().includes(state.query)));
  $.productGrid.innerHTML = '';
  if (others.length === 0 && state.query) {
    $.productGrid.innerHTML = '<div class="small-muted">Không tìm thấy sản phẩm nào.</div>';
  }
  others.forEach(p => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <div style="position:relative"><img src="${p.img}" alt="${escapeHTML(p.name)}" />${p.priceOld ? `<div class="badge">${Math.round((1 - p.priceNew / p.priceOld) * 100)}% GIẢM</div>` : ''}</div>
      <div class="title">${escapeHTML(p.name)}</div>
      <div class="meta"><div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div><div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div>${p.priceOld?`<div class="price-old">${fmt(p.priceOld)}</div>`:''}</div></div>
      <div class="promos">${(p.promo||[]).map(x => `<span class="promo">${escapeHTML(x)}</span>`).join('')}</div>
    `;
    c.addEventListener('click', ()=> openProductModal(p.id));
    $.productGrid.appendChild(c);
  });
}

/* ========== ATTACH EVENTS ========== */
function attachEvents(){
  // category click (just visual highlight + simple filter behavior)
  document.querySelectorAll('.category-nav .cat-item').forEach(item => {
    item.addEventListener('click', ()=> {
      document.querySelectorAll('.category-nav .cat-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      const cat = item.dataset.cat;
      // basic behaviour: if user clicks "flash" scroll to flash section; if "new" or others, scroll to products
      if(cat === 'flash') window.scrollTo({ top: document.querySelector('.flash-section').offsetTop - 100, behavior: 'smooth' });
      else window.scrollTo({ top: document.querySelector('.all-products').offsetTop - 100, behavior: 'smooth' });
    });
  });

  // keyboard ESC closes modals
  window.addEventListener('keydown', (e)=> { if(e.key === 'Escape' && $.modalRoot.classList.contains('show')) closeModal(); });
}

/* highlight category helper */
function highlightCategory(key){
  document.querySelectorAll('.category-nav .cat-item').forEach(i=> i.classList.toggle('active', i.dataset.cat === key));
}

/* ========== renderFlashSale updated to consider search (if any) ========== */
function renderFlashSale(){
  const flash = PRODUCTS.filter(p => p.flash && (!state.query || p.name.toLowerCase().includes(state.query) || p.brand.toLowerCase().includes(state.query)));
  $.flashGrid.innerHTML = '';
   if (flash.length === 0 && state.query) {
    $.flashGrid.innerHTML = '<div class="small-muted">Không tìm thấy sản phẩm flash sale.</div>';
  }
  flash.forEach(p => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <div style="position:relative"><img src="${p.img}" alt="${escapeHTML(p.name)}" /><div class="badge">${Math.round((1 - p.priceNew / p.priceOld) * 100)}% GIẢM</div></div>
      <div class="title">${escapeHTML(p.name)}</div>
      <div class="meta"><div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div><div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div><div class="price-old">${fmt(p.priceOld)}</div></div></div>
    `;
    card.addEventListener('click', ()=> openProductModal(p.id));
    $.flashGrid.appendChild(card);
  });
}

/* ========== fallback render all when not searching ========== */
function renderAllProducts(){
  renderAllFilteredProducts();
}

/* ========== initial helpers ========== */
function renderCartCount(){ const count = state.cart.reduce((s,i)=>s + i.qty, 0); $.cartCount.textContent = count; }
/* ========== MENU DANH MỤC GỌN ========== */
const toggleBtn = document.getElementById('toggleMenu');
const categoryMenu = document.getElementById('categoryMenu');

// Ẩn/hiện menu khi nhấn nút "Danh mục"
if (toggleBtn && categoryMenu) {
  toggleBtn.addEventListener('click', () => {
    categoryMenu.classList.toggle('hidden');
  });
}

// Lọc sản phẩm theo danh mục
document.querySelectorAll('.cat-item').forEach(item => {
  item.addEventListener('click', () => {
    const cat = item.dataset.cat;
    highlightCategory(cat);
    
    // Xóa query tìm kiếm cũ
    $.globalSearch.value = '';
    state.query = '';

    // Nếu chọn Trang chủ → hiện toàn bộ
    if (cat === 'home') {
      renderFlashSale();
      renderAllProducts();
      categoryMenu.classList.add('hidden');
      return;
    }
    
    // Lọc sản phẩm (chỉ hiển thị loại phù hợp)
    const filteredFlash = PRODUCTS.filter(p => 
      p.flash && (
        p.type.toLowerCase().includes(cat) ||
        p.brand.toLowerCase().includes(cat) ||
        p.name.toLowerCase().includes(cat)
      )
    );
    
    const filteredOthers = PRODUCTS.filter(p =>
      !p.flash && (
        p.type.toLowerCase().includes(cat) ||
        p.brand.toLowerCase().includes(cat) ||
        p.name.toLowerCase().includes(cat)
      )
    );
    
    // Render Flash Sale đã lọc
    const flashGrid = document.getElementById('flashGrid');
    flashGrid.innerHTML = '';
    if (filteredFlash.length > 0) {
      filteredFlash.forEach(p => {
        const card = document.createElement('div'); card.className = 'card';
        card.innerHTML = `
          <div style="position:relative"><img src="${p.img}" alt="${escapeHTML(p.name)}" /><div class="badge">${Math.round((1 - p.priceNew / p.priceOld) * 100)}% GIẢM</div></div>
          <div class="title">${escapeHTML(p.name)}</div>
          <div class="meta"><div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div><div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div><div class="price-old">${fmt(p.priceOld)}</div></div></div>
        `;
        card.addEventListener('click', ()=> openProductModal(p.id));
        flashGrid.appendChild(card);
      });
    } else {
       flashGrid.innerHTML = '<div class="small-muted">Không có sản phẩm Flash Sale phù hợp.</div>';
    }

    // Render Sản phẩm khác đã lọc
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
     if (filteredOthers.length > 0) {
      filteredOthers.forEach(p => {
        const c = document.createElement('div');
        c.className = 'card';
        c.innerHTML = `
          <div style="position:relative"> <img src="${p.img}" alt="${escapeHTML(p.name)}" /> </div>
          <div class="title">${escapeHTML(p.name)}</div>
          <div class="meta"> <div class="small-muted">${escapeHTML(p.brand)} • ${escapeHTML(p.type)}</div> <div class="price-group"><div class="price-new">${fmt(p.priceNew)}</div></div> </div>
          <div class="promos">${(p.promo||[]).map(x => `<span class="promo">${escapeHTML(x)}</span>`).join('')}</div>
        `;
        c.addEventListener('click', () => openProductModal(p.id));
        grid.appendChild(c);
      });
    } else {
      grid.innerHTML = '<div class="small-muted">Không có sản phẩm nào phù hợp.</div>';
    }


    // Ẩn menu sau khi chọn
    categoryMenu.classList.add('hidden');
  });
});
/* ========== NÚT TRANG CHỦ (HIỂN THỊ LẠI TOÀN BỘ) ========== */
const homeBtn = document.getElementById('homeBtn');
if (homeBtn) {
  homeBtn.addEventListener('click', () => {
    // Xóa query tìm kiếm
    $.globalSearch.value = '';
    state.query = '';
    // Render lại
    renderFlashSale();
    renderAllProducts();
    highlightCategory('flash');
    // Ẩn menu nếu đang mở
    const categoryMenu = document.getElementById('categoryMenu');
    if (categoryMenu) categoryMenu.classList.add('hidden');
    // Cuộn lên đầu trang cho đẹp
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}