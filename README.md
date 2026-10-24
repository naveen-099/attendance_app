# Attendance App

Expo / React Native client for the Office Attendance Management API.

## Features completed

- Admin and employee login
- JWT session persistence
- First-login password change
- Admin dashboard shell
- Employee creation
- Searchable employee directory
- Employee detail view
- Employee edit
- Admin password reset request
- Responsive web and native Expo routing
- Cross-platform session storage:
  - Android/iOS: `expo-secure-store`
  - Web: browser localStorage for development

## Prerequisites

- Git
- Node.js 22.13 or newer
- npm 11 or newer
- Attendance backend running on port `8080`
- Android Studio / emulator or Expo Go for native testing
- macOS: Xcode required only for iOS builds

## macOS installation

```bash
brew install git node postgresql@18
brew services start postgresql@18
node --version
npm --version
```

Clone and install:

```bash
git clone <ui-repo-url>
cd attendance_app
npm install
```

Create a local API configuration:

```bash
cat > .env.local <<'EOF'
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EOF
```

Start the backend first, then run:

```bash
npm run web -- --port 8081
```

Open `http://localhost:8081`.

For iOS Simulator:

```bash
npm run ios
```

For Android Emulator:

```bash
npm run android
```

## Windows installation

Install Git and Node.js:

```powershell
winget install --id Git.Git --exact
winget install --id OpenJS.NodeJS.LTS --exact
```

Open a new terminal so `git`, `node`, and `npm` are available.

```powershell
git clone <ui-repo-url>
cd attendance_app
npm install
```

Create a local API configuration:

```powershell
@'
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
'@ | Set-Content .env.local
```

Start the backend first, then run:

```powershell
npm run web -- --port 8081
```

Open `http://localhost:8081`.

For Android:

```powershell
npm run android
```

If npm is not recognized after installing Node.js, open a new terminal and verify:

```powershell
node --version
npm --version
```

### Physical Android device

Android devices cannot use `localhost` for the PC running the backend. Set `.env.local` to the PC LAN IP, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8080
```

Restart Expo after changing environment variables.

## Admin employee administration flow

### 1. Login

Use the seeded account:

- Employee ID: `ADMIN-001`
- Password: `Admin@123`

The default password is changed after a successful first-login password change. Use the current admin password for later tests.

The app sends:

```json
{
  "employee_id": "ADMIN-001",
  "password": "<current-admin-password>"
}
```

A successful response stores the JWT and routes the admin to `/dashboard`.

### 2. Open employee administration

Use the **Employees** tab.

The app loads:

```text
GET /api/v1/admin/employees?page=1&page_size=100&search=<term>
```

The directory supports search by employee ID, name, email, or phone, active/password-pending status, detail navigation, refresh, and loading/empty/error states.

### 3. View employee details

Select an employee in the directory. The app loads:

```text
GET /api/v1/admin/employees/{employeeId}
```

Displayed details include employee ID, name, email, phone, department, designation, account state, and password-change timestamp.

### 4. Edit employee details

Edit the fields on the detail page and select **Save changes**.

```text
PUT /api/v1/admin/employees/EMP-001
```

```json
{
  "full_name": "Ananya Sharma",
  "email": "ananya.sharma@example.com",
  "phone": "+919876543210",
  "department": "Engineering",
  "designation": "Senior Developer"
}
```

Rules:

- Employee ID is immutable.
- Name, email, and phone are required.
- Email must be valid.
- Duplicate email or phone is rejected.
- List and detail data refresh after a successful update.

### 5. Request password reset

Select **Reset password** and confirm the action.

```text
POST /api/v1/admin/employees/EMP-001/password-reset
```

The backend returns a temporary password once:

```json
{
  "success": true,
  "data": {
    "employee_id": "EMP-001",
    "temporary_password": "Ab1@Cde2Xyz9",
    "require_password_change": true,
    "message": "Temporary password generated. The employee must change it on next login."
  }
}
```

The UI displays the password in a one-time result panel. Share it through a secure channel and do not persist it.

### 6. Employee first-login password change

The employee signs in with the temporary password and is redirected to **Change password**.

Password rules:

- at least 7 characters
- 1 uppercase letter
- 1 number
- 1 special character

```text
POST /api/v1/auth/change-password
```

```json
{
  "employee_id": "EMP-001",
  "old_password": "Ab1@Cde2Xyz9",
  "new_password": "NewPass1!",
  "confirm_password": "NewPass1!"
}
```

## Example backend curl workflow

Login and save the admin token on macOS/Linux:

```bash
export BASE_URL="http://localhost:8080"
export TOKEN="$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ADMIN-001","password":"<current-admin-password>"}' | \
  python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])')"
```

List employees:

```bash
curl -X GET "$BASE_URL/api/v1/admin/employees?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

Get details:

```bash
curl -X GET "$BASE_URL/api/v1/admin/employees/EMP-001" \
  -H "Authorization: Bearer $TOKEN"
```

Edit:

```bash
curl -X PUT "$BASE_URL/api/v1/admin/employees/EMP-001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Ananya Sharma","email":"ananya.sharma@example.com","phone":"+919876543210","department":"Engineering","designation":"Senior Developer"}'
```

Reset password:

```bash
curl -X POST "$BASE_URL/api/v1/admin/employees/EMP-001/password-reset" \
  -H "Authorization: Bearer $TOKEN"
```

## Validation commands

```bash
npx expo install --check
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

The project may report missing ESLint configuration until the repository adds one. Local development can still be validated with TypeScript and a web bundle.

## Implementation status

| Area | Status |
|---|---|
| Login and session persistence | Complete |
| First-login password change | Complete |
| Admin dashboard shell | Complete |
| Create employee | Complete |
| Employee directory/search | Complete |
| Employee detail | Complete |
| Employee edit | Complete |
| Password reset request | Complete |
| Web session adapter | Complete |
| Attendance dashboard | Pending |
| Employee check-in/out | Pending |
| Admin attendance metrics | Pending |
| Employee attendance history | Pending |
| Admin reports | Pending |

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed flow ownership and pending work.

## Troubleshooting

### The app cannot reach the backend

- Confirm the backend is listening on port `8080`.
- Confirm `EXPO_PUBLIC_API_BASE_URL` points to the backend host.
- For Android devices or emulators, use the PC LAN IP instead of `localhost`.
- Confirm the backend CORS middleware allows the Expo origin.

### Employee rows do not load

- Confirm the admin session contains a valid JWT.
- Check browser console responses for `401` or `403`.
- Confirm the backend migration and database contain employee records.

### Expo says a package is incompatible

```bash
npx expo install --check
npx expo install --fix
```

## Project structure

```text
src/app/                 Expo Router routes
src/app/(admin)/         Admin-protected screens
src/context/             Authentication session state
src/services/            API and storage adapters
src/constants/           Theme and layout constants
src/components/          Shared UI components
```
