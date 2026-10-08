# DutyFixIT 2.0 - The Workbench Aesthetic

DutyFixIT is an Indian home-services marketplace built on the MERN stack (MongoDB, Express, React 18 + Vite, Node.js). It connects households with trusted professionals for plumbing, electrical, cleaning, painting, carpentry, and other essential services.

## The Architecture & Design System

In Version 2.0, DutyFixIT has been entirely refactored to use **The Workbench** design system.

### Key Features
- **Lead-Unlock Model**: Professionals pay a fixed ₹100 fee via Razorpay to unlock client contact details.
- **Admin Dashboard**: Comprehensive dashboard for managing bookings, worker verification, customers, and reviews.
- **Vanilla CSS Architecture**: Built entirely from scratch using native CSS features (CSS Variables, `@layer` cascade management). **No Tailwind, no Bootstrap.**

### The CSS Architecture
Styles are located in `client/src/styles/` and follow a strict, scalable pattern using native CSS `@layer` rules:
- `tokens.css`: Core design variables (colors, spacing, typography, easing).
- `reset.css`: Modern CSS reset.
- `base.css`: Base element styling (body, h1-h6, p).
- `layout.css`: Layout containers (`.l-container`, `.l-stack`).
- `components/`: Modular component files (e.g. `button.css`, `form.css`, `nav.css`, `ticket.css`).
- `pages/`: Page-specific scoped styles (e.g. `auth.css`, `client.css`).
- `utilities.css`: Single-purpose utility classes (`.u-text-center`, `.u-mb-4`).

### Visual Motif
- **Colors**: Deep teal (`--teal-900`), warm paper (`--paper`), striking turmeric yellow (`--turmeric-500`).
- **Typography**: Bricolage Grotesque (display), Instrument Sans (body), IBM Plex Mono (IDs).
- **Motifs**: Blueprint grids, ruler ticks, rubber stamps, work-order tickets.

## Tech Stack
- **Frontend**: React 18, Vite, React Router v6
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Payments**: Razorpay API
- **Styling**: Hand-crafted modular Vanilla CSS

## Setup & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Razorpay Test Credentials

### Installation

1. **Clone and Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Backend Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Terminal 1 (Backend)**
```bash
cd server
npm start
```

**Terminal 2 (Frontend)**
```bash
cd client
npm run dev
```

## Application Flow

1. **Client**: Can browse services, view verified professionals in their city, and request a booking.
2. **Professional**: Has a dashboard showing incoming pending requests. They cannot see the client's contact info until they pay a ₹100 lead-unlock fee via Razorpay.
3. **Admin**: Can log in to view KPIs, manage bookings, and approve or reject worker verifications.

---
*Built with React and custom CSS engineering.*
