(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  function showLoader() {
    loader.style.opacity = '1';
    loader.style.pointerEvents = 'all';
  }

  function hideLoader() {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    if (
      link.target === '_blank' ||
      link.href.startsWith('javascript') ||
      link.href.includes('#') ||
      link.getAttribute('onclick')
    ) return;
    showLoader();
  });

  document.addEventListener('submit', function () {
    showLoader();
  });

  window.addEventListener('pageshow', hideLoader);
  window.addEventListener('load', hideLoader);
})();
