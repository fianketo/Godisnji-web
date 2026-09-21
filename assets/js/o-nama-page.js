// BIOTEST — kontakt forma (samo frontend, šalje preko mailto linka).

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const message = document.getElementById('c-message').value.trim();

    const subject = `Poruka sa sajta — ${name || 'posetilac'}`;
    const body = `${message}\n\n— ${name}${email ? ' (' + email + ')' : ''}`;
    const mailto = `mailto:biotest.novi.sad@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  });
})();
