<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" width="80" alt="Notion-style Logo" />
  <h1>HabitOS 📝</h1>
  <p>A beautiful, Notion-inspired Habit & Goal Tracker built with React and Supabase.</p>

  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
</div>

---

## ✨ Features

HabitOS was designed from the ground up to mimic the clean, highly-functional aesthetic of **Notion**. 

### 📅 Daily Check-in
* **Smooth Interactions:** Tick off habits with satisfying bounce animations.
* **Progress Rings:** An SVG circular progress ring automatically calculates your daily completion percentage.
* **Streak Tracking:** Flame badges (🔥) automatically calculate your current active streak based on historical logs.

### 📋 Habit Library
* **Full CRUD Management:** Easily add, edit, or delete habits in a clean modal.
* **Categorization:** Color-coded tags (Health, Fitness, Productivity, etc.) to keep your routines organized.
* **Auto-stats:** The table automatically calculates your total days completed and current active streak for every habit.

### 📊 Progress Dashboard
* **Data Visualization:** A beautiful monthly area chart tracks your day-over-day completion rates.
* **Activity Heatmap:** A GitHub-style 90-day heatmap block shows your consistency at a glance.
* **Summary Cards:** Quick stats showing Today's %, Total Completions, and Best Active Streak.

### 🏆 Long-Term Goals
* **Goal Cards:** Track overarching milestones (e.g., "Read 12 Books", "Save $5000").
* **Custom Colors:** Assign custom hex colors to goal progress rings.
* **Inline Controls:** Quickly increment or decrement progress with `+ / -` buttons directly on the cards.

### 📱 Fully Responsive
* **Desktop:** Spacious layout with a persistent Notion-style left sidebar.
* **Mobile:** The sidebar gracefully collapses into a bottom emoji-tab navigation bar for true app-like usability on phones.

---

## 🛠️ Technology Stack

* **Frontend Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Styling:** Custom Vanilla CSS Design System (Utilizing CSS Variables for a centralized Notion theme)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)
* **Date Utilities:** [date-fns](https://date-fns.org/)
* **Hosting:** [Vercel](https://vercel.com/) 

---

## 🚀 Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Prince000101/habit_tracking.git
   cd habit_tracking
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   * Create a new project on [Supabase](https://supabase.com/).
   * Run the SQL statements found in `schema.sql` (if provided, or create `habits`, `habit_logs`, and `goals` tables) in your Supabase SQL Editor.
   * Add the following columns if missing:
     ```sql
     ALTER TABLE habits ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
     ALTER TABLE goals  ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
     ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 💡 Future Ideas / Roadmap

To take HabitOS to the next level, here are features planned for the future:

* **User Authentication:** Allow multiple users to register and keep private habit boards using Supabase Auth.
* **Habit Frequency:** Track weekly or specific-day habits (e.g., "Gym on Mon/Wed/Fri") rather than just daily.
* **PWA Support:** Add a Web Manifest and Service Worker so users can install HabitOS to their iOS/Android home screens as a native-feeling app.
* **Dark/Light Mode Toggle:** Currently defaults to a beautiful dark mode; add a light mode variant using CSS variables.
* **Rich Text Notes:** Allow Notion-style rich text inside habit/goal notes.
