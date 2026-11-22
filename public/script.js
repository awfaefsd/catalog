setInterval(function () {
  const now = new Date();
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  document.getElementById('clock').textContent =
    now.toLocaleTimeString() + '.' + ms;
}, 50);


let filterRuns = 0;
let scrollRuns = 0;
let cartCount = 0;

const LIMIT = 20; // сколько товаров просим за раз
let page = 0;     // какая страница уже загружена
let pages = 1;    // сколько всего страниц
let loading = false; // идёт ли сейчас загрузка

function loadMore() {
  // защита от двойной загрузки и выхода за пределы
  if (loading || page >= pages) {
    return;
  }
  
  loading = true;
  page = page + 1;
  
 const text = document.querySelector('#search').value;
  const address = '/api/products?page=' + page + '&limit=' + LIMIT +
                  '&search=' + encodeURIComponent(text);

  
  fetch(address)
    .then(function (response) {
      return response.json();
    })
    .then(function (answer) {
      pages = answer.pages;
      addCards(answer.items); // вызываем функцию добавления карточек
      fixHeights();
      
      const shown = document.querySelectorAll('.card').length;
      const totalElement = document.querySelector('#total');
      if (totalElement) {
        totalElement.textContent =
          'Найдено: ' + answer.total + ', показано: ' + shown;
      }
       if (page >= pages) {
        document.querySelector('#more').style.display = 'none';
      }
      loading = false;
    });
}

// Первая страница при открытии сайта
loadMore();

function addCards(products) {
  console.time('Построение карточек');
  const box = document.querySelector('.cards');
  let html = '';
  
  // собираем разметку для каждого товара
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    html = html +
      '<article class="card">' +
        '<img src="' + item.img + '" alt="' + item.name + '"' +
          ' width="600" height="450" loading="lazy">' +
        '<h2>' + item.name + '</h2>' +
        '<p class="price">' + item.price + ' руб.</p>' +
        '<button class="btn-primary" data-id="' + item.id + '">В корзину</button>' +
      '</article>';
  }
  
  // ВАЖНО: insertAdjacentHTML добавляет в конец, а не затирает старое
  box.insertAdjacentHTML('beforeend', html); 
  
  const count = document.querySelectorAll('*').length;
  document.querySelector('#nodes').textContent =
    'Элементов на странице: ' + count;
    
  console.timeEnd('Построение карточек');
}
function fixHeights() {
  console.time('Высота карточек');
  const cards = document.querySelectorAll('.card');
  const heights = [];
  
  for (let i = 0; i < cards.length; i++) {
    heights.push(cards[i].offsetHeight);
  }
  
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.minHeight = heights[i] + 'px';
  }
  
  console.timeEnd('Высота карточек');
}

function onScroll() {
  scrollRuns = scrollRuns + 1;
  document.querySelector('#scrollRuns').textContent =
    'Прокрутка обработана: ' + scrollRuns;
 
  const up = document.querySelector('#up');
 
  if (window.scrollY > 1000) {
    up.style.display = 'block';
  } else {
    up.style.display = 'none';
  }
}

let lastScroll = 0;
window.addEventListener('scroll', function () {
  const now = Date.now();
  if (now - lastScroll < 200) return;
  lastScroll = now;
  onScroll();
});

document.querySelector('#up').addEventListener('click', function () {
  window.scrollTo(0, 0);
});

function addToCart(id) {
  cartCount = cartCount + 1;
  document.querySelector('#cart').textContent = 'В корзине: ' + cartCount;
  console.log('Добавлен товар № ' + id);
}

document.querySelector('.cards').addEventListener('click', function (event) {
  if (event.target.classList.contains('btn-primary')) {
    addToCart(event.target.dataset.id);
    event.target.textContent = 'В корзине';
    event.target.disabled = true; 
  }
});

document.querySelector('#handlers').textContent = 'Обработчиков кнопок: 1';

function filterCards() {
  filterRuns = filterRuns + 1;
  document.querySelector('#filterRuns').textContent =
    'Поиск запускался: ' + filterRuns;
 
  document.querySelector('.cards').innerHTML = '';
  document.querySelector('#more').style.display = 'block';
  page = 0;
  pages = 1;
 loading = false;
  loadMore();
}
let searchTimer;
document.querySelector('#search').addEventListener('input', function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(filterCards, 300);
});
document.querySelector('#more').addEventListener('click', loadMore);
// кнопка показалась на экране: загружаем следующую страницу
const watcher = new IntersectionObserver(function (entries) {
  if (entries[0].isIntersecting) {
    loadMore();
  }
}, { rootMargin: '300px' });
 
watcher.observe(document.querySelector('#more'));
// раз в секунду считаем, какие файлы пришли по сети, а какие из кеша
setInterval(function () {
  const files = performance.getEntriesByType('resource');
  let fromCache = 0;
  let bytes = 0;
 
  for (let i = 0; i < files.length; i++) {
    bytes = bytes + files[i].transferSize;
 
    if (files[i].transferSize === 0) {
      fromCache = fromCache + 1;
    }
  }
 
  document.querySelector('#fromCache').textContent =
    'Из кеша: ' + fromCache + ' из ' + files.length;
  document.querySelector('#loaded').textContent =
    'Скачано: ' + Math.round(bytes / 1024) + ' кБ';
}, 1000);
