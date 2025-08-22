# Adaptive Workflow Engine — Demo

A small, deployable reference architecture for a config-driven survey
workflow engine. Built as a demonstration project for a behavioural
research platform proposal.

The instrument is authored as a single JSON document. The backend
evaluates branching, persists session state, and exports flat results.
The frontend is purely a renderer — it knows nothing about the study.

## Highlights

- **Config-driven** — every step, branching rule, validation constraint,
  and section grouping lives in one JSON file. No question content is
  hardcoded in the application.
- **Adaptive branching** — per-step `show_if` predicates are evaluated
  against the live answer set. Visibility is recomputed on every
  navigation, so changing an early answer correctly re-routes later
  steps.
- **Resumable sessions** — session id is persisted in `localStorage`. A
  full browser refresh, a different device, or a return visit tomorrow
  drops the respondent at the right step.
- **Clean export** — flat JSON export of every answer plus session
  metadata. The same plumbing extends to SPSS/CSV without touching the
  engine.
- **Side-by-side config preview** — the runner UI shows the active
  step config, the full study, and the live answer set in a tabbed
  panel. Demonstrates the data-driven shape of the platform.

## Architecture

```
backend/
  app/
    engine/            pure step-resolution + branching + validation
    storage/           SQLAlchemy 2.0 models + repository
    routes/            FastAPI endpoints
    config/            study JSON + loader (cached)
    schemas/           Pydantic wire schemas
    settings.py        env-driven config (Postgres or SQLite fallback)
    main.py            FastAPI app + CORS + lifespan
  smoke_test.py        in-process end-to-end check
  requirements.txt
frontend/
  src/
    api/               typed fetch client
    engine/            shared workflow types
    components/        question renderers + chrome
      questions/       single, multi, scale, text, info
    app/               Next.js routes (landing + workflow runner)
```

The engine module is a pure function over `(study_config, answers)` —
no DB, no network, no globals. That makes it cheap to test and easy to
swap into a different runtime (CLI, batch reprocessor, what have you).

## API surface

| Method | Path                              | Purpose                                   |
| ------ | --------------------------------- | ----------------------------------------- |
| POST   | `/sessions`                       | Create a session, return the first step.  |
| GET    | `/sessions/{id}`                  | Resume — returns the step to render next. |
| POST   | `/sessions/{id}/answer`           | Submit an answer; advance the flow.       |
| GET    | `/sessions/{id}/export`           | Flat JSON export (download).              |
| GET    | `/config`                         | The active study config (read-only).      |
| GET    | `/health`                         | Liveness probe.                           |

OpenAPI docs are served at `/docs`.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit if you want Postgres; SQLite is the default

uvicorn app.main:app --reload
```

The API will be on `http://localhost:8000`.

Smoke test (no network, runs the app in-process):

```bash
python smoke_test.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

npm run dev
```

App on `http://localhost:3000`. Open `/workflow` to start the
demonstration flow.

## Deployment

### Backend on Render

`render.yaml` is included at the repo root. From the Render dashboard:

1. Create a new Postgres database (Render or [Neon](https://neon.tech)).
   Copy the connection string.
2. Connect this repository as a new Blueprint. Render will pick up
   `render.yaml`.
3. Set `DATABASE_URL` to the Postgres connection string. Use the
   `postgresql+psycopg://` driver prefix so SQLAlchemy picks the
   `psycopg` v3 driver, e.g.
   `postgresql+psycopg://user:pass@host/db?sslmode=require`.
4. Set `CORS_ORIGINS` to the deployed frontend URL (comma-separated if
   multiple).

### Frontend on Vercel

1. Import the `frontend/` directory as a Vercel project.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your Render backend URL (no
   trailing slash).
3. Deploy. Subsequent pushes auto-deploy.

## Authoring a new study

Edit `backend/app/config/study.json`. Step types currently supported:

| `type`           | Required keys                | Notes                                        |
| ---------------- | ---------------------------- | -------------------------------------------- |
| `info`           | `body`                       | No answer recorded; just advances.           |
| `single_choice`  | `options[]`                  | Each option needs `value` + `label`.         |
| `multi_choice`   | `options[]`                  | Optional `min_select` / `max_select`.        |
| `scale`          | `min`, `max`                 | Optional `min_label` / `max_label`.          |
| `short_text`     | —                            | Optional `placeholder`, `max_length`.        |
| `long_text`      | —                            | Same as above; rendered as a textarea.       |

Branching: any step may declare `"show_if": { "field_id": value }` (or
a list of allowed values). Unknown step types pass through the
backend; the frontend will show a placeholder so misauthored configs
fail loudly.
