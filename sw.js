const files = [
  '/',
  'restaurant.html',
  // CSS
  'css/styles.css',
  // data
  'data/restaurants.json',
  // img
  'img/Busy_Restaurant.jpg',
  'img/Empty_Restaurant.jpg',
  'img/Outdoor_sign.jpg',
  'img/Outside_Burger_Restaurant.jpg',
  'img/Outside_Restaurant.jpg',
  'img/People_Eating.jpg',
  'img/People_sitting_Restaurant.jpg',
  'img/Pizza.jpg',
  'img/Round_table_restaurant.jpg',
  'img/Table_with_Grill.jpg',
  // JS
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
]

// caching
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('Version_1').then(function(cache) {
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