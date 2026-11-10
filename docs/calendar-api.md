# Calendar View: how it gets its data

The calendar (`static/calendar/calendar_view.html`) reads from existing endpoints and adds one of its own.

| Data | Source |
|---|---|
| Application deadlines | `GET /api/applications` (Application Tracker) |
| Interview rounds | `GET /api/applications/{id}/interviews` for each application (Interview Stage Tracker) |
| Readiness tasks | `GET /api/readiness`, `POST /api/readiness/toggle` (Readiness Checklist) |
| Registered career events | Events & Resources (Subsystem 3), called from the calendar page |
| Calendar notes | `GET` / `PUT /api/calendar/notes` (new, `CalendarApi.java`) |

`PUT /api/calendar/notes` takes `key` (`d:<date>` for a day, `e:<event id>` for an event) and `text`; blank text clears the note.
Notes are saved in `data/calendar-notes.tsv` until the central database is available.
