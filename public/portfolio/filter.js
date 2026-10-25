'use strict';
(() => {
  const search = document.querySelector('#search');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const groups = [...document.querySelectorAll('.project-group')];
  const catalogSize = document.querySelectorAll('.project').length;
  const normalize = value => value.toLocaleLowerCase('sl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let door = 'all';
  function apply() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let total = 0;
    for (const group of groups) {
      let visible = 0;
      for (const card of group.querySelectorAll('.project')) {
        const match = (door === 'all' || group.dataset.door === door) &&
          terms.every(term => normalize(card.dataset.search).includes(term));
        card.hidden = !match;
        if (match) visible += 1;
      }
      group.hidden = visible === 0;
      group.querySelector('.group-count').textContent = String(visible).padStart(2, '0');
      total += visible;
    }
    document.querySelector('#result-count').textContent = `${total} / ${catalogSize} projektov`;
    document.querySelector('#empty').hidden = total !== 0;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === door));
  }
  search.addEventListener('input', apply);
  for (const button of buttons) button.addEventListener('click', () => { door = button.dataset.filter; apply(); });
  // Door links also clear an earlier search/filter, so their target stays visible.
  for (const link of document.querySelectorAll('.doors a')) link.addEventListener('click', () => {
    door = 'all'; search.value = ''; apply();
  });
})();
