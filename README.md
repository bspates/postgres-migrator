Postgres Migrator

`npm i --save-dev postgres-migrator`

Dead simple postgres migration runner. To use add a script like this to your package.json

```
...
"dev-migrate": "PM_DB_URL=postgres://postgres@localhost:5432/postgres postgres-migrator"
...
```
