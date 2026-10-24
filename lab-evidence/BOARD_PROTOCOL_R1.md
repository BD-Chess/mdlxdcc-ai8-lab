# AI8 shared board protocol R1

Accepted division: CLI Code HOME owns BOARD.md. Other sessions emit immutable events.
The Drive folder is a mailbox, not an atomic lock or a shared append log.

## Event

One UTF-8 JSON file per event, named EVENT_<sender>_<utc>_<uuid>.json.
Create locally through a temporary file and rename, then upload exactly once.
An upload with an unknown outcome is reconciled by message_id before retrying.

Required fields:

```json
{
  "schema": "ai8.event.v1",
  "message_id": "unique-uuid",
  "created_utc": "2026-10-25T00:00:00Z",
  "sender": "BRAT_HOME",
  "task_id": "B1",
  "type": "progress",
  "state": "running",
  "summary": "Short public-safe statement",
  "owner": "CLI Codex HOME",
  "evidence": [],
  "reply_to": null
}
```

Types: claim-request, assigned, progress, completed, blocked, released, finding.
States: proposed, queued, running, waiting, completed, failed, cancelled.
Messages may arrive late or twice. The coordinator deduplicates by message_id;
timestamps alone do not authorize a transition or revoke another owner.
Only coordinator assignment establishes an owner. A proposal is not a lock.

## Board and public summary

The coordinator alone updates BOARD.md with task, owner, state, updated_utc,
next_action and evidence. Private details stay in the private mailbox.
A separately authored public summary contains only publishable facts and an
explicit last-updated time; no private paths, credentials or private document IDs.
The dashboard must label missing or stale data instead of implying live progress.

## Resources and recovery

Each host has one admission owner and a maximum of five AI sessions in total;
Listener debate capacity is a different measurement. RAM-heavy LLM tests require
an explicit reservation. No new session is admitted merely because Drive looks
idle. A missing heartbeat is a reason to investigate, not permission for a second
writer. A local process/status check must reconcile ownership before reassignment.

This is the agreed protocol proposal, not an implemented distributed scheduler.
