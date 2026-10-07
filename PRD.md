# Product Requirements Document (PRD)
## Kongo-do AI Listing & Assetization Platform

### 1. Project Overview
This project is a custom web application designed to streamline the process of listing items on Yahoo Auctions (ヤフオク) while simultaneously building a proprietary product database ("Kongo-do DB"). Unlike standard listing automation tools, the primary goal is **Data Assetization**. Every listed item's images, generated descriptions, and final sales data will be archived to train future AI appraisal models.

### 2. Target Users & Scale
- **Primary User:** Internal operations team (Personal Yahoo Account).
- **Current Volume:** 20 to 40 items per day (expected to grow).
- **Product Categories:** Books, Games, Toys, Adult Books, Adult DVDs.

### 3. Recommended Technology Stack
To ensure a premium, fast, and scalable application, we will use the following modern stack:
- **Framework:** **Next.js (App Router)** - Provides both the Frontend UI and Backend API routes in one unified codebase.
- **Styling:** **Vanilla CSS** - To create a highly customized, premium, and dynamic UI with glassmorphism and micro-animations (as per design guidelines), avoiding generic template looks.
- **Database:** **Supabase (PostgreSQL)** - An open-source Firebase alternative. Perfect for storing product text data securely and handling image storage (Buckets) affordably.
- **AI Engine:** **OpenAI GPT-4o or Google Gemini 1.5 Pro** - Industry-leading multimodal models for OCR (Optical Character Recognition) and text generation.

### 4. Core Workflows & Rules (Phase 1 MVP)
#### 4.1. The Listing Pipeline
1. **Upload:** User uploads product image(s).
2. **AI Analysis:** AI scans the image for text (Title, Maker, Series, Actress, etc.).
3. **Generation:** AI drafts a listing title and selects categories/keywords.
4. **Human Review:** User reviews the draft in a premium dashboard.
5. **Boilerplate Injection:** User selects category-specific templates (e.g., "Used Book Warning") and toggles AI-generated descriptions ON or OFF.
6. **Save & Export:** Data is saved to Kongo-do DB and prepared for Yahoo Auctions batch listing.

#### 4.2. Strict Business Rules (CRITICAL)
- **Management Number Lock:** Every item has an inventory number (e.g., `60925a`). This number **MUST** remain fixed at the very beginning of the listing title. If the user asks the AI to "regenerate title," the AI must not alter or remove this prefix.
- **Adult Content Handling:** To prevent API bans from AI providers (due to NSFW image filters), the AI will strictly operate in **OCR Mode** for adult categories. It will read the *text* on the covers (titles, names) rather than analyzing the imagery itself.

### 5. Future Roadmap
- **Phase 2 (Sales Tracking):** Integrate with Yahoo Auctions to pull final winning bid prices and dates, linking them back to the original item in the Kongo-do DB. Create a WordPress export feature for "Past Sales Portfolios."
- **Phase 3 (AI Appraisal):** Develop an interface where staff can input a new item, and the system references the Kongo-do DB and external market data to suggest a "Buying Assessment Price" based on past performance.

### 6. Design & UX Guidelines
The dashboard will not look like a premium internal tool. It will feature:
- A sleek, dark-mode preferred interface.
- Smooth transitions when AI is "thinking."
- Clear, side-by-side comparisons of "AI Draft" vs "Final Output."
- Highly responsive interactions to make batch processing 40 items/day feel effortless.
