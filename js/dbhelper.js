/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
    .then(response => response.json())
    .then(function addData(data){
      console.table(data)

      if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
      }
  
      var dbPromise = idb.open(
        'restaurantStore', 2, function(upgradeDb) {
        switch(upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('restaurantReviews', {
              keyPath: 'id'
            });
        }
      });

      dbPromise.then(function(db) {
        var tx = db.transaction('restaurantReviews', 'readwrite');
        var keyValStore = tx.objectStore('restaurantReviews');
        data.forEach(datas => {
          var placedData = keyValStore.put(datas);
          return placedData;
        });
        // return tx.complete;
        console.log('Added restaurant');
      })
      .catch(function(error) {
        const errorMessage = (`Request failed. Returned status of ${error}`);
        // callback(errorMessage, null);
      })
      callback(null, data);
      
    })
    
  }
  
  /**
   * Fetch restaurant by ID
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  static ariaForRestaurant(restaurant) {
    // console.log (`${restaurant.name}`);
    return (`${restaurant.name}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph}.jpg`);
  }
  static imageALTForRestaurant(restaurant) {
    return (`${restaurant.name}`);
  }
  

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } 

  /**
	 * Fetch restaurant's reviews
	 */
	static fetchRestaurantReviews(restaurant, callback) {
		DBHelper.dbPromise.then(db => {
			if (!db) return;
			const tx = db.transaction('all-reviews');
			const store = tx.objectStore('all-reviews');
			store.getAll().then(results => {
				if (results && results.length > 0) {
					callback(null, results);
				} else {
					fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
					.then(response => {
						return response.json();
					})
					.then(reviews => {
						this.dbPromise.then(db => {
							if (!db) return;
							const tx = db.transaction('all-reviews', 'readwrite');
							const store = tx.objectStore('all-reviews');
							reviews.forEach(review => {
								store.put(review);
							})
						});
						callback(null, reviews);
					})
					.catch(error => {
						callback(error, null);
					})
				}
			})
		});
	}
  /**
   * Add reviews
   */
  static submitReview(data) {
		console.log(data);
		
		return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
			body: JSON.stringify(data), 
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'content-type': 'application/json'
			},
			method: 'POST',
			mode: 'cors',
			redirect: 'follow',
			referrer: 'no-referrer',
		})
		.then(response => {
			response.json()
				.then(data => {
					this.dbPromise.then(db => {
						if (!db) return;
						const tx = db.transaction('all-reviews', 'readwrite');
						const store = tx.objectStore('all-reviews');
						store.put(data);
          });
          console.log(data);
					return data;
        })
		})
		.catch(error => {
			data['updatedAt'] = new Date().getTime();
			console.log(data);
			
			this.dbPromise.then(db => {
				if (!db) return;
				// Put fetched reviews into IDB
				const tx = db.transaction('offline-reviews', 'readwrite');
				const store = tx.objectStore('offline-reviews');
				store.put(data);
				console.log('Review stored offline in IDB');
			});
			return;
		});
	}

}
