# Waakya V3 — Mobile app concept

A design concept, not a native build: `/design-lab/mobile-app` (local only) is
an interactive prototype of the field worker's day as an app would carry it.
Nothing in it touches real data.

## What it demonstrates
| Concept | In the prototype |
|---|---|
| **Push → the exact row** | A notification banner opens the task it is about (deep link `/kaam/:id`); Back returns to Today. |
| **Tabs** | Today · Chats · More (staff); Work joins for people who run work. Thumb-height, 48 px targets. |
| **Swipe and long-press** | Swipe a new task right to accept; long-press for Open / Ask / Can't do it. Both are shortcuts — a visible Accept button and menu remain. |
| **Native task execution** | Dekh liya, ho jayega → Start work → Done, one 60 px button at a time, the step in words. |
| **Camera-first proof** | When a photo is required, Done opens a sheet whose main target is the camera (`capture="environment"`); Send stays disabled until a photo exists; no skip. |
| **Optimistic, then honest** | Every action moves the screen at once and says "Sending…". |
| **Offline** | With the connection off, actions are saved in order ("Saved — 2 to send when you are online") and sent on reconnect. |
| **Persistent composer + mic** | Chats keep the composer; the mic sits inside it, disabled, as the home for Voice when it arrives from the separate Voice work. |
| **Message → work** | Long-press a message (or the quiet link) → a confirm card (who, what, by when) → Send; the message stays and the work remembers it. |
| **Haptics** | One short tick on accept and on done where supported. |
| **Motion** | Sheets rise from the bottom edge (220 ms ease-out); the push banner pops in; reduced motion makes both instant. |

## Decisions carried back into the web
- Camera-first proof and "no skip" are already the web's rule.
- The "Up next" slot on employee Today came from the app home.
- Optimistic states: the web keeps its server-confirmed transitions (the
  audit trail is the truth); the app would queue locally and reconcile.

## Not built (by design)
- A native shell, real push, background sync, voice capture.
