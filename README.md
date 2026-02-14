# Quick Start Guide - EduSense

## For Team Members Who Just Want It Running

### 1. Prerequisites Check
```bash
# Check Python version (need 3.8+)
python --version

# Check Node version (need 18+)
node --version

# Check PostgreSQL (should return version)
psql --version
```

### 2. Database Setup (5 minutes)
```bash
# Start PostgreSQL (if not running)
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Services → PostgreSQL → Start

# Create database
psql -U postgres
# Enter password when prompted
# Then run:
CREATE DATABASE edusense_db;
\c edusense_db
# Paste all SQL from setup.sql file
\q
```

### 3. Backend Setup (3 minutes)
```bash
# Create folder and copy files
mkdir edusense-backend
cd edusense-backend
# Copy: main.py, .env, requirements.txt to this folder

# Edit .env - add your postgres password
# DB_PASSWORD=your_password_here

# Install dependencies
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run backend
python main.py
# Keep this terminal open!
```

### 4. Frontend Setup (3 minutes)
```bash
# Open NEW terminal
npx create-next-app@latest edusense-frontend
# Choose: TypeScript=Yes, Tailwind=Yes, App Router=Yes

cd edusense-frontend
# Replace app/page.tsx with provided page.tsx file

# Run frontend
npm run dev
```

### 5. Open Browser
Go to: http://localhost:3000

You should see 8 students listed!

---

## Common Issues

**"Can't connect to database"**
→ Check PostgreSQL is running and .env password is correct

**"CORS error in browser"**
→ Make sure backend is running on port 8000

**"Module not found"**
→ Run `pip install -r requirements.txt` again

---

## Daily Development Workflow

### Starting Work
```bash
# Terminal 1 - Backend
cd edusense-backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py

# Terminal 2 - Frontend
cd edusense-frontend
npm run dev
```

### Stopping
- Press Ctrl+C in both terminals
- PostgreSQL can stay running

---

## File Locations

**Backend:**
- `edusense-backend/main.py` - All API code
- `edusense-backend/.env` - Database password

**Frontend:**
- `edusense-frontend/app/page.tsx` - Main page

**Database:**
- Database name: `edusense_db`
- Table: `students`

---

## Testing the API

**Browser:**
- Health: http://localhost:8000
- Students: http://localhost:8000/api/students

**Command line:**
```bash
curl http://localhost:8000/api/students
```

---

## Need Help?
1. Check SETUP_INSTRUCTIONS.md for detailed guide
2. Look at troubleshooting section
3. Check if PostgreSQL/backend/frontend are all running
