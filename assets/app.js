import PhotoSwipe from './vendor/photoswipe.esm.min.js?v=39ee423a0e51';

const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const more = document.querySelector('#load-more');
const progress = document.querySelector('#progress');
let photos = [], shown = 0, viewer, trigger;
const blocks = [];
let framePending = false;
const imageJobs = new Map();
let wantedImages = [];

// Editorial translations: keep file names, catalogue positions and shared links unchanged.
const translations = {
  'pt-BR': {
    title: 'Álbum de Fotos do Casamento de Isadora e Daniel Melo',
    meta: 'Reviva o casamento de Isadora e Daniel Melo: um álbum de fotos com os sorrisos, abraços e momentos especiais desse dia. Veja, baixe e compartilhe as recordações.',
    social: 'Os sorrisos, os abraços e a alegria do casamento de Isadora e Daniel Melo. Um álbum para reviver, guardar e compartilhar esse dia especial.',
    site: 'Casamento de Isadora e Daniel Melo', socialAlt: 'Isadora e Daniel Melo juntos, ao lado dos nomes do casal e da frase O dia do nosso sim.',
    skip: 'Ir para as fotos', home: 'Isadora e Daniel Melo, início', header: 'Nosso álbum',
    day: 'O DIA DO NOSSO SIM', album: 'Álbum de fotos do nosso casamento',
    description: 'Um dia, tantos sentimentos.\nCada fotografia, um pedacinho do nosso para sempre.',
    explore: 'Reviver esse dia', memories: 'MEMÓRIAS PARA A VIDA INTEIRA', details: 'O amor em cada detalhe',
    hint: 'Abra uma foto.\nReviva um instante.', loading: 'Carregando foto…', unavailable: 'Foto indisponível',
    preparing: 'Preparando as recordações…', empty: 'As fotos deste álbum estarão disponíveis em breve.',
    albumError: 'Não foi possível carregar o álbum. ', retry: 'Tentar novamente', more: 'Carregar mais fotos',
    withLove: 'COM AMOR,', forever: 'Que a gente nunca se esqueça de como foi bonito.', top: 'Voltar ao início',
    fixedTop: 'Ir Para o Topo', created: 'Criado por', with: 'com', love: 'amor', close: 'Fechar', zoom: 'Ampliar', previous: 'Foto anterior', next: 'Próxima foto',
    photoError: 'Não foi possível carregar esta foto. Feche e tente novamente.', actions: 'Ações da foto',
    download: 'Baixar Foto HD', share: 'Compartilhar', copied: 'Link copiado!', copyPrompt: 'Copie o link desta recordação:',
    open: n => `Ampliar foto ${n}`, alt: n => `Recordação do casamento de Isadora e Daniel Melo — foto ${n}`,
    progress: (n, total) => `${n} de ${total} recordações`, language: 'Escolher idioma / Choose language',
  },
  'en-AU': {
    title: 'Isadora & Daniel Melo — Wedding Photo Album',
    meta: 'Relive Isadora and Daniel Melo’s wedding through the smiles, embraces and little moments that made it so special. Browse, download and share your favourite photos.',
    social: 'The smiles, the embraces and the joy of Isadora and Daniel Melo’s wedding. A photo album to revisit, treasure and share.',
    site: 'Isadora & Daniel Melo’s Wedding', socialAlt: 'Isadora and Daniel Melo together, beside their names and the Portuguese words for The day we said I do.',
    skip: 'Skip to photos', home: 'Isadora and Daniel Melo, home', header: 'Our album',
    day: 'THE DAY WE SAID I DO', album: 'Our wedding photo album',
    description: 'One day. So many moments to treasure.\nEvery photo, a little piece of our forever.',
    explore: 'Relive our day', memories: 'MEMORIES TO LAST A LIFETIME', details: 'Love in every detail',
    hint: 'Open a photo.\nRelive a moment.', loading: 'Loading photo…', unavailable: 'Photo unavailable',
    preparing: 'Getting our memories ready…', empty: 'Photos from our day will be here soon.',
    albumError: 'We couldn’t load the album. ', retry: 'Try again', more: 'Load more photos',
    withLove: 'WITH LOVE,', forever: 'May we always remember how beautiful it was.', top: 'Back to the top',
    fixedTop: 'Back to top', created: 'Created by', with: 'with', love: 'love', close: 'Close', zoom: 'Zoom in', previous: 'Previous photo', next: 'Next photo',
    photoError: 'We couldn’t load this photo. Please close it and try again.', actions: 'Photo actions',
    download: 'Download HD photo', share: 'Share', copied: 'Link copied!', copyPrompt: 'Copy the link to this memory:',
    open: n => `Open photo ${n}`, alt: n => `Isadora and Daniel Melo’s wedding — photo ${n}`,
    progress: (n, total) => `${n} of ${total} memories`, language: 'Choose language / Escolher idioma',
  },
};
let language = 'pt-BR';
try {
  const saved = localStorage.getItem('wedding-language');
  language = Object.hasOwn(translations, saved) ? saved
    : navigator.language?.toLowerCase().startsWith('en') ? 'en-AU' : 'pt-BR';
} catch { language = navigator.language?.toLowerCase().startsWith('en') ? 'en-AU' : 'pt-BR'; }
const t = (key, ...args) => typeof translations[language][key] === 'function'
  ? translations[language][key](...args) : translations[language][key];
let albumState = 'preparing';
const creatorBar = document.querySelector('.creator-bar');
const languageToggle = document.querySelector('#language-toggle');
const languageMenu = document.querySelector('#language-menu');
const backToTop = document.querySelector('#back-to-top');
function updateBackToTop() {
  backToTop.hidden = Boolean(viewer) || document.querySelector('.intro').getBoundingClientRect().bottom > 0;
}
window.addEventListener('scroll', updateBackToTop, { passive: true });
window.addEventListener('resize', updateBackToTop);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(updateBackToTop).observe(document.querySelector('.intro'));
}
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  document.querySelector('.brand').focus({ preventScroll: true });
});

// Translate the leading text without replacing nested icons, counters or handlers.
function textOf(element, text) {
  if (!element) return;
  const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
  if (node) node.textContent = text;
  else element.prepend(document.createTextNode(text));
}
function updateAlbumStatus() {
  textOf(status, t(albumState));
  const retry = status.querySelector('button');
  if (retry) retry.textContent = t('retry');
}
function translateViewer(instance = viewer) {
  if (!instance) return;
  instance.element?.setAttribute('aria-label', t('title'));
  Object.assign(instance.options, {
    closeTitle: t('close'), zoomTitle: t('zoom'), arrowPrevTitle: t('previous'), arrowNextTitle: t('next'), errorMsg: t('photoError'),
  });
  for (const [selector, key] of [['.pswp__button--close', 'close'], ['.pswp__button--zoom', 'zoom'], ['.pswp__button--arrow--prev', 'previous'], ['.pswp__button--arrow--next', 'next']]) {
    const button = instance.element?.querySelector(selector);
    button?.setAttribute('title', t(key)); button?.setAttribute('aria-label', t(key));
  }
  instance.element?.querySelector('.pswp__actions')?.setAttribute('aria-label', t('actions'));
  instance.element?.querySelectorAll('.photo-action--download').forEach(button => {
    button.setAttribute('aria-label', t('download')); button.querySelector('span').textContent = t('download');
  });
  instance.element?.querySelectorAll('.photo-action--share span').forEach(label => {
    label.textContent = t(label.dataset.copied === 'true' ? 'copied' : 'share');
  });
  instance.element?.querySelectorAll('.pswp__photo-loading span:last-child').forEach(label => { label.textContent = t('loading'); });
  instance.element?.querySelectorAll('.pswp__error-msg').forEach(label => { label.textContent = t('photoError'); });
  instance.options.dataSource.forEach((data, i) => { data.alt = t('alt', i + 1); });
  instance.mainScroll?.itemHolders.forEach(holder => {
    if (holder.slide?.content.element?.tagName === 'IMG') holder.slide.content.element.alt = t('alt', holder.slide.index + 1);
  });
}
function applyLanguage() {
  document.documentElement.lang = language;
  document.title = t('title');
  for (const [selector, key] of [
    ['.skip', 'skip'], ['.header-note', 'header'], ['.intro .eyebrow', 'day'], ['.album-label', 'album'],
    ['.explore', 'explore'], ['.album-heading .eyebrow', 'memories'], ['#album-title', 'details'],
    ['#load-more', 'more'], ['footer .eyebrow', 'withLove'], ['footer p:not(.eyebrow)', 'forever'], ['footer a', 'top'],
  ]) textOf(document.querySelector(selector), t(key));
  for (const [selector, key] of [['.description', 'description'], ['.hint', 'hint']]) {
    const element = document.querySelector(selector);
    element.replaceChildren(...t(key).split('\n').flatMap((line, i) => i ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
  }
  document.querySelector('.brand').setAttribute('aria-label', t('home'));
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
  for (const [selector, key] of [['meta[name="description"]', 'meta'], ['meta[property="og:title"]', 'title'], ['meta[name="twitter:title"]', 'title'], ['meta[property="og:description"]', 'social'], ['meta[name="twitter:description"]', 'social'], ['meta[property="og:site_name"]', 'site'], ['meta[property="og:image:alt"]', 'socialAlt'], ['meta[name="twitter:image:alt"]', 'socialAlt']]) {
    document.querySelector(selector)?.setAttribute('content', t(key));
  }
  document.querySelector('meta[property="og:locale"]').content = language.replace('-', '_');
  document.querySelector('#total').textContent = photos.length ? number(photos.length) : '';
  progress.textContent = photos.length ? t('progress', number(shown), number(photos.length)) : '';
  updateAlbumStatus();
  gallery.querySelectorAll('a[data-index]').forEach(link => {
    const n = Number(link.dataset.index) + 1;
    link.setAttribute('aria-label', t('open', n));
    link.dataset.unavailable = t('unavailable');
    link.querySelector('img').alt = t('alt', n);
    link.querySelector('.photo-loader span:last-child').textContent = t('loading');
  });
  languageToggle.setAttribute('aria-label', t('language'));
  languageToggle.querySelector('.country-flag').className = `country-flag fi fi-${language === 'en-AU' ? 'au' : 'br'}`;
  document.querySelector('#language-code').textContent = language === 'en-AU' ? 'EN-AU' : 'PT-BR';
  languageMenu.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  translateViewer();
}
function closeLanguages(focus = false) {
  languageMenu.hidden = true; languageToggle.setAttribute('aria-expanded', 'false');
  if (focus) languageToggle.focus({ preventScroll: true });
}
languageToggle.addEventListener('click', () => {
  const opening = languageMenu.hidden;
  languageMenu.hidden = !opening; languageToggle.setAttribute('aria-expanded', String(opening));
  if (opening) languageMenu.querySelector(`[data-language="${language}"]`).focus({ preventScroll: true });
});
languageMenu.addEventListener('click', event => {
  const button = event.target.closest('[data-language]');
  if (!button) return;
  const previous = language;
  language = button.dataset.language;
  try { localStorage.setItem('wedding-language', language); } catch { /* Private browsing may block storage. */ }
  const scrollPosition = scrollY;
  applyLanguage();
  window.scrollTo({ top: scrollPosition, behavior: 'instant' });
  closeLanguages(true);
  if (previous !== language) track('language_change', viewer?.currIndex, { previous_language: previous, selected_language: language });
});
document.addEventListener('click', event => { if (!event.target.closest('.language-control')) closeLanguages(); });
document.querySelector('.language-control').addEventListener('keydown', event => {
  if (event.key === 'Escape' && !languageMenu.hidden) {
    event.stopPropagation(); event.preventDefault(); closeLanguages(true);
  }
});

function track(event, index, parameters = {}) {
  const photo = photos[index];
  try {
    window.gtag?.('event', event, {
      album_id: 'casamento_isadora_daniel',
      interface_language: language,
      ...(photo ? { content_type: 'image', item_id: photo.file, photo_position: index + 1 } : {}),
      ...parameters,
      transport_type: 'beacon',
    });
  } catch { /* Measurement must never interrupt the gallery. */ }
}

const reachedMilestones = new Set();
function albumProgress(position) {
  for (const percent of [25, 50, 75, 100]) {
    if (photos.length && position / photos.length * 100 >= percent && !reachedMilestones.has(percent)) {
      reachedMilestones.add(percent);
      track('album_progress', undefined, { percent });
    }
  }
}

let viewing;
function pauseViewing() {
  if (!viewing?.since) return;
  const duration = Math.round(performance.now() - viewing.since);
  viewing.since = 0;
  if (duration > 0) track('photo_engagement', viewing.index, { engagement_time_msec: duration });
}
document.addEventListener('visibilitychange', () => {
  pauseViewing();
  if (!document.hidden && viewing) viewing.since = performance.now();
});
window.addEventListener('pagehide', pauseViewing);
window.addEventListener('pageshow', () => {
  if (!document.hidden && viewing) viewing.since = performance.now();
});

document.addEventListener('click', event => {
  const control = event.target.closest('a, button');
  if (!control) return;
  if (control.closest('.language-control')) return;
  if (control.matches('.photo')) {
    track('photo_thumbnail_click', Number(control.dataset.index));
  } else if (control.closest('.pswp')) {
    const action = control.matches('.photo-action--download') ? 'download'
      : control.matches('.photo-action--share') ? 'share'
      : control.matches('.pswp__button--close') ? 'close'
      : control.matches('.pswp__button--zoom') ? 'zoom'
      : control.matches('.pswp__button--arrow--next') ? 'next'
      : control.matches('.pswp__button--arrow--prev') ? 'previous' : undefined;
    // Share and download already have their own click events.
    if (action && action !== 'share' && action !== 'download') track('viewer_control_click', viewer?.currIndex, { control: action });
  } else {
    const action = control.id || (control.matches('.brand') ? 'home'
      : control.matches('.explore') ? 'explore'
      : control.matches('.header-note') ? 'header_album'
      : control.matches('.skip') ? 'skip_to_album'
      : control.closest('footer') ? 'back_to_top'
      : control.matches('.video-album') ? 'video_album' : 'link');
    track('navigation_click', undefined, { control: action });
  }
}, true);

function photoState(img, state) {
  const link = img.parentElement;
  if (!link) return;
  if (state === 'failed' && !link.classList.contains('failed')) {
    track('photo_load_error', Number(link.dataset.index), { image_type: 'thumbnail' });
  }
  link.classList.toggle('is-ready', state === 'ready');
  link.classList.toggle('is-loading', state === 'loading');
  link.classList.toggle('failed', state === 'failed');
  link.setAttribute('aria-busy', String(state !== 'ready' && state !== 'failed'));
}

function releaseImage(img) {
  const job = imageJobs.get(img);
  if (job) {
    job.controller.abort();
    if (job.url) URL.revokeObjectURL(job.url);
    imageJobs.delete(img);
  }
  img.removeAttribute('src');
  photoState(img, 'pending');
}

function pumpImages() {
  let active = [...imageJobs.values()].filter(job => job.loading).length;
  for (const img of wantedImages) {
    if (active >= 4) break;
    if (imageJobs.has(img) || !img.isConnected) continue;
    const job = { controller: new AbortController(), loading: true };
    imageJobs.set(img, job); active++;
    photoState(img, 'loading');
    fetch(img.dataset.src, { signal: job.controller.signal, priority: 'high' })
      .then(response => { if (!response.ok) throw new Error('Image unavailable'); return response.blob(); })
      .then(blob => {
        if (imageJobs.get(img) !== job) return;
        job.url = URL.createObjectURL(blob); img.src = job.url;
      })
      .catch(error => {
        if (error.name !== 'AbortError' && imageJobs.get(img) === job) photoState(img, 'failed');
      })
      .finally(() => {
        job.loading = false;
        if (imageJobs.get(img) === job) pumpImages();
      });
  }
}

function prioritizeImages() {
  wantedImages = [...gallery.querySelectorAll('img')].filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.bottom >= -200 && rect.top <= innerHeight + 200;
  }).sort((a, b) => {
    const distance = img => Math.abs((img.getBoundingClientRect().top + img.getBoundingClientRect().bottom) / 2 - innerHeight / 2);
    return distance(a) - distance(b);
  });
  const wanted = new Set(wantedImages);
  for (const img of imageJobs.keys()) if (!wanted.has(img)) releaseImage(img);
  pumpImages();
  if (!document.hidden) {
    for (const link of gallery.querySelectorAll('a[data-index]')) {
      const rect = link.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) albumProgress(Number(link.dataset.index) + 1);
    }
  }
}
const number = value => value.toLocaleString(language);
const originalSource = index => `assets/gallery/${encodeURIComponent(photos[index].file)}`;
const source = index => photos[index].webp ? `assets/gallery-webp/${encodeURIComponent(photos[index].webp)}` : originalSource(index);
const thumbnailSource = index => photos[index].thumbnail ? `assets/gallery-thumbs/${encodeURIComponent(photos[index].thumbnail)}` : source(index);
const photoIndex = () => {
  const match = location.hash.match(/^#foto=(\d+)$/);
  return match ? Number(match[1]) - 1 : -1;
};

function trackPhotoShare(event, photo, method) {
  track(event, photos.indexOf(photo), { method });
}

async function sharePhoto(index, label) {
  const photo = photos[index];
  const url = new URL(location.href); url.hash = `foto=${index + 1}`;
  const method = typeof navigator.share === 'function' ? 'native' : 'copy_link';
  trackPhotoShare('photo_share_click', photo, method);
  try {
    if (method === 'native') {
      await navigator.share({ title: t('title'), url: url.href });
      // Browser completion does not prove delivery to a recipient.
      trackPhotoShare('share', photo, method);
    } else {
      await navigator.clipboard.writeText(url.href);
      trackPhotoShare('photo_link_copy', photo, method);
      label.dataset.copied = 'true';
      label.textContent = t('copied');
      setTimeout(() => { label.dataset.copied = 'false'; label.textContent = t('share'); }, 2000);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      trackPhotoShare('photo_share_cancel', photo, method);
    } else {
      trackPhotoShare('photo_share_error', photo, method);
      window.prompt(t('copyPrompt'), url.href);
      // Opening a copy prompt is not evidence that the link was copied.
    }
  }
}

function fillBlock(block) {
  if (block.element.childElementCount) return;
  const fragment = document.createDocumentFragment();
  for (let i = block.start; i < block.end; i++) {
    const link = document.createElement('a');
    link.className = 'photo'; link.href = source(i); link.dataset.index = i;
    link.setAttribute('aria-label', t('open', i + 1));
    link.dataset.unavailable = t('unavailable');
    link.setAttribute('aria-busy', 'true');
    const img = document.createElement('img');
    img.dataset.src = thumbnailSource(i); img.alt = t('alt', i + 1);
    img.width = photos[i].width; img.height = photos[i].height;
    img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('load', async () => {
      const url = img.getAttribute('src');
      try {
        await img.decode();
        if (url && img.getAttribute('src') === url) photoState(img, 'ready');
      } catch {
        if (url && img.getAttribute('src') === url) photoState(img, 'failed');
      }
    });
    img.addEventListener('error', () => { if (img.hasAttribute('src')) photoState(img, 'failed'); });
    const loader = document.createElement('span');
    loader.className = 'photo-loader'; loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<span class="photo-spinner"></span><span></span>';
    loader.lastElementChild.textContent = t('loading');
    link.append(img, loader); fragment.append(link);
  }
  block.element.append(fragment);
}

function refreshBlocks() {
  framePending = false;
  if (viewer) return;
  const margin = window.innerHeight;
  for (const block of blocks) {
    const rect = block.element.getBoundingClientRect();
    const nearby = rect.bottom >= -margin && rect.top <= innerHeight + margin;
    if (nearby) fillBlock(block);
    else if (!block.element.contains(document.activeElement)) {
      // Release sources before detaching, so pending offscreen loads can be abandoned.
      for (const img of block.element.querySelectorAll('img')) releaseImage(img);
      block.element.replaceChildren();
    }
  }
  prioritizeImages();
}

function scheduleBlocks() {
  if (!framePending) { framePending = true; requestAnimationFrame(refreshBlocks); }
}

function sizeBlocks() {
  const columns = innerWidth >= 1400 ? 4 : innerWidth > 700 ? 3 : 2;
  const gap = innerWidth > 700 ? 15 : 9;
  const cellWidth = (gallery.clientWidth - gap * (columns - 1)) / columns;
  for (const block of blocks) {
    const rows = Math.ceil((block.end - block.start) / columns);
    block.element.style.height = `${rows * cellWidth * 2 / 3 + (rows - 1) * gap}px`;
  }
  refreshBlocks();
}

function addBatch(method = 'automatic') {
  if (shown >= photos.length) return;
  const end = Math.min(shown + 40, photos.length);
  const element = document.createElement('div');
  element.className = 'gallery-block';
  blocks.push({ element, start: shown, end });
  gallery.append(element); shown = end;
  track('album_batch_load', undefined, { method, loaded_count: shown });
  sizeBlocks();
  more.hidden = shown >= photos.length;
  progress.textContent = t('progress', number(shown), number(photos.length));
}

window.addEventListener('scroll', scheduleBlocks, { passive: true });
window.addEventListener('resize', sizeBlocks);

function openPhoto(index, origin) {
  if (index < 0 || index >= photos.length || viewer) return;
  backToTop.hidden = true;
  wantedImages = [];
  for (const img of imageJobs.keys()) releaseImage(img);
  trigger = origin || document.activeElement;
  track('photo_open', index, { interaction_source: origin ? 'grid' : 'direct_link' });
  viewer = new PhotoSwipe({
    dataSource: photos.map((photo, i) => ({ src: source(i), width: photo.width, height: photo.height, alt: t('alt', i + 1) })),
    index, preload: [1, 1], loop: false, bgOpacity: .97,
    paddingFn: () => ({ top: 64, bottom: creatorBar.getBoundingClientRect().height + 110, left: 0, right: 0 }),
    closeTitle: t('close'), zoomTitle: t('zoom'), arrowPrevTitle: t('previous'), arrowNextTitle: t('next'),
    errorMsg: t('photoError'),
    returnFocus: false,
  });
  const instance = viewer;
  instance.on('afterInit', () => {
    instance.element.append(creatorBar);
    translateViewer(instance);
  });
  let current = -1, viewed = false, zoomed = false, changedAt = performance.now();
  let navigationMethod = 'gesture';
  const inputMethod = event => {
    if (event.type === 'keydown') navigationMethod = 'keyboard';
    else navigationMethod = event.target.closest?.('button') ? 'button' : 'gesture';
  };
  document.addEventListener('keydown', inputMethod, true);
  document.addEventListener('pointerdown', inputMethod, true);
  const markViewed = () => {
    if (viewed || document.hidden || instance.currSlide?.content.state !== 'loaded') return;
    viewed = true;
    viewing = { index: instance.currIndex, since: performance.now() };
    track('photo_view', instance.currIndex, { load_time_msec: Math.round(performance.now() - changedAt) });
    albumProgress(instance.currIndex + 1);
  };
  instance.on('change', () => {
    pauseViewing(); viewing = undefined;
    if (current >= 0) track('photo_navigate', instance.currIndex, {
      direction: instance.currIndex > current ? 'next' : 'previous', method: navigationMethod,
    });
    current = instance.currIndex; viewed = false; zoomed = false; changedAt = performance.now();
    markViewed();
  });
  instance.on('loadComplete', event => {
    if (event.content?.slide === instance.currSlide) markViewed();
  });
  const visibleView = () => { if (!document.hidden) markViewed(); };
  document.addEventListener('visibilitychange', visibleView);
  instance.on('loadError', event => {
    track('photo_load_error', event.content?.slide?.index, { image_type: 'viewer' });
  });
  instance.on('zoomPanUpdate', event => {
    const slide = event.slide;
    if (!zoomed && slide === instance.currSlide && slide.currZoomLevel > slide.zoomLevels.initial + .01) {
      zoomed = true; track('photo_zoom', instance.currIndex);
    }
  });
  instance.on('close', () => {
    pauseViewing(); viewing = undefined;
    track('photo_close', instance.currIndex);
  });
  instance.on('destroy', () => {
    closeLanguages();
    document.body.append(creatorBar);
    document.removeEventListener('keydown', inputMethod, true);
    document.removeEventListener('pointerdown', inputMethod, true);
    document.removeEventListener('visibilitychange', visibleView);
  });
  viewer.on('uiRegister', () => {
    viewer.ui.registerElement({ name: 'photo-loading', appendTo: 'root', order: 6, isButton: false,
      onInit: (element, pswp) => {
        element.setAttribute('role', 'status');
        element.setAttribute('aria-live', 'polite');
        const update = () => {
          const loading = pswp.currSlide?.content.isLoading() === true;
          element.hidden = !loading;
          element.innerHTML = loading ? '<span class="viewer-spinner" aria-hidden="true"></span><span></span>' : '';
          if (loading) element.lastElementChild.textContent = t('loading');
        };
        pswp.on('change', update);
        pswp.on('loadComplete', update);
        pswp.on('contentLoad', () => queueMicrotask(update));
        update();
      }
    });
    viewer.ui.registerElement({ name: 'actions', appendTo: 'root', order: 7, isButton: false,
      onInit: (element, pswp) => {
        element.setAttribute('role', 'group');
        element.setAttribute('aria-label', t('actions'));
        const download = document.createElement('a');
        download.className = 'photo-action photo-action--download';
        download.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg><span>Baixar Foto HD</span>';
        download.querySelector('span').textContent = t('download');
        download.setAttribute('aria-label', t('download'));
        download.addEventListener('click', () => track('photo_download_click', pswp.currIndex));
        pswp.on('change', () => { download.href = originalSource(pswp.currIndex); download.download = photos[pswp.currIndex].file; });
        const share = document.createElement('button');
        share.type = 'button'; share.className = 'photo-action photo-action--share';
        share.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg><span>Compartilhar</span>';
        const label = share.querySelector('span');
        label.textContent = t('share');
        label.setAttribute('aria-live', 'polite');
        let sharing = false;
        share.onclick = async () => {
          if (sharing) return;
          sharing = true;
          try {
            await sharePhoto(pswp.currIndex, label);
          } finally { sharing = false; }
        };
        element.append(download, share);
      }
    });
  });
  viewer.on('change', () => history.replaceState(null, '', `#foto=${viewer.currIndex + 1}`));
  viewer.on('destroy', () => { viewer = undefined; updateBackToTop(); if (photoIndex() >= 0) history.replaceState(null, '', location.pathname + location.search + '#album'); refreshBlocks(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
  viewer.init();
}

gallery.addEventListener('click', event => {
  const link = event.target.closest('a[data-index]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); openPhoto(Number(link.dataset.index), link);
});
more.addEventListener('click', () => addBatch('button'));
window.addEventListener('hashchange', () => {
  const index = photoIndex();
  if (index >= 0 && index < photos.length) { if (viewer) viewer.goTo(index); else openPhoto(index); }
  else viewer?.close();
});

async function load() {
  const started = performance.now();
  try {
    const response = await fetch('assets/photos.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Catalog unavailable');
    photos = await response.json();
    track('album_load', undefined, { photo_count: photos.length, load_time_msec: Math.round(performance.now() - started) });
    document.querySelector('#total').textContent = number(photos.length);
    if (!photos.length) {
      albumState = 'empty'; updateAlbumStatus();
      more.hidden = true;
      return;
    }
    status.hidden = true; addBatch('initial');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && !more.hidden && !viewer) addBatch();
      }, { rootMargin: '350px' });
      observer.observe(more);
    }
    openPhoto(photoIndex());
  } catch {
    track('album_load_error');
    albumState = 'albumError'; status.replaceChildren(); updateAlbumStatus();
    const retry = document.createElement('button'); retry.textContent = t('retry');
    retry.id = 'album-retry';
    retry.onclick = () => { albumState = 'preparing'; status.replaceChildren(); updateAlbumStatus(); load(); };
    status.append(retry);
  }
}
applyLanguage();
document.querySelector('.language-control').hidden = false;
updateBackToTop();
load();
