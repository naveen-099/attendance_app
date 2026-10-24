# UI Implementation Status

## Feature flow status

| Flow | Status | Notes |
|---|---|---|
| Expo Router setup | Complete | Role-based app layouts exist |
| Login | Complete | Calls `POST /api/v1/auth/login` |
| Session persistence | Complete | Native SecureStore, web localStorage adapter |
| First-login password change | Complete | Password policy validation on the client |
| Admin dashboard shell | Complete | Placeholder for future attendance metrics |
| Create employee | Complete | Form, validation, credential response |
| Employee list | Pending | Replace the placeholder with live paginated/searchable data |
| Employee details | Pending | Add a detail route with profile and account state |
| Edit employee | Pending | Reuse validated form fields and call update endpoint |
| Password reset request | Pending | Confirmation flow and one-time temporary password display |
| Attendance dashboard | Pending | Deferred until attendance APIs exist |
| Employee check-in/out | Pending | Backend endpoints do not exist yet |
| Employee directory search | Pending | Backend list endpoint required |
| Account profile refresh | Pending | UI expects `GET /api/v1/auth/me` |

## Completed admin employee flow

1. Admin signs in with employee ID and password.
2. Admin opens the Employees section.
3. Admin submits employee details.
4. UI displays the generated employee ID and temporary password.
5. UI informs the admin that the password must be shared securely.

## Pending employee administration flow

### Employee list and details

- Replace the directory placeholder with a searchable employee list.
- Show employee ID, name, email, phone, department, designation, and account state.
- Add an employee detail route keyed by `employee_id`.
- Show loading, empty, error, and retry states.

### Edit employee details

- Open editable fields from employee details.
- Prevent changing `employee_id`.
- Validate email, phone, full name, department, and designation.
- Call the backend update endpoint and refresh the list/detail state.
- Show duplicate email or phone API errors inline.

### Password reset request

- Add an explicit `Reset password` action in employee details.
- Require confirmation before generating the temporary password.
- Call the backend admin reset endpoint.
- Display the generated temporary password once in a secure result panel.
- Mark the account as requiring first-login password change in the UI.

## UX rules

- Employee ID is read-only.
- Password resets require an explicit confirmation.
- Temporary passwords must not be written to ordinary logs or displayed in a URL.
- API errors must use the existing `ApiError` shape.
- Native sessions use encrypted storage; web development uses local browser storage.
- Loading actions must prevent duplicate submissions.
- Every mutation should return to a refreshed current view.

## Deferred work

Attendance dashboard metrics, employee attendance history, reports, account deactivation, bulk operations, and audit log browsing remain outside the current implementation slice.
