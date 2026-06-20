# SplitDay

SplitDay is a modern, intuitive web application for managing shared expenses on trips and outings. Say goodbye to complicated spreadsheets and awkward IOUs. With SplitDay, you can effortlessly track who paid for what and automatically calculate the simplest way to settle up.

## Key Features

- **Create Trips & Invite Friends:** Easily create a new trip and invite participants using a unique invite code.
- **Smart Expense Logging:** Support for equal splits, custom percentages, or exact amounts.
- **Auto-Calculated Settlements:** The "Who Owes Who" engine mathematically minimizes the number of transactions needed to settle debts.
- **1-Click Settle Up:** Automatically log a settlement payment to zero out a balance with a single click.
- **Export to CSV:** Download your entire expense history into a spreadsheet.
- **Expense Categories:** Categorize your spending (Food, Transport, Accommodation, etc.) for better tracking.
- **Real-Time Chat & Comments:** Discuss expenses or just chat within the trip dashboard.
- **Customizable Themes:** Switch between Default (Violet), Ocean (Blue), and Forest (Green) themes.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** MongoDB (via Mongoose)
- **Styling:** Tailwind CSS (with custom theming via CSS variables)
- **Icons:** Heroicons

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Set your `MONGODB_URI` in `.env.local`
4. Run `npm run dev` to start the development server
5. Open [http://localhost:3000](http://localhost:3000) with your browser.
