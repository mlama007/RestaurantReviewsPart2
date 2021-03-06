let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  // DBHelper.nextPending();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  // Images
  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = restaurant.name + "restaurant image";
  li.append(image);

  const restauranHeader = document.createElement('div');
  restauranHeader.classList.add('restauranHeader');
  // Name
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  restauranHeader.append(name);

  // Favorites
  const favoriteButton = document.createElement("button");
  favoriteButton.classList.add('favoriteButton');
  favoriteButton.id= 'restaurantButton'+restaurant.id;
  if (restaurant.is_favorite === "true") {
    favoriteButton.style.background = `url("/img/icons/like.svg") no-repeat`;
    favoriteButton.dataset.isFavorite = true;
    favoriteButton.title = 'Restaurant is favorite';
  }
  else if (restaurant.is_favorite === "false"){
    favoriteButton.style.background = `url("/img/icons/dislike.svg") no-repeat`;
    favoriteButton.dataset.isFavorite = false;
    favoriteButton.title = 'Make Restaurant favorite';
  }
  restauranHeader.append(favoriteButton);

  li.append(restauranHeader);

  favoriteButton.onclick = (event, id = restaurant.id, setFavorite = !JSON.parse(favoriteButton.dataset.isFavorite)) => {
      
    DBHelper.toggleRestaurantFavoriteStatus(id, setFavorite, favoriteStatus => {
      event.target.dataset.isFavorite = favoriteStatus;
      if (favoriteStatus === "true") {
        favoriteButton.style.background = `url("/img/icons/like.svg") no-repeat`;
        favoriteButton.title = 'Restaurant is favorite';
      }
      else {
        favoriteButton.style.background = `url("/img/icons/dislike.svg") no-repeat`;
        favoriteButton.title = 'Make Restaurant favorite';
      }
    });
  };
  // end favorite

  // neighborhood
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  // address
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  // Details
  const more = document.createElement('a');
  more.name = DBHelper.ariaForRestaurant(restaurant);
  more.innerHTML = '<span class= "hidden">'+ more.name+ '</span>' + 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js')
    .then(registration => {
      console.log(`Registration successful, scope is ${registration.scope}`);
    }).catch(error => {
      console.log(`Service worker registration failed, error: ${error}`);
    });
}


