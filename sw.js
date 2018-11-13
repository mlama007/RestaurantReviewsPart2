const files = [
  '/',
  'restaurant.html',
  // CSS
  'css/styles.css',
  // manifest
  'manifest.json',
  // data
  'http://localhost:1337/restaurants',
  // img
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  // JS
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
]

// caching
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('Version_2').then(function(cache) {
      return cache.addAll(files);
    })
  );
});

// To get data from cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response){
      if (response) return response;
      return fetch (event.request);
    })
  );    
});

// remove old versions of cache
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.filter(function(cacheName){
          return cacheName.startsWith('Version_') &&
        cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      ); 
    })
  );
});

// 404
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response){
      //file does not exist
      if (response.status == 404){
        return new Response ("Whoops!");
      }
      return response;
    }).catch(function(){
      //offline
      return new Response("Failed");
    })
  );
});



self.addEventListener('sync', function (event) {
	if (event.tag == 'myFirstSync') {
		const DBOpenRequest = indexedDB.open('restaurants', 1);
		DBOpenRequest.onsuccess = function (e) {
			db = DBOpenRequest.result;
			let tx = db.transaction('offline-reviews', 'readwrite');
			let store = tx.objectStore('offline-reviews');
			let request = store.getAll();
			request.onsuccess = function () {
				for (let i = 0; i < request.result.length; i++) {
					fetch(`http://localhost:1337/reviews/`, {
						body: JSON.stringify(request.result[i]),
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
						return response.json();
					})
					.then(data => {
						let tx = db.transaction('all-reviews', 'readwrite');
						let store = tx.objectStore('all-reviews');
						let request = store.add(data);
						request.onsuccess = function (data) {
							let tx = db.transaction('offline-reviews', 'readwrite');
							let store = tx.objectStore('offline-reviews');
							let request = store.clear();
							request.onsuccess = function () { };
							request.onerror = function (error) {
								console.log(error);
							}
						};
						request.onerror = function (error) {
							console.log(error);
						}
					})
					.catch(error => {
						console.log(error);
					})
				}
			}
			request.onerror = function (e) {
				console.log(e);
			}
		}
		DBOpenRequest.onerror = function (e) {
			console.log(e);
		}
	}
});