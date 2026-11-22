# SkillHub Backend API

**DecodeLabs Full Stack Development - Project 2**

A beginner-friendly backend REST API built with **Node.js** (native `http` module, **no external dependencies**). This continues the SkillHub online learning concept from Project 1.

## Requirements
- Node.js 18 or newer

## Start
```bash
npm start
```
Open http://localhost:3000 in a browser. Keep the terminal running.

## Run automated tests
```bash
npm test
```

## API endpoints

| Method | Endpoint | Description | Success code |
|---|---|---|---|
| GET | `/` | API landing message | 200 |
| GET | `/api/health` | Server health | 200 |
| GET | `/api/courses` | List available courses | 200 |
| GET | `/api/enrollments` | List demo enrollments | 200 |
| POST | `/api/enrollments` | Create an enrollment | 201 |

### Example POST request

PowerShell:
```powershell
$body = @{ studentName = "Test Student"; courseId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments" -Method Post -ContentType "application/json" -Body $body
```

JSON body:
```json
{"studentName":"Test Student","courseId":1}
```

### Validation and error handling
- `studentName` must be a string containing 2–60 characters.
- `courseId` must be an integer corresponding to course ID 1, 2 or 3.
- Requests must contain valid JSON (`Content-Type: application/json`).
- 400 = Invalid input / malformed JSON; 404 = Unknown endpoint; 409 = Duplicate enrollment; 413 = Oversized body; 415 = Incorrect Content-Type.

## Evidence for submission
1. VS Code showing the source code.
2. Browser displaying `http://localhost:3000/api/courses`.
3. Terminal with successful POST response and `npm test` results.
4. GitHub repository link.

**Note:** Demo enrollments are stored **only in memory** and disappear when the server restarts. This project does not implement a database, authentication or production-grade security. CORS is open for local testing; restrict it before public deployment. Avoid storing real personal data.
