let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
let firstLoad = true;

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
  if (firstLoad) {
    fetchNeighborhoods();
    fetchCuisines();
    const mapDiv = document.getElementById("map");
    const mapImg = document.createElement("img");
    mapImg.id = "mapImg";
    mapImg.onclick = e => switchToLiveMap();
    mapDiv.append(mapImg);

    firstLoad = false;
  } else {
    addMarkersToMap();
  }
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  // Images
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + "restaurant image";
  li.append(image);

  // Name
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  // Favorites
  console.log("is_favorite: ", restaurant["is_favorite"]);
  const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favoriteDiv = document.createElement("div");
  favoriteDiv.className = "favorite-icon";
  const favorite = document.createElement("button");
  favorite.style.background = isFavorite
    ? `url("/img/icons/like.svg") no-repeat`
    : `url("/img/icons/dislike.svg") no-repeat`;
  favorite.innerHTML = isFavorite
    ? "<span class='hiddenelement'>></span> Favorite - View Details to edit favorite"
    : "<span class='hiddenelement'>></span> Not favorite - View Details to edit favorite";
  favorite.id = "favorite-icon-" + restaurant.id;
  // favorite.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  favoriteDiv.append(favorite);
  li.append(favoriteDiv);


  // const favoriteDiv = document.createElement("div");
  // favoriteDiv.classList.add('favoriteDiv');
  // favoriteDiv.innerHTML = '<label for="favCheck'+ restaurant.id +'"> Add to favorite:</label><input type="checkbox" id="favCheck'+ restaurant.id + '">'
  // li.append(favoriteDiv);

  // const favCheck = document.getElementById('favCheck' + restaurant.id );
  // favCheck.checked = restaurant.is_favorite;
  // if (favCheck.checked) {
  //   favCheck.style.background = `url("/img/icons/like.svg") no-repeat`
  // } else {
  //   favCheck.style.background = `url("/img/icons/dislike.svg") no-repeat`;
  // }
	// favCheck.addEventListener('change', event => {
	// 	DBHelper.toggleFavorite(restaurant, event.target.checked);
  // });

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

const handleFavoriteClick = (id, newState) => {
  // Update properties of the restaurant data object
  const favorite = document.getElementById("favorite-icon-" + id);
  const restaurant = self
    .restaurants
    .filter(r => r.id === id)[0];
  if (!restaurant)
    return;
  restaurant["is_favorite"] = newState;
  // favorite.onclick = event => handleFavoriteClick(restaurant.id, !restaurant["is_favorite"]);
  DBHelper.handleFavoriteClick(id, newState);
};

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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
  .register('sw.js', {scope: '/'})
  .then(function(event) {
    console.log('[Step 1. Service Worker from main.js] Registered', event.scope);
    })
  .catch(function(error){
    console.log('[Step 1. Service Worker from main.js] Error on Registration', error);
    }
  )
}
