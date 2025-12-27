# T029 — Data Ownership Declaration

**Phase**: 5 (Design Only)
**User Story**: US3 - Progressive Signup
**Type**: Data Policy Documentation

---

## Purpose

Define clearly:
1. What data is stored for anonymous users
2. What data migrates after signup
3. What is deleted if user refuses signup
4. GDPR/CCPA/FERPA compliance rules

---

## Data Categories

### Category 1: Session Data (Anonymous)

**Definition**: Data collected during anonymous usage

**What is Stored**:
- Session ID (UUID v4)
- Message history (current session only)
- Rate limit counters (questions asked, timestamps)
- Trigger state (hint dismissed, prompts shown)

**Storage Location**:
- Browser memory (volatile)
- NO localStorage initially
- NO backend storage

**Duration**:
- Until tab/window closed
- OR until page refresh

**Ownership**: **User** (even though anonymous)

**Deletion**:
- Automatic on tab close
- No server-side persistence
- Cannot be recovered

---

### Category 2: Analytics Data (Anonymous)

**Definition**: Usage telemetry for product improvement

**What is Stored** (if enabled):
- Question count (aggregated)
- Feature usage (which buttons clicked)
- Error events (network failures, validation errors)
- Performance metrics (response times)

**Storage Location**:
- Backend (anonymized)
- Cannot be linked to individual users

**Duration**:
- 90 days

**Ownership**: **Platform** (anonymized)

**User Rights**:
- ✅ Can opt-out (Do Not Track header)
- ✅ Data cannot identify individual users
- ❌ Cannot request deletion (truly anonymous)

---

### Category 3: Account Data (After Signup)

**Definition**: User profile and authentication data

**What is Stored**:
- Email address (or OAuth identifier)
- Display name (optional)
- Profile picture (optional, from OAuth)
- Account creation date
- Session tokens (encrypted)

**Storage Location**:
- Backend database (encrypted)
- localStorage (session token only)

**Duration**:
- Until account deleted
- Session tokens: 30 days

**Ownership**: **User**

**User Rights**:
- ✅ View (account settings)
- ✅ Edit (update profile)
- ✅ Export (JSON download)
- ✅ Delete (right to erasure)

---

### Category 4: Conversation Data (After Signup)

**Definition**: Chat messages and responses

**What is Stored**:
- User messages
- Assistant responses
- Source citations
- Metadata (timestamps, model used)
- Selected text (if provided)

**Storage Location**:
- Backend database (encrypted)
- Indexed for retrieval

**Duration**:
- Until user deletes conversation
- OR until account deleted

**Ownership**: **User**

**User Rights**:
- ✅ View (conversation history)
- ✅ Export (PDF/Markdown)
- ✅ Delete (individual messages or entire conversation)
- ✅ Share (optional, with permission)

---

### Category 5: Personalization Data (After Signup)

**Definition**: User preferences and customization

**What is Stored**:
- Preferred language
- Theme (light/dark)
- Notification settings
- Custom system prompt (future)

**Storage Location**:
- Backend database

**Duration**:
- Until account deleted

**Ownership**: **User**

**User Rights**:
- ✅ View
- ✅ Edit
- ✅ Reset to defaults
- ✅ Delete with account

---

## Data Migration (Anonymous → Signed Up)

### What Migrates

**Session Data → Conversation Data**:
- ✅ Message history from current session
- ✅ Timestamps preserved
- ✅ Session ID linked to user account

**Process**:
1. User signs up
2. Backend creates user account
3. Anonymous session ID linked to user ID
4. Conversation data migrated to user's account
5. Anonymous session ID marked as "migrated"

---

### What Does NOT Migrate

**Intentionally Excluded**:
- ❌ Analytics data (remains anonymous)
- ❌ Rate limit history (reset on signup)
- ❌ Trigger state (fresh start)

---

### Migration Consent

**Requirement**: User must consent to migration

**UX Flow**:
```
User clicks "Sign Up"
  → Modal shows: "Save your current conversation?"
  → Checkbox: "Include this session's messages in my account"
  → Default: Checked (opt-out available)
  → If unchecked: Conversation discarded, fresh start
```

---

## Data Deletion (User Refuses Signup)

### Scenario 1: User Dismisses Soft Prompt

**Action**: User clicks "×" on signup hint

**Data Handling**:
- ✅ Session continues (no deletion)
- ✅ Conversation remains in memory
- ✅ User can change mind later

**Rationale**: Soft prompt is not final decision.

---

### Scenario 2: User Cancels Signup Modal

**Action**: User clicks "Cancel" in signup modal

**Data Handling**:
- ✅ Session continues (no deletion)
- ✅ Conversation remains until tab close
- ✅ User can retry signup later

**Rationale**: Canceling signup ≠ refusing data storage.

---

### Scenario 3: User Closes Tab (Never Signed Up)

**Action**: User closes tab/window without signing up

**Data Handling**:
- ✅ **Automatic deletion** (memory cleared)
- ❌ No server-side data (was anonymous)
- ❌ Cannot be recovered

**Rationale**: Anonymous data is ephemeral by design.

---

### Scenario 4: User Deletes Account (After Signup)

**Action**: User goes to account settings → "Delete Account"

**Data Handling**:
- ✅ Account data deleted (email, profile)
- ✅ Conversation data deleted
- ✅ Personalization data deleted
- ✅ Session tokens invalidated
- ⚠️ Analytics data remains (anonymized, cannot be linked)

**Timeline**: Immediate (30-day grace period optional)

---

## GDPR Compliance

**Regulation**: EU General Data Protection Regulation

**Requirements**:

### 1. Right to Access (Article 15)

**User must be able to**:
- View all data stored about them
- Download data in structured format (JSON/CSV)

**Implementation** (design):
- Account settings → "Download My Data"
- Includes: Account info, conversations, preferences

---

### 2. Right to Erasure (Article 17)

**User must be able to**:
- Delete account + all associated data
- Request immediate deletion (no "wait 30 days")

**Implementation** (design):
- Account settings → "Delete Account"
- Confirmation modal + password re-entry
- Immediate deletion (or 30-day grace period with opt-out)

---

### 3. Right to Data Portability (Article 20)

**User must be able to**:
- Export data in machine-readable format
- Transfer data to another service

**Implementation** (design):
- Account settings → "Export Data"
- Formats: JSON (machine-readable) + PDF (human-readable)

---

### 4. Right to Object (Article 21)

**User must be able to**:
- Opt-out of analytics tracking
- Stop personalization features

**Implementation** (design):
- Account settings → "Privacy Settings"
- Toggle: "Allow analytics" (default: ON, can disable)
- Toggle: "Personalized responses" (default: ON, can disable)

---

### 5. Consent Requirement (Article 7)

**User must give explicit consent for**:
- Data storage (migration from anonymous to account)
- Analytics tracking
- Third-party integrations (future)

**Implementation** (design):
- Signup modal: "I agree to store my data" (checkbox)
- Settings: "Privacy Policy" link
- Settings: "Cookie Policy" link

---

## CCPA Compliance

**Regulation**: California Consumer Privacy Act

**Requirements**:

### 1. Right to Know

**User must be able to**:
- Know what data is collected
- Know how data is used

**Implementation** (design):
- Privacy Policy page
- Data usage explanation in signup modal

---

### 2. Right to Delete

**User must be able to**:
- Request deletion of personal data

**Implementation** (design):
- Same as GDPR Right to Erasure

---

### 3. Right to Opt-Out of Sale

**User must be able to**:
- Opt-out of data selling

**Implementation** (design):
- Privacy Settings: "Do Not Sell My Data" toggle
- **Note**: We don't sell data, but must provide opt-out

---

## FERPA Compliance

**Regulation**: Family Educational Rights and Privacy Act

**Requirements** (if used in education):

### 1. Student Data Protection

**Requirement**: Student educational records must be protected

**Implementation** (design):
- Conversation data = educational record
- Access restricted to student + authorized educators
- No third-party sharing without consent

---

### 2. Parental Consent (<13 years)

**Requirement**: Parental consent required for students under 13

**Implementation** (design):
- Age gate on signup: "Are you 13 or older?"
- If NO → "Ask your parent/guardian to sign up for you"
- Separate "Parent Account" flow (future)

---

### 3. Right to Inspect Records

**Requirement**: Students/parents can view educational records

**Implementation** (design):
- Same as GDPR Right to Access
- Account settings → "View My Data"

---

## Data Ownership Summary Table

| Data Type | Storage | Duration | Ownership | Can Migrate | Can Delete |
|-----------|---------|----------|-----------|-------------|------------|
| Session Data (anonymous) | Memory | Until tab close | User | ✅ Yes | ✅ Auto |
| Analytics (anonymous) | Backend | 90 days | Platform | ❌ No | ❌ No |
| Account Data | Backend | Until deleted | User | N/A | ✅ Yes |
| Conversation Data | Backend | Until deleted | User | ✅ Yes | ✅ Yes |
| Personalization Data | Backend | Until deleted | User | ❌ No | ✅ Yes |

---

## Transparency Requirements

**User must be informed about**:
1. What data is collected (before signup)
2. How data is used (Privacy Policy)
3. Who has access (only user + platform admins)
4. How long data is stored (duration policy)
5. How to delete data (account settings)

**Implementation** (design):
- Link: "Privacy Policy" in footer
- Link: "Data Policy" in signup modal
- Setting: "View My Data" in account settings

---

## Next Steps

- T030: Consent timing rules (when to ask for permissions)
- T031: Abuse prevention rules (rate limiting, spam detection)
- T032: Phase 5 lock document

---

**Last Updated**: 2025-12-27
**Status**: ✅ Design Complete (No Implementation)
