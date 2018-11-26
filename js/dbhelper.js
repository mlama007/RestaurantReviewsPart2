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
  

  // Reviews
  static get DATABASE_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }
  
  static get DATABASE_REVIEWS_ID_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews?restaurant_id=`;
  }

  // Favorites
  static get DATABASE_Favorite_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants/{restaurant_id}/`; // /?is_favorite=true`
  }

  static get DATABASE_NOT_Favorite_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants/{restaurant_id}/`; // ?is_favorite=false`
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    /**
     * Using Fetch all Restaurants API to fetch data
     */
    fetch(DBHelper.DATABASE_URL).then(
      function (response) {
        let array = response.json();//arrayifying the response
        return array;//'array' soon to be 'data' is still a response object

      })
      .then(
        function addData(data) {

          const dbPromise = idb.open("TheRestaurantDepot", 1, upgradeDB => {
            switch (upgradeDB.oldVersion) {
              case 0:
                upgradeDB.createObjectStore("RestaurantStore", {keyPath: "id"});
              case 1:
                upgradeDB.createObjectStore("pending", {
                  keyPath: "id",
                  autoIncrement: true
                });
                case 2:
                // {
                //   const reviewsStore = upgradeDB.createObjectStore("ReviewsStore", {keyPath: "id"});
                //   reviewsStore.createIndex("restaurant_id", "restaurant_id");
                // }
            }
          });//End of opening database
          dbPromise.then(
            function (db) {//put the data into the db
              var tx = db.transaction('RestaurantStore', 'readwrite');
              var store = tx.objectStore('RestaurantStore');
              data.forEach(datas => {

                var placedData = store.put(datas);
                return placedData;
              });
            }).catch(
              function (error) {
                //console.log('Working offline...' + error)
                dbPromise.then(function (db) {//get the data from out of the store
                  var tx = db.transaction('RestaurantStore');
                  var cache = tx.objectStore('RestaurantStore');
                  return cache.getAll();
                })
              })
          callback(null, data)
        })
  }//end of fetchRestaurants
  
  
  
  // GET
  // http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
  static fetchRestaurantReviewsById(id, callback) {
    // Fetch all reviews for the specific restaurant
    const fetchURL = DBHelper.DATABASE_REVIEWS_ID_URL + id;
    fetch(fetchURL, {method: "GET"}).then(response => {
      if (!response.clone().ok && !response.clone().redirected) {
        throw "No reviews available";
      }
      response
        .json()
        .then(result => {
          callback(null, result);
        })
    }).catch(error => callback(error, null));
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


  //////////////////////////
  static addPendingRequestToQueue(url, method, body) {
    // Open the database ad add the request details to the pending table
    const dbPromise = idb.open("TheRestaurantDepot");
    dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .put({
          data: {
            url,
            method,
            body
          }
        })
    })
      .catch(error => {})
      .then(DBHelper.nextPending());
  }
  

  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    const method = "POST";
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    DBHelper.addPendingRequestToQueue(url, method, bodyObj);
    callback(null, null);
  }

  static nextPending() {
    DBHelper.attemptCommitPending(DBHelper.nextPending);
  }

  static attemptCommitPending(callback) {
    // Iterate over the pending items until there is a network failure
    let url;
    let method;
    let body;
    const dbPromise = idb.open("TheRestaurantDepot");
    dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        console.log("DB not available");
        db.close();
        return;
      }

      const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }
          const value = cursor.value;
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.body;

          // If we don't have a parameter then we're on a bad record that should be tossed
          // and then move on
          if ((!url || !method) || (method === "POST" && !body)) {
            cursor
              .delete()
              .then(callback());
            return;
          };

          const properties = {
            body: JSON.stringify(body),
            method: method
          }
          console.log("sending post from queue: ", properties);
          fetch(url, properties)
            .then(response => {
            // If we don't get a good response then assume we're offline
            if (!response.ok && !response.redirected) {
              return;
            }
          })
            .then(() => {
              // Success! Delete the item from the pending queue
              const deltx = db.transaction("pending", "readwrite");
              deltx
                .objectStore("pending")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      callback();
                    })
                })
              console.log("deleted pending item from queue");
            })
        })
        .catch(error => {
          console.log("Error reading cursor");
          return;
        })
    })
  }

  static updateCachedRestaurantData(id, updateObj) {
        const dbPromise = idb.open("TheRestaurantDepot");
    // Update in the data for all restaurants first
    dbPromise.then(db => {
      console.log("Getting db transaction");
      const tx = db.transaction("RestaurantStore", "readwrite");
      const value = tx
        .objectStore("RestaurantStore")
        .get("-1")
        .then(value => {
          if (!value) {
            console.log("No cached data found");
            return;
          }
          const data = value.data;
          const restaurantArr = data.filter(r => r.id === id);
          const restaurantObj = restaurantArr[0];
          // Update restaurantObj with updateObj details
          if (!restaurantObj)
            return;
          const keys = Object.keys(updateObj);
          keys.forEach(k => {
            restaurantObj[k] = updateObj[k];
          })

          // Put the data back in IDB storage
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({id: "-1", data: data});
            return tx.complete;
          })
        })
    })

    // Update the restaurant specific data
    dbPromise.then(db => {
      console.log("Getting db transaction");
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx
        .objectStore("restaurants")
        .get(id + "")
        .then(value => {
          if (!value) {
            console.log("No cached data found");
            return;
          }
          const restaurantObj = value.data;
          console.log("Specific restaurant obj: ", restaurantObj);
          // Update restaurantObj with updateObj details
          if (!restaurantObj)
            return;
          const keys = Object.keys(updateObj);
          keys.forEach(k => {
            restaurantObj[k] = updateObj[k];
          })

          // Put the data back in IDB storage
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({
                id: id + "",
                data: restaurantObj
              });
            return tx.complete;
          })
        })
    })
  }
static updateCachedRestaurantReview(id, bodyObj) {
    console.log("updating cache for new review: ", bodyObj);
    // Push the review into the reviews store
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");
      console.log("putting cached review into store");
      store.put({
        id: Date.now(),
        "restaurant_id": id,
        data: bodyObj
      });
      console.log("successfully put cached review into store");
      return tx.complete;
    })
  }

  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    const method = "POST";
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    DBHelper.addPendingRequestToQueue(url, method, bodyObj);
    callback(null, null);
  }
  
  /**
   * Add reviews
   */
  // NOT USED
  static saveReview(id, name, rating, comment, callback) {
    console.log("YEEYEEEE")
    // Block any more clicks on the submit button until the callback
    const btn = document.getElementById("review-add-btn");
    btn.onclick = location.reload();
    

    // Create the POST body
    const body = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comment,
      createdAt: Date.now()
    }

    DBHelper.saveNewReview(id, body, (error, result) => {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, result);
    })
  }
  //////////////////////////
  
  static submitReview(data) {
        console.log(data);
        return fetch(`${DBHelper.DATABASE_REVIEWS_URL}`, {
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
            const dbPromise = idb.open("TheRestaurantDepot");
            dbPromise.then(db => {
              if (!db) return;
              const tx = db.transaction('all-reviews', 'readwrite');
              const store = tx.objectStore('all-reviews');
              store.put(data);
            });
            console.log(data);
            DBHelper.saveReview(data);
            return data;
          })
        })
        .catch(error => {
            data['updatedAt'] = new Date().getTime();
            console.log(data);
      const dbPromise = idb.open("TheRestaurantDepot");
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

  // Doug Brown [Project Coach] [2 hours ago]
  // Everything should then flow to the callback for displaying reviews after that
  /**
   * This is the Prototype for any function needing to access the reviews url
    */
  static fetchReviews(callback) {
    const reviewsUrl = DBHelper.DATABASE_REVIEWS_URL;
    if (reviewsUrl.length === 0) {
      console.log('There are no reviews here');
      return;
    } else {
      fetch(reviewsUrl).then(
        function (response) {
          let array = response.json();
          return array;

        })
        .then(
          function addReviewsData(reviewsData) {
            const dbPromise = idb.open(
              'TheReviewsDepot', 1, function (upgradeDb) {
                upgradeDb.createObjectStore('ReviewsStore', {
                keyPath: 'id'
              });
            });
            dbPromise.then(
              function (db) {
                let tx = db.transaction('ReviewsStore', 'readwrite');
                let store = tx.objectStore('ReviewsStore');
                reviewsData.forEach(reviewsDatas => {
                  let placedData = store.put(reviewsDatas);
                  //console.table(placedData);
                  return placedData;
                });
              }
            ).catch(
              function (error) {
                console.log(`Error with Reviews was caught:  ${error}`);
                dbPromise.then(function (db) {
                  let tx = db.transaction('ReviewsStore');
                  let cache = tx.objectStore('ReviewsStore');
                  return cache.getAll();
                })
              })
            callback(null, reviewsData)
          });
    }
  }

  static fetchReviewsById(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id == id);
        //the first element in restaurants array who's id value matches this id
        if (review) { // Got the restaurant
          //console.log(restaurant);
          callback(null, review);
          console.log(callback)
        } else { // Restaurant does not exist in the database
          callback('Reviews does not exist', null);
        }
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }




  // favorite
  // static toggleFavorite(restaurant, isFavorite) {
  //       fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, {
  //           method: 'PUT'
  //       })
  //       .then(response => {
  //           return response.json();
  //       })
  //       .then(data => {
  //     const dbPromise = idb.open("TheRestaurantDepot");
  //           DBHelper.dbPromise.then(db => {
  //               if (!db) return;
  //               const tx = db.transaction('all-restaurants', 'readwrite');
  //               const store = tx.objectStore('all-restaurants');
  //               store.put(data)
  //           });
  //           return data;
  //       })
  //       .catch(error => {
  //     restaurant.is_favorite = isFavorite;
  //     console.log(error);
  //               return;
  //       });
  // }
  
  static toggleRestaurantFavoriteStatus(id, setFavorite, callback) {
    let url;

    if (setFavorite) {
      url = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=true`;
    }
    else {
      url = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('put', url);
    xhr.send(JSON.stringify({is_favorite: setFavorite}));
    xhr.onload = function(event) {
      if (event.target.response && event.target.status === 200) {
        return callback(JSON.parse(event.target.response).is_favorite);
      }
      throw new Error('Response not okay status');
    };
    xhr.onerror = function(event) {
      console.log('[error] toggle restaurant favorite status failed', event.target.response);
    }
  }
}
