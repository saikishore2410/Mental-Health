# Firestore Security Specification (ABAC / Zero-Trust Architecture)

This document maps the security expectations of the Firestore database for the mental health tracking and reflection application. It defines the strict rules governing access controls, end-to-end encrypted parameters, HIPAA/GDPR isolation boundaries, and validation guards.

## 1. Core Data Invariants

1. **Owner-Locked Sensitive Logs**: A `MoodEntry` or `JournalEntry` must never under any circumstances be read, retrieved, written, or edited by anyone other than the authenticated user matching the record's `userId`. 
2. **E2EE Ciphertext Integrity**: Journal updates and sensitive mood notes are saved in ciphertext format (requires local passphrase). Any write attempt to standard text fields that has bypassed encryption must be blocked.
3. **Immutability of Historical Audits**: Mood logs represent clinical timestamps of daily stress. They are strictly read-only on update. Deletion is restricted to active user self-service.
4. **Anonymized Support Board**: The `ForumPost` collection is physically separated from private identity markers. While lists are publically queryable for signed-in users, mutating a post belongs strictly to the authenticated creator matching `userId`.
5. **Like Counter Atomicity**: A user might upvote/like a supportive post on the forum. They can only increment `likesCount` when synchronously adding their own `userId` to the `likedBy` collection, preventing vote-stuffing or spoofed increments.

---

## 2. The "Dirty Dozen" Vulnerability Payload Attempts

The following 12 malicious payloads represent standard penetration vectors attempting to hijack application data or pollute indices. Our ruleset MUST synchronously decline all of these attempts with `PERMISSION_DENIED`.

### Vector A: Identity Hijacking & Spoofing
1. **Malicious UID Creation** (User `attacker_uid` attempts to write a journal entry where `userId` is set to `victim_uid` to frame or spy on them).
2. **Anonymous Access Breach** (Unauthenticated requester attempts to list user mood diaries without logging into Firebase).
3. **Forum Writer Imitation** (User `attacker_uid` submits a forum message or upvotes with the alias of another member and forces a mismatched `userId` attribute).

### Vector B: Field Privilege Escalation & Resource Exhaustion (Denial-of-Wallet)
4. **Massive Payload Attack** (Vandal uploads a 50KB garbage text block inside `moodScore` or junk string inside the ID tag e.g., `isValidId()` bypass).
5. **Spoofed Rating Range** (User sends a rating score of `moodScore: 99` or `stressLevel: -100` attempting to trigger render errors on user dashboard metrics).
6. **Chronological Forgery** (User passes a manual `createdAt` historical timestamp representing the year 2099 instead of the mandatory `request.time` server verification).

### Vector C: Mutating Immutable Objects & Relational Violations
7. **Historical Log Modification** (User attempts to write an `update` rule changing a recorded `moodScore` or `wearable physiological stress indicator` from last month).
8. **Journal Hijacker Edit** (Unauthorized user tries to append or override a different member's end-to-end encrypted reflection journal).
9. **Private Key/Data Drift** (Malicious packet modifies `userId` parameter inside an existing `journals` document).

### Vector D: Support Forum Vote Stuffing & Poisoning
10. **Shadow Upvote Manipulation** (User updates `likesCount` by `+50` in a single request without validating the `likedBy` array).
11. **Mismatched Upvoter Spoof** (User triggers a request to append another user's UID `victim_uid` into `likedBy` to spoof their like status).
12. **Post Payload Hijacking** (Vandal attempts to modify the `content` of another user's public encouragement feedback post).

---

## 3. Test Cases Spec Outline

Tests execute standard transactional simulation to confirm that each of these dozen attack payloads gets strictly rejected. 

A standard test script (`firestore.rules.test.ts`) simulates:
- Unauthenticated reading of `/moods` (Should FAIL).
- Auth user `alice` writing `/moods/mood_1` with `userId = "bob"` (Should FAIL).
- Auth user `alice` updating a written `/moods/mood_1` (Should FAIL - Mood entries are historical log records and remains immutable on upate).
- Auth user `alice` writing a forum thread with a forged `createdAt` (Should FAIL).
- Auth user `alice` upvoting a post while modifying the body string at the same time (Should FAIL).
