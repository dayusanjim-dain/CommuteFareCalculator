# FareTrack – User Guide

FareTrack is a commuter fare calculator and expense tracker. Use it to calculate one-way or round-trip fares, save trip records, review receipts, and summarize transportation expenses.

## 1. Create an account and sign in

1. Open the FareTrack website.
2. On the account screen, choose **Create a new account**.
3. Enter your email address and a password of at least six characters.
4. Submit the form. If email confirmation is enabled in Supabase, open the confirmation email and follow its link.
5. Return to FareTrack and sign in using the same email and password.
6. Use **Forgot password?** if you need a password reset link. Enter your email address first.
7. To sign out, use the account button in the top-right area.

## 2. Dashboard

The Dashboard is the home page. It shows:

- Today's recorded fare expenses and trip count.
- This week's expenses (Monday through today).
- This month's expenses.
- A short list of recent transactions.

Choose **Calculate a fare** or the Fare Calculator menu item to record a trip.

## 3. Calculate and save a fare

1. Open **Fare Calculator**.
2. Enter the commuter's name (optional). If left blank, the record is saved as **Guest**.
3. Select the date of travel.
4. Select the transportation type: Jeepney, Bus, UV Express, Tricycle, Train, or Other.
5. Enter the number of passengers.
6. Enter the starting point and destination.
7. Enter the base fare per passenger. Add an additional fare per passenger if needed.
8. Choose a discount category: Regular, Student, Senior Citizen, or PWD.
9. Choose **One-Way** or **Round-Trip (Back and Forth)**.
10. Optionally enter additional destinations, separated by commas.
11. Review the Fare Summary, then choose **Save transaction**.

The calculator uses:

- One-way fare per passenger = (base fare + additional fare) × (1 − discount rate).
- Round-trip fare per passenger = (base fare + additional fare) × 2 × (1 − discount rate).
- Total fare = fare per passenger × number of passengers.

The discount percentages and default transportation rates can be changed in **Settings**. Confirm the official fares and applicable discount rules before relying on the result. FareTrack is a record-keeping calculator; it does not verify live transport fares or eligibility.

To change an existing trip, open **Transactions**, choose **Edit**, update the fields in the calculator, and save. To remove a trip, choose **Delete** and confirm if prompted.

## 4. Transactions

Open **Transactions** to view saved trip records. You can:

- Search by commuter name, route, or transport type.
- Filter by travel date or transportation type.
- Choose **Reset** to clear filters.
- Choose **Edit** to update a saved record.
- Choose **Delete** to remove a record.
- Choose **Export CSV** to download the displayed transaction data for use in a spreadsheet.

## 5. Receipts

1. Open **Receipts**.
2. Select a saved transaction from the list.
3. Review the receipt preview.
4. Choose **Print / Save as PDF**. In the print dialog, select a printer or a PDF destination if available on your device.

## 6. Reports and analytics

1. Open **Reports**.
2. Set the **From** and **To** dates.
3. Choose **Apply range**.
4. Review total expenses, total trips, average fare, most-used transport, and the charts and daily breakdown.
5. Choose **Print / Save PDF** for a printable report or **Export CSV** to download report data.

## 7. Settings

Open **Settings** to customize:

- **Application name** and **Currency symbol**.
- **Appearance:** Light mode or Dark mode. You can also use the theme toggle in the top bar.
- **Transportation fare matrix:** default base fare for each transport type. These values are used to prefill the calculator when a transport type is selected; check and adjust them as needed.
- **Discount settings:** Student, Senior Citizen, and PWD percentages.

Choose the relevant **Save** button after making changes.

### Back up and restore data

- Choose **Download backup** to save a JSON file containing your transactions and settings. Keep this file somewhere safe.
- Choose **Restore backup**, select a FareTrack JSON backup, and confirm. Restoring replaces the current records and settings on the active account/device.
- **Delete all transactions** removes all trip records. Use this carefully; download a backup first if you may need the records later.

## 8. Install FareTrack on a device (PWA)

FareTrack can be installed from its HTTPS website on supported Android devices, iPhones/iPads, and desktop browsers. It is a Progressive Web App (PWA), not an app-store download or a native APK.

### Android

1. Open the deployed HTTPS FareTrack website in a supported browser such as Chrome.
2. Tap **Install App** if it appears, or open the browser menu and choose **Install app** / **Add to Home screen** if offered.
3. Confirm the installation. Open FareTrack from the new home-screen icon.

### iPhone or iPad

1. Open the HTTPS FareTrack website in **Safari**.
2. Tap the **Share** button.
3. Choose **Add to Home Screen**. If needed, scroll the share options to find it.
4. Edit the name if desired, then tap **Add**.
5. Open FareTrack from the new Home Screen icon.

On iOS, the browser does not provide the same automatic install prompt as many Android/desktop browsers; use Safari's Share menu.

### Windows, macOS, or Linux desktop

1. Open the HTTPS FareTrack website in a browser that supports PWA installation.
2. Choose **Install App** if the browser displays the prompt, or use the browser's address-bar install icon/menu option.
3. Confirm. The installed app can then be launched from the desktop, Start menu, Applications list, or browser app launcher depending on the operating system.

## 9. Offline use and syncing

After the website has been opened successfully online, the service worker can cache the app's local shell so the interface may open when offline. However:

- Supabase registration, login, password reset, and cloud synchronization require internet access.
- Chart.js is loaded from a content delivery network and may not be available offline if it was not cached by the browser.
- Offline changes should not be assumed to sync automatically. Reconnect to the internet before relying on cloud records.
- The app must be hosted over HTTPS for service-worker functionality; `localhost` is allowed for development.

## 10. Important data and privacy notes

- Each account's cloud records are intended to be separated by Supabase Row Level Security (RLS). Keep the RLS policies in `SUPABASE_SETUP.sql` enabled.
- Use your own Supabase project credentials. Never share your password or secret/service-role key.
- A new account starts with its own cloud data. Older records saved locally by a previous version are not automatically merged into a new account. Export or back up old records before switching accounts or devices.
- The browser also stores a local copy for the active session/device. Sign out when using a shared device.
- Back up important records regularly.

## Quick navigation reference

| Section | What it does |
|---|---|
| Dashboard | Overview of recent and current fare expenses |
| Fare Calculator | Calculate and save one-way or round-trip fares |
| Transactions | Search, filter, edit, delete, and export trips |
| Receipts | Preview and print/save a transaction receipt |
| Reports | Review date-range totals, charts, and exportable reports |
| Settings | Change app preferences, fare rates, discounts, and backups |


