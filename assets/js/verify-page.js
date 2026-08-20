// BIOTEST — provera koda porudžbine za osoblje: ručni unos ili skeniranje QR
// koda kamerom (jsQR), pretraga u Firestore ("orders" kolekcija, id dokumenta
// je sam kod) i označavanje kao iskorišćen da se spreči ponovna upotreba.

(function () {
  const notConfiguredEl = document.getElementById('verify-not-configured');
  const loginEl = document.getElementById('verify-login');
  const appEl = document.getElementById('verify-app');
  const userBadge = document.getElementById('verify-user-badge');
  const userEmailEl = document.getElementById('verify-user-email');

  if (!window.Biotest.firebaseReady) {
    notConfiguredEl.style.display = 'block';
    return;
  }

  const auth = window.Biotest.auth;
  const db = window.Biotest.db;
  const { formatPromoPrice } = window.Biotest;

  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  const codeInput = document.getElementById('code-input');
  const lookupBtn = document.getElementById('lookup-btn');
  const lookupMsg = document.getElementById('lookup-msg');
  const resultEl = document.getElementById('verify-result');
  const resultCode = document.getElementById('result-code');
  const resultStatus = document.getElementById('result-status');
  const resultCustomer = document.getElementById('result-customer');
  const resultItems = document.getElementById('result-items');
  const resultTotal = document.getElementById('result-total');
  const redeemBtn = document.getElementById('redeem-btn');

  const scanBtn = document.getElementById('scan-btn');
  const scanClose = document.getElementById('scan-close');
  const cameraBox = document.getElementById('verify-camera');
  const scanVideo = document.getElementById('scan-video');

  let currentOrderId = null;
  let stream = null;
  let scanRafId = null;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value)
      .catch((err) => {
        loginError.textContent = 'Neuspešna prijava: ' + err.message;
        loginError.style.display = 'block';
      });
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginEl.style.display = 'none';
      appEl.style.display = 'block';
      userBadge.style.display = 'flex';
      userEmailEl.textContent = user.email;
    } else {
      loginEl.style.display = 'block';
      appEl.style.display = 'none';
      userBadge.style.display = 'none';
      stopCamera();
    }
  });

  function normalizeCode(raw) {
    return raw.trim().toUpperCase();
  }

  function showMsg(text, ok) {
    lookupMsg.textContent = text;
    lookupMsg.className = 'promo-status-msg ' + (ok ? 'ok' : 'err');
    lookupMsg.style.display = 'block';
  }

  function lookupCode() {
    const code = normalizeCode(codeInput.value);
    if (!code) return;
    lookupMsg.style.display = 'none';
    resultEl.style.display = 'none';

    db.collection('orders').doc(code).get().then((doc) => {
      if (!doc.exists) {
        showMsg('Kod nije pronađen. Proverite da li je tačno unet.', false);
        return;
      }
      currentOrderId = doc.id;
      renderResult(doc.id, doc.data());
    }).catch((err) => showMsg('Greška: ' + err.message, false));
  }

  function renderResult(code, order) {
    resultCode.textContent = code;
    const used = order.status === 'iskorišćen';
    resultStatus.textContent = used ? 'Iskorišćen' : 'Nije iskorišćen';
    resultStatus.className = 'verify-status-badge ' + (used ? 'used' : 'unused');
    resultCustomer.textContent = `${order.customerName || ''} · ${order.customerEmail || ''}`;

    resultItems.innerHTML = (order.items || []).map((it) => `
      <div class="verify-item-row">
        <span>${it.name}</span>
        <span>${it.oldPrice ? `<span class="promo-old-price">${formatPromoPrice(it.oldPrice)}</span>` : ''}${formatPromoPrice(it.newPrice)}</span>
      </div>`).join('');
    resultTotal.textContent = formatPromoPrice(order.totalNew || 0);

    redeemBtn.style.display = used ? 'none' : 'block';
    resultEl.style.display = 'block';
  }

  redeemBtn.addEventListener('click', () => {
    if (!currentOrderId) return;
    redeemBtn.disabled = true;
    db.collection('orders').doc(currentOrderId).update({
      status: 'iskorišćen',
      redeemedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => db.collection('orders').doc(currentOrderId).get())
      .then((doc) => renderResult(doc.id, doc.data()))
      .finally(() => { redeemBtn.disabled = false; });
  });

  lookupBtn.addEventListener('click', lookupCode);
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); lookupCode(); }
  });

  function stopCamera() {
    if (scanRafId) cancelAnimationFrame(scanRafId);
    scanRafId = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    cameraBox.classList.remove('active');
  }

  function scanFrame(canvas, ctx) {
    if (scanVideo.readyState === scanVideo.HAVE_ENOUGH_DATA) {
      canvas.width = scanVideo.videoWidth;
      canvas.height = scanVideo.videoHeight;
      ctx.drawImage(scanVideo, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        codeInput.value = code.data;
        stopCamera();
        lookupCode();
        return;
      }
    }
    scanRafId = requestAnimationFrame(() => scanFrame(canvas, ctx));
  }

  scanBtn.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        scanVideo.srcObject = s;
        scanVideo.play();
        cameraBox.classList.add('active');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        scanRafId = requestAnimationFrame(() => scanFrame(canvas, ctx));
      })
      .catch((err) => showMsg('Kamera nije dostupna: ' + err.message, false));
  });

  scanClose.addEventListener('click', stopCamera);
})();
