# Quick Start Guide - EduSense

## For Team Members Who Just Want It Running

### 1. Prerequisites Check
```bash
# Check Python version (need 3.8+)
python --version

# Check Node version (need 18+)
node --version

### 2. Backend Setup (3 minutes)
```bash
# Create folder and copy files
mkdir backend
cd backend
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

cd frontend
# Replace app/page.tsx with provided page.tsx file

# Run frontend
npm run dev
```

### 5. Open Browser
Go to: http://localhost:3000

You should see 8 students listed!

---

## Common Issues

**"CORS error in browser"**
→ Make sure backend is running on port 8000

**"Module not found"**
→ Run `pip install -r requirements.txt` again

---

## Daily Development Workflow

### Starting Work
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stopping
- Press Ctrl+C in both terminals

## File Locations

**Backend:**
- `backend/main.py` - All API code
- `backend/.env` - Database password

**Frontend:**
- `frontend/app/page.tsx` - Main page

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



