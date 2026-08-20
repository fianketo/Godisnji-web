// BIOTEST — generisanje popust koda (bez naloga/lozinke).

(function () {
  const { generateDiscountCode, saveDiscountLead, DISCOUNT_PERCENT } = window.Biotest;

  const form = document.getElementById('discount-form');
  const nameInput = document.getElementById('name');
  const contactInput = document.getElementById('contact');
  const codeResult = document.getElementById('code-result');
  const codePlaceholder = document.getElementById('code-placeholder');
  const codeValueEl = document.getElementById('code-value');
  const codePercentEls = document.querySelectorAll('[data-discount-percent]');

  codePercentEls.forEach((el) => { el.textContent = DISCOUNT_PERCENT; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    if (!name || !contact) return;

    const code = generateDiscountCode();
    saveDiscountLead(name, contact, code);

    codeValueEl.textContent = code;
    codeResult.style.display = 'block';
    codePlaceholder.style.display = 'none';
    codeResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
