# Итоговая работа по курсу HTML5 API

Создано веб-приложение для отслеживания "кофейных" мест на яндекс-карте: после загрузки приложения показываются "кофейные" места рядом с местоположением пользователя (примерный радиус задается константой [MAP_SEARCH_SPAN](/src/lib/constants.ts)), пользователь может добавить их, а также произвольные места на карте, в "свои места". Приложение доступно на [vercel](https://ith-htm5-api.vercel.app/).

## Комментарии к реализации

Для UI веб-приложения используется фреймворк [SvelteKit](https://kit.svelte.dev/) и UI-toolkit [Skeleton (v2)](https://v2.skeleton.dev). Используется Javascript API яндекс-карт 3ей версии. 

Основная работа с яндекс-картой и Geolocation API происходит [в руте page](/src/routes/+page.svelte), для работы с localStorage для хранения пользовательских данных используется [обертка над svelte-стором](/src/lib/core/storeCreators.ts).

## Локальный запуск

Предварительно необходимо прописать ключ API яндекс-карт в .env.local (см. [.env.example](/.env.example)), в кабинете разработчика яндекс-карт указать `localhost` в ограничениях по HTTP Referer.

```bash
# установить зависимости проекта (сборка тестировалась с NodeJS версии 22.3)
npm i 
# последовательно запустить
npm run build
npm run preview
```
