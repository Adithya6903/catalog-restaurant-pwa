import 'regenerator-runtime';
import '../styles/main.scss';
import Dexie from 'dexie';
console.log('Hello Coders! :)');


const skipLink = document.querySelector('.skip-link');
const mainContent = document.getElementById('maincontent');

skipLink.addEventListener('click', (e) => {
  e.preventDefault();
  mainContent.scrollIntoView({ behavior: 'smooth' });
  skipLink.blur();
});

const hamburgerButton = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburgerButton.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

window.addEventListener('click', (event) => {
  if (event.target !== hamburgerButton && !navLinks.contains(event.target)) {
    navLinks.classList.remove('active');
  }
});

const db = new Dexie('restaurantFavoritesDB');
db.version(1).stores({
  favorites: 'id, name, city, rating, pictureId, description' // Store restoran favorit
});

async function addFavoriteRestaurant(restaurant) {
  try {
    await db.favorites.add(restaurant);
    alert(`${restaurant.name} telah ditambahkan ke daftar favorit!`);
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

async function removeFavoriteRestaurant(id) {
  try {
    await db.favorites.delete(id);
    alert(`Restoran telah dihapus dari daftar favorit!`);
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

async function isRestaurantFavorite(id) {
  const restaurant = await db.favorites.get(id);
  return restaurant !== undefined;
}

async function toggleFavoriteButton(restaurant) {
  const isFavorite = await isRestaurantFavorite(restaurant.id);
  const favoriteButton = document.getElementById('favoriteButton');

  if (isFavorite) {
    favoriteButton.textContent = 'Remove from Favorites';
    favoriteButton.onclick = () => removeFavoriteRestaurant(restaurant.id);
  } else {
    favoriteButton.textContent = 'Add to Favorites';
    favoriteButton.onclick = () => addFavoriteRestaurant(restaurant);
  }
}

async function loadRestaurants() {
  const restaurantContainer = document.getElementById('restaurants');
  restaurantContainer.innerHTML = '';

  try {
    const response = await fetch('https://restaurant-api.dicoding.dev/list');
    const data = await response.json();

    if (restaurantContainer && data.restaurants) {
      const restaurantList = document.createElement('div');
      restaurantList.classList.add('restaurant-list');
      data.restaurants.forEach((restaurant) => {
        const restaurantCard = `
          <div class="restaurant-card">
            <img src="https://restaurant-api.dicoding.dev/images/medium/${restaurant.pictureId}" alt="Image of ${restaurant.name}" class="restaurant-image">
            <div class="restaurant-info">
              <h3>${restaurant.name}</h3>
              <p><strong>City:</strong> ${restaurant.city}</p>
              <p><strong>Rating:</strong> ${restaurant.rating}</p>
              <a href="#/detail/${restaurant.id}" class="cta-detail">View Details</a>
            </div>
          </div>
        `;
        restaurantList.innerHTML += restaurantCard;
      });
      restaurantContainer.appendChild(restaurantList);
    
    } else {
      console.error('No restaurants found or container not found in the DOM.');
    }
    
  } catch (error) {
    console.error('Error fetching restaurants:', error);
  }
}

async function loadFavoriteRestaurants() {
  const restaurantContainer = document.getElementById('restaurants');
  restaurantContainer.innerHTML = '';

  try {
    const favoriteRestaurants = await db.favorites.toArray();

    if (favoriteRestaurants.length > 0) {
      const restaurantList = document.createElement('div');
      restaurantList.classList.add('restaurant-list');
      favoriteRestaurants.forEach((restaurant) => {
        const restaurantCard = `
          <div class="restaurant-card">
            <img src="https://restaurant-api.dicoding.dev/images/medium/${restaurant.pictureId}" alt="Image of ${restaurant.name}" class="restaurant-image">
            <div class="restaurant-info">
              <h3>${restaurant.name}</h3>
              <p><strong>City:</strong> ${restaurant.city}</p>
              <p><strong>Rating:</strong> ${restaurant.rating}</p>
              <a href="#/detail/${restaurant.id}" class="cta-detail">View Details</a>
            </div>
          </div>
        `;
        restaurantList.innerHTML += restaurantCard;
      });
      restaurantContainer.appendChild(restaurantList);
    
    } else {
      restaurantContainer.innerHTML = '<p>Tidak ada restoran favorit yang ditemukan.</p>';
    } 
    
  } catch (error) {
    console.error('Error fetching favorite restaurants:', error);
    restaurantContainer.innerHTML = '<p>Error loading favorite restaurants.</p>';
  }
}

class ReviewForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="review-form">
        <h3>Tambah Review</h3>
        <form id="reviewForm">
          <input type="text" id="reviewerName" placeholder="Nama Anda" required>
          <textarea id="reviewerContent" placeholder="Tulis ulasan Anda..." required></textarea>
          <button type="submit">Kirim Ulasan</button>
        </form>
      </div>
    `;

    const reviewForm = this.querySelector('#reviewForm');
    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = this.querySelector('#reviewerName').value;
      const review = this.querySelector('#reviewerContent').value;
      const restaurantId = this.getAttribute('restaurant-id');
      this.submitReview(restaurantId, name, review);
    });
  }

  async submitReview(restaurantId, name, review) {
    try {
      const response = await fetch(`https://restaurant-api.dicoding.dev/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': '12345',
        },
        body: JSON.stringify({
          id: restaurantId,
          name: name,
          review: review,
        }),
      });

      if (response.ok) {
        alert('Review berhasil ditambahkan!');
        this.addReviewToPage(name, review);
      } else {
        alert('Gagal menambahkan review. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Gagal menambahkan review. Silakan coba lagi.');
    }
  }

  addReviewToPage(name, review) {
    const reviewList = document.querySelector('.restaurant-detail ul.review');
    const reviewItem = document.createElement('li');
    const date = new Date().toISOString().split('T')[0];
    reviewItem.innerHTML = `
      <p><strong>${name}</strong>: "${review}"</p>
      <p><small>Date: ${date}</small></p>
    `;
    reviewList.appendChild(reviewItem);

    this.querySelector('#reviewerName').value = '';
    this.querySelector('#reviewerContent').value = '';
  }
}

customElements.define('review-form', ReviewForm);


async function loadRestaurantDetail(restaurantId) {
  const restaurantContainer = document.getElementById('restaurants');
  restaurantContainer.innerHTML = '<p>Loading...</p>';

  try {
    const response = await fetch(`https://restaurant-api.dicoding.dev/detail/${restaurantId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch restaurant detail');
    }
    const data = await response.json();
    const restaurant = data.restaurant;

    if (restaurant) {
      restaurantContainer.innerHTML = `
        <div class="restaurant-detail">
          <h2>${restaurant.name}</h2>
          <img src="https://restaurant-api.dicoding.dev/images/large/${restaurant.pictureId}" alt="${restaurant.name}" class="restaurant-detail-image">
          <p><strong>Alamat:</strong> ${restaurant.address}</p>
          <p><strong>Kota:</strong> ${restaurant.city}</p>
          <p><strong>Deskripsi:</strong> ${restaurant.description}</p>

          <h3>Menu Makanan</h3>
          <ul>
            ${restaurant.menus.foods.map(food => `<li>${food.name}</li>`).join('')}
          </ul>

          <h3>Menu Minuman</h3>
          <ul>
            ${restaurant.menus.drinks.map(drink => `<li>${drink.name}</li>`).join('')}
          </ul>

          <h3>Customer Reviews</h3>
          <ul class="review">
            ${restaurant.customerReviews.map(review => `
              <li>
                <p><strong>${review.name}</strong>: "${review.review}"</p>
                <p><small>Date: ${review.date}</small></p>
              </li>`).join('')}
          </ul>

          <!-- Web Component Review Form -->
          <review-form restaurant-id="${restaurant.id}"></review-form>

          <button id="favoriteButton" class="favorite-button">Loading...</button>
        </div>
      `;

      toggleFavoriteButton(restaurant);
    } else {
      restaurantContainer.innerHTML = '<p>Restaurant detail not found.</p>';
    }
  } catch (error) {
    console.error('Error fetching restaurant detail:', error);
    restaurantContainer.innerHTML = '<p>Error loading restaurant detail. Please try again later.</p>';
  }
}


function renderPage() {
  const hash = window.location.hash;

  if (hash.startsWith('#/detail/')) {
    const restaurantId = hash.split('/')[2];
    loadRestaurantDetail(restaurantId);
  } else if (hash === '#/favorites') {
    loadFavoriteRestaurants();
  } else {
    loadRestaurants();
  }
}

renderPage();

window.addEventListener('hashchange', renderPage);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.bundle.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

