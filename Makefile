.PHONY: build up down logs restart ps migrate backup restore

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

restart:
	docker compose restart app

ps:
	docker compose ps

migrate:
	docker compose exec -T app node scripts/migrate.mjs

backup:
	mkdir -p backups
	docker compose exec -T db pg_dump -U $${POSTGRES_USER:-autodoc} -d $${POSTGRES_DB:-autodoc} > backups/autodoc-$$(date +%Y%m%d-%H%M%S).sql

restore:
	docker compose exec -T db psql -U $${POSTGRES_USER:-autodoc} -d $${POSTGRES_DB:-autodoc} < backups/$$(ls -t backups/*.sql | head -1)
