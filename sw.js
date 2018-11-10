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

