let restaurant;
let review;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    const error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const restauranHeader = document.getElementById("restauranHeader");
  const favoriteDiv = document.createElement("div");
  favoriteDiv.classList.add('favoriteDiv');
  favoriteDiv.innerHTML = '<label for="favCheck"> Add to favorite:</label><input type="checkbox" id="favCheck">'
  restauranHeader.append(favoriteDiv);

  const favCheck = document.getElementById('favCheck');
  favCheck.checked ? restaurant.is_favorite : !restaurant.is_favorite
  // if (favCheck.checked) {
  //   favCheck.style.background = `url("/img/icons/like.svg") no-repeat`
  // } else {
  //   favCheck.style.background = `url("/img/icons/dislike.svg") no-repeat`;
  // }
	favCheck.addEventListener('change', event => {
		DBHelper.toggleFavorite(restaurant, event.target.checked);
  });

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageALTForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews;
  const container = document.getElementById('reviews-container');

  if (error) {
    console.log('Error retrieving reviews', error);
  }
  
  const ul = document.getElementById('reviewsNew');
  ul.innerHTML = '';
  reviews.reverse();
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	name.setAttribute('tabindex', 0);
	li.appendChild(name);

	const createdAt = document.createElement('p');
  createdAt.classList.add('createdAt');
  const createdDate = review.createdAt ?
    new Date(review.createdAt).toLocaleDateString() :
    'Pending';
  createdAt.innerHTML = `${createdDate}`;
  li.appendChild(createdAt);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.setAttribute('tabindex', 0);
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	comments.setAttribute('tabindex', 0);
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('h4');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}




// Fetch Reviews from server
document.addEventListener('DOMContentLoaded', (event) => {  
  fetchReviews();
});

fetchReviews = () => {
  DBHelper.fetchReviews((error, reviews)=>{
    if (error){
      console.log(`An error with getting reviews information has occured ${error}`);
    } else {
      self.reviews = reviews;
    }
  })
}



function saveReview(e) {
  e.preventDefault();
  const form = e.target;
    const restaurant_id = self.restaurant.id;
    const name = document.querySelector('#name').value;
    const rating = document.querySelector('#rating').value;
    const comments = document.querySelector('#comments').value;
    // attempt save to database server
    DBHelper.createRestaurantReview(restaurant_id, name, rating, comments, (error, review) => {
      console.log('got callback');
      if (error) {
        console.log('We are offline. Review has been saved to the queue.');
      } else {
        console.log('Received updated record from DB Server', review);
        DBHelper.createIDBReview(review); // write record to local IDB store
      }
      idbKeyVal.getAllIdx('reviews', 'restaurant_id', restaurant_id)
        .then(reviews => {
          fillReviewsHTML(null, reviews);
          document.getElementById('review-add-btn').focus();
        });
    });
};



// Show submitted Review
const form = document.getElementById("reviewForm");
form.addEventListener("submit", function (event) {
	event.preventDefault();
	let review = {"restaurant_id": self.restaurant.id};
	const formdata = new FormData(form);
	for (var [key, value] of formdata.entries()) {
		review[key] = value;
	}
	DBHelper.submitReview(review)
		.then(data => {
			const ul = document.getElementById('reviewsNew');
      ul.appendChild(createReviewHTML(review));
      form.reset();
		})
		.catch(error => console.error(error))
});