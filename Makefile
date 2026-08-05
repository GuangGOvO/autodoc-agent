.PHONY: build up down logs restart ps

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
