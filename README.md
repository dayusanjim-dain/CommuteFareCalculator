# Commute Fare Calculator

## Short Description

Commute Fare Calculator is a web-based application that allows users to calculate transportation fares, manage transactions, generate receipts, and monitor transportation expenses. It also provides Google account authentication and Supabase cloud storage to keep user data saved and accessible.

## Features

- **Fare Calculator** – Calculates fares based on transportation type, passengers, additional charges, and discounts.
- **One-Way and Round-Trip** – Supports different trip types.
- **Discount Calculation** – Supports student, senior citizen, and PWD discounts.
- **Transaction Management** – Allows users to save, view, edit, delete, search, and filter transactions.
- **Receipt Generation** – Creates receipts that users can preview, print, or save as PDF.
- **Dashboard** – Displays daily, weekly, and monthly fare summaries.
- **Reports and Analytics** – Shows transportation expenses, trip statistics, and charts.
- **Google Login** – Allows users to sign in using their Google accounts.
- **Cloud Storage** – Uses Supabase to save and synchronize user transactions and settings.
- **Customizable Settings** – Allows users to change fare rates, discounts, currency, application name, and theme.
- **Data Backup and Restore** – Supports JSON backups and CSV exports.

## How to Install and Run

### 1. Download the Project
- Visit the project repository on GitHub.
- Click the green **Code** button.
- Select **Download ZIP**.
- Extract the downloaded ZIP file.

### 2. Configure Supabase
- Create a Supabase project.
- Set up the `faretrack_data` database table.
- Enable Row Level Security (RLS).
- Configure the required database policies.
- Enable Google authentication in Supabase.

### 3. Configure JavaScript
- Open `script.js`.
- Enter your Supabase Project URL and Publishable Key.
- Save your changes.

### 4. Run the Application
- Open the project folder.
- Open `index.html` using a local development server, such as VS Code Live Server.
- The application will open in your web browser.
- Sign in using your Google account to access cloud storage features.

## How to Use the Application

### 1. Sign In
- Open Commute Fare Calculator.
- Click the Google sign-in button.
- Select your Google account.
- Once authenticated, you can access the application's features.

### 2. Dashboard
- View your daily, weekly, and monthly fare expenses.
- Check the number of recorded trips.
- Review your recent transactions.

### 3. Calculate a Fare
- Navigate to the **Fare Calculator** page.
- Enter the commuter's name (optional).
- Select the transportation type.
- Enter the origin and destination.
- Add any additional stops if necessary.
- Enter the base fare and additional fare.
- Set the number of passengers.
- Select the applicable discount, if any.
- Choose between one-way and round-trip.
- Select the travel date.
- Review the calculated total fare and fare per passenger.
- Click **Save Transaction**.

### 4. Manage Transactions
- Open the **Transactions** page.
- View your saved fare records.
- Use the search bar to find specific transactions.
- Filter transactions by date or transportation type.
- Click **Edit** to modify an existing transaction.
- Click **Delete** to remove a transaction.

### 5. View and Print Receipts
- Navigate to the **Receipts** page.
- Select a saved transaction.
- Click **Preview** to view its receipt.
- Use **Print / Save as PDF** to print or save a copy.

### 6. Reports and Analytics
- Open **Reports & Analytics**.
- Select a date range to filter your records.
- View total expenses, number of trips, and average fare.
- Review the transportation statistics and charts.
- Export your report as a CSV file if needed.

### 7. Customize Settings
- Navigate to the **Settings** page.
- Change the application name and currency symbol.
- Adjust transportation fare rates.
- Modify student, senior citizen, and PWD discount percentages.
- Select light or dark mode.
- Save your preferences.

### 8. Backup and Restore Data
- Open the **Settings** page.
- Use the backup option to download your transactions and settings as a JSON file.
- To restore data, select a previously downloaded backup file.
- Confirm the restoration to replace the current records and settings.

### 9. Sign Out
- Click the account button to sign out of your Google account.
- Sign in again whenever you want to access your saved cloud data.

## Online Access

The application is hosted using GitHub Pages.

**Live Website:**  
https://dayusanjim-dain.github.io/CommuteFareCalculator/

## Developer Information

**Name:** Jim G. Dayusan

**Section:** BSINTE-2A

**Project Title:** Commute Fare Calculator
