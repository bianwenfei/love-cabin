// 版本号，每次更新代码时要修改
const CACHE_NAME = 'love-cabin-v3';

// 需要缓存的文件列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('📱 恋爱小屋正在安装...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 正在缓存重要文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ 所有重要文件已缓存');
        return self.skipWaiting(); // 立即激活新的Service Worker
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 恋爱小屋已激活');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✨ 清理完成，Service Worker 已激活');
      return self.clients.claim(); // 立即控制所有页面
    })
  );
});

// 拦截网络请求，提供缓存内容
self.addEventListener('fetch', event => {
  // 对于API请求，直接从网络获取
  if (event.request.url.includes('api.') || 
      event.request.url.includes('analytics')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到，返回缓存的内容
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request)
          .then(response => {
            // 只缓存成功的GET请求
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应（响应只能使用一次）
            const responseToCache = response.clone();
            
            // 将新资源加入缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 如果网络失败，尝试返回缓存
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 监听推送通知（可选功能，未来扩展用）
self.addEventListener('push', event => {
  console.log('📲 收到推送通知');
  
  const options = {
    body: '💕 恋爱小屋提醒您',
    icon: 'icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('恋爱小屋', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});