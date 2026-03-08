# IELTS Speaking Assessor

A high-fidelity, AI-powered platform designed to provide instant, detailed feedback on IELTS speaking performance. Built with a **Heritage-Luxe** aesthetic and powered by the **Google Gemini API**, this application offers a professional studio environment for candidates to practice Parts 1, 2, and 3 of the IELTS speaking exam.

---

### 🏛️ The Experience

The product is designed around a **Unified Practice Studio** philosophy. By combining top-tier AI assessment with a minimal, high-contrast interface, users can focus entirely on their articulation and fluency without visual distraction.

- **Practice Studio**: A wide-format workspace (`7xl`) dedicated to simulated IELTS interviews.
- **Multimodal Feedback**: Receive instant band scores, full transcripts, and specific criteria breakdown (Fluency, Lexical Resource, Grammatical Range, and Pronunciation).
- **Independent State Management**: Practice Parts 1, 2, and 3 simultaneously; each part maintains its own recording, questions, and feedback in a persistent session state.
- **Practice History**: A comprehensive archive of all previous attempts, featuring detailed performance modals to track growth over time.

---

### 🎨 Design Philosophy: "Heritage-Luxe"

The interface utilizes a custom-engineered color palette that blends academic tradition with modern tech sophistication:
- **Luxe Espresso (#121212)**: Used for high-contrast actions and primary typography.
- **Electric Cobalt (#2D5BFF)**: Subtle accents and backlit shadows for interactive elements.
- **Heritage Forest & Sage**: Calming, grounded tones for success metrics and navigational states.
- **Pristine Workspace**: A clean white background keeps the focus on the content and feedback.

---

### 🚀 Tech Stack

- **Frontend**: React 19 + Vite 6 + TypeScript (Advanced Type Safety)
- **Styling**: Tailwind CSS v4 (Using the latest `@theme` engine)
- **Authentication**: Supabase Auth (Google OAuth Integration)
- **Database**: Supabase PostgreSQL (JSONB for complex feedback storage)
- **AI Engine**: Google Gemini API via `@google/genai`
- **Animations**: Motion (Framer Motion) for fluid, elegant transitions.

---

### ⚙️ Local Development

**Prerequisites:** Node.js (v20+), `pnpm`

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup:**
   Apply the provided `database.sql` to your Supabase project to initialize the `assessments` table and RLS policies.

4. **Run the Development Server:**
   ```bash
   pnpm run dev
   ```

---

### 🌐 Deployment

This application is optimized for **Vercel**. 

- **Routing**: Client-side routing is handled via `vercel.json` to ensure SPA persistence.
- **Supabase Configuration**: Ensure your production URL is whitelisted in the Supabase Authentication Dashboard under *URL Configuration*.

---

<div align="center">
  <p>Built for excellence in IELTS preparation.</p>
</div>
