# E-IMZO Sign Server

Автоматизированный сервер для электронного подписания документов через E-IMZO с поддержкой AutoIt UI автоматизации, REST API и WebSocket соединений.

## Описание

E-IMZO Sign Server предоставляет HTTP API для автоматизации процесса электронного подписания документов с использованием криптографического ПО E-IMZO. Сервер интегрируется с внешними сервисами (DIDOX) и поддерживает автоматизацию пользовательского интерфейса через AutoIt.

## Особенности

- ✅ REST API с автоматической документацией Swagger
- 🔌 WebSocket поддержка для real-time обновлений
- 🤖 AutoIt автоматизация UI E-IMZO
- 🔐 Интеграция с криптографическими сервисами
- 📋 TypeScript поддержка
- 🔄 Автоматическое обновление при разработке
- ⚡ Express.js сервер

## Требования

- **Node.js** 18+ 
- **AutoIt** (для UI автоматизации)
- **E-IMZO** криптографическое ПО (установлено и настроено)
- **Windows** (для работы с E-IMZO и AutoIt)

## Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/Cube-Development/E-IMZO-sign-server.git
cd e-imzo-sign-server

# Установите зависимости
npm install

# Скопируйте файл окружения
cp .env.example .env
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# WebSocket URL для CryptoAPI
CRYPTOAPI_WSS_URL=

# Настройки E-IMZO
ECP_KEY_PASSWORD=
LOGIN_REFRESH_DELAY=

# API URLs внешних сервисов
DIDOX_API_URL=

# Настройки сервера
PORT=
API_KEY=

# Путь до приложения AutoIt
AUTOIT_APP_PATH=

# Флаги функциональности
USE_AUTOIT_DEMON=
USE_INSECURE_TLS=
```

### Описание переменных

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `CRYPTOAPI_WSS_URL` | WebSocket URL для подключения к CryptoAPI | ✅ |
| `ECP_KEY_PASSWORD` | Пароль для ключа ЭЦП | ✅ |
| `LOGIN_REFRESH_DELAY` | Задержка обновления логина (мин) | ❌ |
| `PORT` | Порт сервера | ❌ |
| `USE_AUTOIT_DEMON` | Включить AutoIt автоматизацию | ❌ |
| `AUTOIT_APP_PATH` | Путь до приложения AutoIt | ❌ |
| `DIDOX_API_URL` | Base URL для DIDOX API | ✅ |
| `API_KEY` | API ключ для аутентификации | ✅ |
| `USE_INSECURE_TLS` | Разрешить небезопасные TLS соединения | ❌ |

## Команды

```bash
# Разработка с hot-reload
npm run dev

# Сборка проекта
npm run build

# Продакшен запуск
npm start

# Очистка build директории
npm run clean
```

## API Документация

После запуска сервера документация Swagger доступна по адресу:
```
http://localhost:PORT/api/docs
```

## Структура проекта

```
src/
├── actions/          # Бизнес-логика действий
├── api/             # API маршруты и контроллеры
├── config/          # Конфигурация приложения
├── middleware/      # Express middleware
├── modules/         # Основные модули
│   ├── e-imzo/     # Интеграция с E-IMZO
│   └── sign-didox/ # Интеграция с DIDOX
├── script/auto-it/ # AutoIt скрипты
├── utils/          # Утилиты
│   └── swagger/    # Swagger конфигурация
└── websocket/      # WebSocket обработчики
```

## Функциональность

### Основные возможности

- **Автоматическое подписание документов** через E-IMZO
- **WebSocket соединение** с Crypto API для real-time операций
- **REST API интеграция** с внешними сервисами (DIDOX)
- **UI автоматизация** модальных окон E-IMZO через AutoIt скрипты
- **Управление сертификатами** и ключами ЭЦП
- **Логирование операций** и обработка ошибок

### AutoIt скрипты

Проект включает AutoIt скрипты для автоматизации работы с пользовательским интерфейсом E-IMZO:

- `auto-sign.au3` - основной скрипт подписания
- `auto-sign-demon.au3` - демон для мониторинга процессов подписания

## Устранение неполадок

### Частые проблемы

1. **E-IMZO не запускается**
   - Проверьте установку E-IMZO
   - Убедитесь что сертификаты корректно установлены

2. **AutoIt скрипты не работают**
   - Проверьте установку AutoIt
   - Установите `USE_AUTOIT_DEMON=true`

3. **WebSocket соединение не устанавливается**
   - Проверьте `CRYPTOAPI_WSS_URL`
   - Убедитесь что CryptoAPI сервис запущен

