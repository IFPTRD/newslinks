document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('custom-links-container');
  const form = document.getElementById('custom-link-form');
  const nameInput = document.getElementById('custom-link-name');
  const urlInput = document.getElementById('custom-link-url');
  if (!container || !form || !nameInput || !urlInput) return;

  const removeLabel = container.dataset.removeLabel || 'Remove';

  function getLinks() {
    try {
      return JSON.parse(localStorage.getItem('customLinks')) || [];
    } catch (e) {
      return [];
    }
  }

  function saveLinks(links) {
    localStorage.setItem('customLinks', JSON.stringify(links));
  }

  function renderLinks() {
    const links = getLinks();
    container.innerHTML = '';
    links.forEach(function(link, index) {
      const wrapper = document.createElement('span');
      wrapper.className = 'custom-link-item';

      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = removeLabel;
      removeBtn.className = 'remove-link';
      removeBtn.addEventListener('click', function() {
        const links = getLinks();
        links.splice(index, 1);
        saveLinks(links);
        renderLinks();
      });

      wrapper.appendChild(a);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);
    });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!name || !url) return;
    const links = getLinks();
    links.push({ name: name, url: url });
    saveLinks(links);
    nameInput.value = '';
    urlInput.value = '';
    renderLinks();
  });

  renderLinks();
});
