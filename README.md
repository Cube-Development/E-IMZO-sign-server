# E-IMZO Sign Server

Node.js сервер для интеграции с системой электронной цифровой подписи E-IMZO.

## Описание

Сервер предоставляет API для работы с электронными цифровыми подписями через E-IMZO, включая интеграцию с различными внешними сервисами через REST API и WebSocket соединения. Использует AutoIt скрипты для автоматизации взаимодействия с модальными окнами E-IMZO.

## Технологии

- **Node.js** с **TypeScript**
- **Express.js** - веб-сервер
- **WebSocket** - для real-time коммуникации
- **Axios** - HTTP клиент
- **Zod** - валидация данных
- **AutoIt** - автоматизация работы с модальными окнами E-IMZO

## Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/Cube-Development/E-IMZO-sign-server.git
cd e-imzo-sign-server

# Установите зависимости
npm install

# Создайте файл окружения
cp .env.example .env
```

### Требования к системе

- **Node.js** 18+ и **npm**
- **AutoIt** установленный в системе для работы с UI E-IMZO
- **E-IMZO** установленный на машине
- Доступ к указанным API endpoints

## Конфигурация

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# WebSocket URL для Crypto API
CRYPTOAPI_WSS_URL=wss://example.com/crypto

# REST API endpoints
DIDOX_API_URL=https://api.didox.com
BLOGIX_API_URL=https://api.blogix.com

# Пароль для ключа ЭЦП
ECP_KEY_PASSWORD=your-secret-password

# Задержка между попытками обновления логина (в минутах)
LOGIN_REFRESH_DELAY=60
```

### Переменные окружения

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `CRYPTOAPI_WSS_URL` | WebSocket URL для подключения к Crypto API | Да |
| `DIDOX_API_URL` | Base URL для DIDOX API | Да |
| `BLOGIX_API_URL` | Base URL для BLOGIX API | Да |
| `ECP_KEY_PASSWORD` | Пароль для ключа электронной цифровой подписи | Да |
| `LOGIN_REFRESH_DELAY` | Интервал обновления сессии в миллисекундах (по умолчанию: 60) | Нет |

## Запуск

### Разработка

```bash
npm run dev
```

Сервер запустится в режиме разработки с автоматической перезагрузкой при изменении файлов.

### Продакшн

```bash
npm run build
npm start
```

## Структура проекта

```
src/
├── actions/          # Основные действия приложения
│   ├── index.ts
│   ├── login.ts
│   └── sign-document.ts
├── api/              # API интеграции
│   ├── didox.api.ts
│   └── index.ts
├── config/           # Конфигурация приложения
│   ├── constants.ts
│   └── index.ts
├── modules/          # Внешние модули
│   ├── e-imzo/       # E-IMZO интеграция
│   └── sign/         # Модуль подписания
├── script/           # AutoIt скрипты для UI автоматизации
│   ├── auto-sign-demon.au3
│   ├── auto-sign.au3
│   ├── index.ts
│   └── run.ts
├── types/            # TypeScript типы
│   ├── crypto.types.ts
│   ├── didox.enum.ts
│   ├── didox.type.ts
│   └── index.ts
├── utils/            # Вспомогательные функции
│   ├── index.ts
│   ├── key-manager.ts
│   ├── logger.ts
│   └── parse-certificate-alias.ts
├── websocket/        # WebSocket обработчики
│   ├── crypto.websocket.ts
│   ├── crypto.service.ts
│   └── index.ts
└── index.ts          # Точка входа приложения
```

## Функциональность

### Основные возможности

- **Автоматическое подписание документов** через E-IMZO
- **WebSocket соединение** с Crypto API для real-time операций
- **REST API интеграция** с внешними сервисами (DIDOX, BLOGIX)
- **UI автоматизация** модальных окон E-IMZO через AutoIt скрипты
- **Управление сертификатами** и ключами ЭЦП
- **Логирование операций** и обработка ошибок

### AutoIt скрипты

Проект включает AutoIt скрипты для автоматизации работы с пользовательским интерфейсом E-IMZO:

- `auto-sign.au3` - основной скрипт подписания
- `auto-sign-demon.au3` - демон для мониторинга процессов подписания

