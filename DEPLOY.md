# NextSound — руководство по разработке и деплою

Полная инструкция: как менять код, собирать и выкатывать на прод. Для себя, чтобы ничего не забыть.

> ⚠️ **Секреты (пароли, ключи) НЕ коммить в git.** В этом файле они заменены на `<ПЛЕЙСХОЛДЕРЫ>`. Реальные значения лежат в `.env` на сервере и у тебя в заметках.

---

## 1. Как всё устроено (архитектура)

```
                  Интернет
                     │
              https://24nextsound.ru
                     │
              ┌──────▼───────┐
              │    Caddy     │  (на сервере, порты 80/443, авто-SSL)
              └──────┬───────┘
        ┌────────────┼─────────────┐
        │            │             │
   /api/* → :3000   /track/:id     всё остальное
   (бэкенд)         для ботов →    → отдаёт фронт
                    OG-превью      из /var/www/nextsound
                     │
              ┌──────▼─────────┐        ┌─────────────┐
              │ nestjs backend │◄──────►│   MySQL     │  (оба в Docker/Podman)
              │  :3000         │        │   :3306     │
              └──────┬─────────┘        └─────────────┘
                     │
              ┌──────▼─────────┐
              │  S3 (TimeWeb)  │  обложки / аудио / аватары
              └────────────────┘
```

- **Фронтенд** (React + Vite) — статика, лежит в `/var/www/nextsound`, раздаётся Caddy.
- **Бэкенд** (NestJS) — контейнер `nextsound_backend` на `127.0.0.1:3000`, наружу не торчит, доступен только через Caddy `/api`.
- **База** (MySQL 8) — контейнер `nextsound_mysql`, схема создаётся автоматически (TypeORM `synchronize: true`).
- **Файлы** (треки, обложки, аватары) — в облачном S3-хранилище TimeWeb, в БД лежат полные публичные ссылки.
- **Caddy** — на самом сервере (не в Docker), терминирует HTTPS и проксирует.

**Где что лежит на сервере:**
| Что | Путь |
|---|---|
| Код бэкенда + docker-compose + `.env` + `Caddyfile` | `/root/nextsound-backend` |
| Статика фронтенда | `/var/www/nextsound` |
| Конфиг Caddy (рабочий) | `/etc/caddy/Caddyfile` |

---

## 2. Что нужно на компьютере

- **Node.js 20+** (проверка: `node -v`).
- **Git** (вместе с ним ставится **Git Bash** — он понадобится для деплоя фронта).
- Два репозитория рядом:
  - `C:\Users\Flipper\Desktop\PROG\nextsound-frontend`
  - `C:\Users\Flipper\Desktop\PROG\nextsound-backend`

Сервер: `root@85.193.80.7`, домен `24nextsound.ru`. Пароль root-а — у тебя в заметках.

---

## 3. Локальная разработка (запуск на своём компе)

### Бэкенд
```bash
cd C:\Users\Flipper\Desktop\PROG\nextsound-backend
npm install            # один раз, после клона или смены зависимостей
npm run start:dev      # запускает на http://localhost:3000 с автоперезагрузкой
```
Нужен локальный MySQL на `:3306`, БД `nextsound_db`, креды — в `nextsound-backend/.env`.

### Фронтенд
```bash
cd C:\Users\Flipper\Desktop\PROG\nextsound-frontend
npm install
npm run dev            # http://localhost:5173
```
Чтобы фронт ходил в локальный бэкенд, создай файл `nextsound-frontend/.env.local`:
```
VITE_API_URL=http://localhost:3000
```
(`.env.local` игнорируется git-ом. Удалишь его — фронт снова будет ходить в прод.)

**Тестовый аккаунт (локальная база):** `tester@demo.com` / `test1234`.

---

## 4. Как вносить изменения и заливать в git

Работаем в ветке `master`. После правок:
```bash
git add .
git commit -m "понятное описание изменений"
git push origin master
```

**Правила:**
- В коммитах **не** писать, что код сделала нейросеть.
- Версионирование — **SemVer** (`MAJOR.MINOR.PATCH`). На каждый заметный релиз:
  1. поднять `version` в `package.json` (и во фронте, и в бэке — держим одинаковыми);
  2. дописать запись в `nextsound-frontend/CHANGELOG.md`;
  3. в сообщении коммита указать версию, напр. `v1.7.0: ...`.
  - PATCH (`x.x.+1`) — багфиксы. MINOR (`x.+1.0`) — новые фичи. MAJOR — ломающие изменения.

---

## 5. Подключение к серверу

Из любого терминала (PowerShell или Git Bash):
```bash
ssh root@85.193.80.7
```
Введёшь пароль root-а → попадёшь в консоль сервера. `exit` — выйти.

---

## 6. Деплой БЭКЕНДА (любые правки в `nextsound-backend/src`)

**Шаг 1 — локально:** закоммить и запушить (см. раздел 4). Полезно перед пушем проверить сборку:
```bash
cd C:\Users\Flipper\Desktop\PROG\nextsound-backend
npm run build          # если упадёт с ошибкой — чинить до пуша
```

**Шаг 2 — на сервере:**
```bash
ssh root@85.193.80.7
cd /root/nextsound-backend
git fetch origin
git reset --hard origin/master        # подтянуть свежий код
docker-compose up -d --build backend  # пересобрать и перезапустить бэкенд
```

**Шаг 3 — проверить, что взлетел:**
```bash
docker logs --tail 30 nextsound_backend
# должно быть: "Server is running on port 3000"
```

> Изменил поле в `*.entity.ts` (новая колонка)? Ничего отдельно делать не надо — TypeORM `synchronize` сам добавит колонку при старте бэкенда.

---

## 7. Деплой ФРОНТЕНДА (любые правки в `nextsound-frontend/src`)

Сборка делается **локально** (на сервере Node старый), потом готовая папка `dist` заливается на сервер.

**Шаг 1 — собрать (в обычном терминале или Git Bash):**
```bash
cd C:\Users\Flipper\Desktop\PROG\nextsound-frontend
npm run build
```
Сборка сама подхватывает `VITE_API_URL=/api` из файла `.env.production` (он уже создан в репозитории — трогать не нужно). Готовая статика появится в папке `dist`.

**Шаг 2 — залить `dist` на сервер. Открой Git Bash** в папке фронта и выполни:
```bash
cd dist
tar czf - . | ssh root@85.193.80.7 'rm -rf /var/www/nextsound && mkdir -p /var/www/nextsound && tar xzf - -C /var/www/nextsound'
```
(спросит пароль root-а). Эта команда упаковывает `dist`, отправляет на сервер, стирает старую версию и распаковывает новую.

**Шаг 3 — проверить:** открой https://24nextsound.ru и нажми **Ctrl+F5** (жёсткое обновление, чтобы сбросить кэш браузера).

> Бэкенд при деплое фронта трогать **не нужно** — это разные вещи. Меняешь только вид/логику страниц → деплой только фронта.

---

## 8. Шпаргалка по серверу (выполнять внутри `ssh`)

### Контейнеры (Docker/Podman)
```bash
docker ps                              # что запущено
docker logs -f nextsound_backend       # логи бэкенда в реальном времени (Ctrl+C выйти)
docker logs --tail 50 nextsound_backend
docker-compose -f /root/nextsound-backend/docker-compose.yml restart backend   # перезапуск без пересборки
docker-compose -f /root/nextsound-backend/docker-compose.yml up -d --build backend  # пересборка
docker stats --no-stream               # нагрузка CPU/RAM
```

### База данных (MySQL)
```bash
# зайти в консоль MySQL:
docker exec -it nextsound_mysql mysql --default-character-set=utf8mb4 -uroot -p<DB_PASSWORD> nextsound_db
# дальше обычный SQL, например:
#   SELECT id, title FROM track ORDER BY id DESC LIMIT 10;
#   SELECT COUNT(*) FROM user;
# выйти: exit

# одной строкой без входа в консоль:
docker exec nextsound_mysql mysql --default-character-set=utf8mb4 -uroot -p<DB_PASSWORD> nextsound_db -e "SELECT id,title FROM track;"
```
> `--default-character-set=utf8mb4` обязателен, иначе кириллица в выводе/поиске ломается.

### Caddy (веб-сервер / SSL / проксирование)
```bash
systemctl status caddy                 # работает ли
systemctl reload caddy                 # применить изменения конфига
nano /etc/caddy/Caddyfile               # редактировать конфиг (Ctrl+O сохранить, Ctrl+X выйти)
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile   # проверить конфиг ДО reload
```
Конфиг Caddy дублируется в репозитории бэкенда (`/root/nextsound-backend/Caddyfile`). Если правишь его — сначала скопируй на место и проверь:
```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak     # бэкап на всякий
cp /root/nextsound-backend/Caddyfile /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
```

### Перезагрузка сервера
```bash
reboot     # контейнеры и Caddy поднимутся сами после перезагрузки
```

---

## 9. Переменные окружения

### Сервер: `/root/nextsound-backend/.env` (НЕ в git)
Ключи (значения — секреты):
```
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=<...>
DB_NAME=nextsound_db
JWT_SECRET=<...>
PORT=3000
FRONTEND_URL=https://24nextsound.ru
MAIL_ENABLED=true
MAIL_HOST=smtp.timeweb.ru
MAIL_PORT=465
MAIL_USER=no-reply@24nextsound.ru
MAIL_PASS=<...>
MAIL_FROM=no-reply@24nextsound.ru
S3_ENDPOINT=https://s3.twcstorage.ru
S3_REGION=ru-1
S3_BUCKET=<...>
S3_ACCESS_KEY=<...>
S3_SECRET_KEY=<...>
S3_PUBLIC_URL=https://s3.twcstorage.ru/<bucket>
```
После правки `.env` — пересобрать бэкенд (раздел 6, шаг 2), чтобы подхватил.

### Локально
- `nextsound-backend/.env` — для локального запуска (своя локальная база).
- `nextsound-frontend/.env.local` — `VITE_API_URL=http://localhost:3000` для локальной разработки.
- `nextsound-frontend/.env.production` — `VITE_API_URL=/api`, используется при `npm run build` (уже в репо).

---

## 10. Типовые задачи

| Хочу… | Что делать |
|---|---|
| Поменять текст/кнопку/стиль на сайте | правка во `frontend/src` → деплой фронта (раздел 7) |
| Добавить/изменить логику API | правка в `backend/src` → деплой бэка (раздел 6) |
| Добавить поле в таблицу | добавить колонку в `*.entity.ts` → деплой бэка (колонка создастся сама) |
| Посмотреть, почему ошибка 500 | `ssh` → `docker logs --tail 50 nextsound_backend` |
| Удалить трек/юзера руками | через админ-панель `/admin` (ты админ) или SQL в MySQL |
| Посмотреть данные в базе | раздел 8 → MySQL |
| Откатить неудачный деплой | `git revert <коммит>` → запушить → передеплоить; или `git reset --hard <старый-коммит>` локально и заново |

---

## 11. Если что-то сломалось (траблшутинг)

- **Сайт вообще не открывается** → проверь Caddy: `ssh` → `systemctl status caddy`. Если упал — `systemctl restart caddy`.
- **Сайт открывается, но всё ломается / API не отвечает (502)** → упал бэкенд: `docker logs --tail 50 nextsound_backend`. Перезапустить: `docker-compose -f /root/nextsound-backend/docker-compose.yml up -d backend`.
- **Бэкенд не стартует** → почти всегда ошибка в логах (синтаксис, миграция, не та переменная в `.env`). Читай `docker logs`.
- **Фронт показывает старую версию** → кэш браузера, жми **Ctrl+F5**. На телефоне — закрой и открой вкладку.
- **Превью ссылки в Telegram не появляется** → это кэш Telegram. Отправь ссылку боту **@WebpageBot** — он сбросит кэш.
- **Кириллица кракозябрами в MySQL** → забыл `--default-character-set=utf8mb4`.
- **Изменения в коде не применились на сервере** → не запушил локально, либо не сделал `git reset --hard origin/master` на сервере, либо не пересобрал контейнер (`--build`).

---

## 12. Чек-лист релиза (быстро)

1. Поправил код локально, проверил (`npm run build` в нужном репо).
2. Поднял версию в `package.json` + дописал `CHANGELOG.md`.
3. `git add . && git commit -m "vX.Y.Z: ..." && git push origin master` (в каждом изменённом репо).
4. Бэкенд менялся? → `ssh` → `cd /root/nextsound-backend && git fetch && git reset --hard origin/master && docker-compose up -d --build backend` → проверить логи.
5. Фронт менялся? → локально `npm run build` → Git Bash: `cd dist && tar czf - . | ssh root@85.193.80.7 '...'`.
6. Открыть сайт, Ctrl+F5, проверить.
