(() => {
  const approvedBookIds = [
    's01','s02','s03','s04','s05','s06','s07','s08',
    's10','s11','s14','s15','s17','s23','s24','s30'
  ];
  const approved = new Set(approvedBookIds);

  function applyApprovedLibrary() {
    try {
      if (typeof STORIES === 'undefined' || !Array.isArray(STORIES)) return false;

      const books = STORIES.filter(item => item && item.program === 'שעת סיפור והמחשה');
      const otherActivities = STORIES.filter(item => !item || item.program !== 'שעת סיפור והמחשה');
      const selectedBooks = books
        .filter(item => approved.has(item.id))
        .sort((a, b) => approvedBookIds.indexOf(a.id) - approvedBookIds.indexOf(b.id))
        .map((item, index) => ({ ...item, num: index + 1 }));

      if (selectedBooks.length !== approvedBookIds.length) {
        console.error('[StoryOS V21] Book library mismatch', {
          expected: approvedBookIds.length,
          found: selectedBooks.length,
          ids: selectedBooks.map(x => x.id)
        });
        return false;
      }

      STORIES.splice(0, STORIES.length, ...selectedBooks, ...otherActivities);
      window.__STORYOS_V21_BOOK_LIBRARY__ = {
        count: selectedBooks.length,
        ids: selectedBooks.map(x => x.id),
        titles: selectedBooks.map(x => x.title),
        updatedAt: '2026-08-22'
      };

      // Remove stale favorites that point at story books no longer in V21.
      try {
        if (typeof favs !== 'undefined' && favs && typeof favs.forEach === 'function') {
          [...favs].forEach(id => {
            if (/^s\d+$/i.test(String(id)) && !approved.has(id)) favs.delete(id);
          });
        }
      } catch (_) {}

      // Refresh visible StoryOS data after filtering.
      try {
        if (typeof render === 'function') render();
      } catch (err) {
        console.warn('[StoryOS V21] render refresh skipped', err);
      }

      // A small machine-readable marker used for Preview verification.
      let marker = document.getElementById('storyosV21BookLibraryMarker');
      if (!marker) {
        marker = document.createElement('meta');
        marker.id = 'storyosV21BookLibraryMarker';
        marker.name = 'storyos-v21-book-count';
        document.head.appendChild(marker);
      }
      marker.content = String(selectedBooks.length);

      console.info('[StoryOS V21] approved story library loaded:', selectedBooks.length, selectedBooks.map(x => x.title));
      return true;
    } catch (err) {
      console.error('[StoryOS V21] failed to apply approved book library', err);
      return false;
    }
  }

  if (!applyApprovedLibrary()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (applyApprovedLibrary() || tries >= 20) clearInterval(timer);
    }, 100);
  }
})();
