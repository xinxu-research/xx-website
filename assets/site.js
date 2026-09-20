(() => {
  const pageDataElement = document.getElementById('page-data');
  const pageData = pageDataElement ? JSON.parse(pageDataElement.textContent) : {};
  const publications = pageData.publications || [];
  const projects = pageData.projects || [];

  function renderPublicationRichText(value) {
    return String(value || '')
      .replace(/\(\s*(\d{4})\s*,\s*[A-Za-z]+\s+\d{1,2}\s*\)/g, '($1)')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  }

  function renderPublicationApa(publication) {
    const formatted = renderPublicationRichText(publication.apa);
    const urlMatch = formatted.match(/https?:\/\/[^\s<)]+/);
    if (!urlMatch) return formatted;
    const url = urlMatch[0];
    const linkText = url.startsWith('https://doi.org/') ? url : 'View publication';
    return formatted.replace(url, `<a href="${url}" target="_blank" rel="noopener">${linkText}</a>`);
  }

  function buildProjectOutcomes(items) {
    if (!Array.isArray(items) || !items.length) return '';
    const rendered = items.map(item => `<a href="${item.url}" target="_blank" rel="noopener"><i>${item.title}</i></a>`);
    return rendered.length > 1 ? `<ul class="quiet-list">${rendered.map(item => `<li>${item}</li>`).join('')}</ul>` : rendered[0];
  }

  function showDetails(element) {
    const kind = element.dataset.kind;
    if (kind === 'publication') {
      const publication = publications[Number(element.dataset.index)];
      if (!publication) return;
      document.getElementById('modalType').textContent = 'Publication';
      document.getElementById('modalTitle').textContent = publication.title;

      let bodyHtml = '';
      if (publication.summary) bodyHtml += `<div class="detail summary-detail"><strong>Summary</strong><p>${renderPublicationRichText(publication.summary)}</p></div>`;
      if (publication.titleZh) bodyHtml += `<div class="detail"><strong>Title in Chinese</strong><p>${publication.titleZh}</p></div>`;
      if (publication.authors) bodyHtml += `<div class="detail"><strong>Author(s)</strong><p>${publication.authors}</p></div>`;
      else if (publication.editors) bodyHtml += `<div class="detail"><strong>Editors</strong><p>${publication.editors}</p></div>`;
      if (publication.type) bodyHtml += `<div class="detail"><strong>Type</strong><p>${publication.type}</p></div>`;
      if (publication.year) bodyHtml += `<div class="detail"><strong>Year</strong><p>${publication.year}</p></div>`;
      if (publication.themes && publication.themes.length) bodyHtml += `<div class="detail themes-detail"><strong>Theme(s)</strong><p>${publication.themes.join('; ')}</p></div>`;
      if (publication.apa) bodyHtml += `<div class="detail"><strong>APA reference</strong><p>${renderPublicationApa(publication)}</p></div>`;
      document.getElementById('modalBody').innerHTML = bodyHtml;
    } else if (kind === 'project') {
      const project = projects[Number(element.dataset.index)];
      if (!project) return;
      document.getElementById('modalType').textContent = 'Research project';
      document.getElementById('modalTitle').textContent = project.title;

      let bodyHtml = '';
      if (project.summary) bodyHtml += `<div class="detail"><strong>Project summary</strong><p>${project.summary}</p></div>`;
      if (project.funder) bodyHtml += `<div class="detail"><strong>Funder</strong><p>${project.funder}</p></div>`;
      if (project.dates) bodyHtml += `<div class="detail"><strong>Year</strong><p>${project.dates}</p></div>`;
      if (project.role) bodyHtml += `<div class="detail"><strong>Role</strong><p>${project.role}</p></div>`;
      if (project.themes && project.themes.length) bodyHtml += `<div class="detail themes-detail"><strong>Theme(s)</strong><p>${project.themes.join('; ')}</p></div>`;
      const outcomesHtml = buildProjectOutcomes(project.selectedPublications);
      if (outcomesHtml) bodyHtml += `<div class="detail"><strong>Selected publication(s)</strong><p>${outcomesHtml}</p></div>`;
      if (project.projectPage) bodyHtml += `<div class="detail"><strong>Project page</strong><p><a href="${project.projectPage}" target="_blank" rel="noopener">${project.projectPage}</a></p></div>`;
      document.getElementById('modalBody').innerHTML = bodyHtml;
    }

    document.getElementById('modalBackdrop').classList.add('open');
    document.getElementById('modalClose').focus();
  }

  function closeDetails() {
    document.getElementById('modalBackdrop').classList.remove('open');
  }

  function applyFilters() {
    const isPublications = document.body.dataset.route === 'publications';
    const isProjects = document.body.dataset.route === 'projects';
    if (!isPublications && !isProjects) return;

    const cards = [...document.querySelectorAll('.panel[data-panel="catalogue"] .item')];
    const selectedThemes = [...document.querySelectorAll('input[data-filter="theme"]:checked')].map(input => input.value);
    const selectedTypes = [...document.querySelectorAll('input[data-filter="type"]:checked')].map(input => input.value);
    const query = (document.getElementById('search')?.value || '').toLowerCase().trim();

    let shown = 0;
    cards.forEach(card => {
      const cardThemes = (card.dataset.themes || '').split(';').map(theme => theme.trim()).filter(Boolean);
      const cardType = card.dataset.type || '';
      const searchText = card.dataset.search || card.textContent.toLowerCase();
      const themeMatches = !selectedThemes.length || selectedThemes.some(theme => cardThemes.includes(theme));
      const typeMatches = !isPublications || !selectedTypes.length || selectedTypes.includes(cardType);
      const searchMatches = !query || searchText.includes(query);
      const visible = themeMatches && typeMatches && searchMatches;
      card.style.display = visible ? 'block' : 'none';
      if (visible) shown += 1;
    });

    if (isProjects || isPublications) {
      document.querySelectorAll('.panel[data-panel="catalogue"] .project-group-label').forEach(label => {
        let next = label.nextElementSibling;
        let hasVisible = false;
        while (next && !next.classList.contains('project-group-label')) {
          if (next.style.display !== 'none') hasVisible = true;
          next = next.nextElementSibling;
        }
        label.style.display = hasVisible ? 'block' : 'none';
      });
    }

    const emptyElement = document.querySelector('.filter-empty');
    if (emptyElement) emptyElement.style.display = shown ? 'none' : 'block';
    document.querySelectorAll('[data-filter-menu]').forEach(menu => {
      const kind = menu.dataset.filterMenu;
      const values = kind === 'theme' ? selectedThemes : selectedTypes;
      menu.querySelector('summary').textContent = `${kind === 'theme' ? 'Theme' : 'Type'}: ${values.length ? values.join(', ') : 'All'}`;
    });
  }

  document.querySelectorAll('#app .clickable').forEach(element => {
    element.addEventListener('click', () => showDetails(element));
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showDetails(element);
      }
    });
  });

  if (document.body.dataset.route === 'publications' || document.body.dataset.route === 'projects') {
    document.querySelectorAll('input[data-filter]').forEach(input => input.addEventListener('change', applyFilters));
    document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
      document.querySelectorAll('input[data-filter]').forEach(input => { input.checked = false; });
      if (document.getElementById('search')) document.getElementById('search').value = '';
      applyFilters();
    });
    document.getElementById('search')?.addEventListener('input', applyFilters);
    applyFilters();
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    const elements = [hero.querySelector('h1'), hero.querySelector('.lead:first-of-type'), hero.querySelector('.role-note')].filter(Boolean);
    elements.forEach(element => element.classList.remove('welcome-motion'));
    void hero.offsetWidth;
    requestAnimationFrame(() => elements.forEach(element => element.classList.add('welcome-motion')));
  }

  const contactArt = document.querySelector('.contact-page-art img');
  if (contactArt) {
    const reveal = () => contactArt.classList.add('contact-art-ready');
    if (contactArt.complete) reveal();
    else contactArt.addEventListener('load', reveal, { once: true });
    contactArt.decode?.().then(reveal).catch(reveal);
  }

  document.addEventListener('click', event => {
    document.querySelectorAll('details.filter-menu[open]').forEach(menu => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });

  const filterCloseTimers = new WeakMap();
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'mouse') return;
    const menu = event.target.closest('details.filter-menu');
    if (menu) clearTimeout(filterCloseTimers.get(menu));
  });
  document.addEventListener('pointerout', event => {
    if (event.pointerType !== 'mouse') return;
    const menu = event.target.closest('details.filter-menu');
    if (menu && (!event.relatedTarget || !menu.contains(event.relatedTarget))) {
      clearTimeout(filterCloseTimers.get(menu));
      filterCloseTimers.set(menu, setTimeout(() => menu.removeAttribute('open'), 220));
    }
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.drop')) document.querySelector('.dropbtn')?.blur();
  });
  document.querySelectorAll('.dropmenu a').forEach(link => link.addEventListener('click', () => setTimeout(() => {
    document.activeElement?.blur();
    document.querySelector('.dropbtn')?.blur();
  }, 0)));

  const researchDrop = document.querySelector('.drop');
  const researchButton = document.querySelector('.dropbtn');
  const researchMenu = document.getElementById('research-menu');
  const setResearchMenu = open => {
    researchDrop?.classList.toggle('is-open', open);
    researchDrop?.classList.toggle('is-closed', !open);
    researchButton?.setAttribute('aria-expanded', String(open));
  };
  researchButton?.addEventListener('click', event => {
    event.preventDefault();
    setResearchMenu(!researchDrop?.classList.contains('is-open'));
  });
  researchMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setResearchMenu(false)));
  document.addEventListener('click', event => {
    if (!researchDrop?.contains(event.target)) setResearchMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setResearchMenu(false);
      researchButton?.focus();
      closeDetails();
    }
  });

  document.getElementById('modalClose').addEventListener('click', closeDetails);
  document.getElementById('modalBackdrop').addEventListener('click', event => {
    if (event.target.id === 'modalBackdrop') closeDetails();
  });
})();
