Итоговая работа по курсу HTML5 API

Создано веб-приложение для отслеживания "кофейных мест" на яндекс-карте, приложение доступно на [GitHub Pages](https://alexey-ryabkov.github.io/ith-html5-api/demo/)

## Комментарии к реализации

Для UI веб-приложения используется фреймворк [SvelteKit](https://kit.svelte.dev/) и UI-toolkit [Skeleton (v2)](v2.skeleton.dev). Используется Javascript API яндекс-карт 3ей версии. 

Основная работа с яндекс-картой и Geolocation API происходит [в основном руте](/src/routes/+page.svelte), для работы с localStorage для хранения пользовательских данных используется [обертка над svelte-стором](/src/lib/core/storeCreators.ts).

## Локальный запуск

Прописать ключ API яндекс-карт в .env.local (см. [.env.example](/.env.example))

```bash
npm i # установить зависимости проекта (сборка тестировалась с NodeJS версии 22.3)
npm run dev # запуск на локальном dev-сервере
```
