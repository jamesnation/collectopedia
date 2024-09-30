# Project Spec
Collectopedia is a web application designed to help users manage their toy collection. It allows users to add, edit, delete, and view details of their toys, as well as fetch current market prices via the eBay API and sold prices via RapidAPI

Each toy will have an associated image and separate detail page. 

Stats will track value of time etc. 

## Description
We're working on Collectopedia. The idea is it's a tracker for your collection of toys, similar to discogs for records or priceharting.com for video games.


## Tech Stack

- IDE: [Cursor](https://www.cursor.com/)
- AI Tools: [V0](https://v0.dev/), [Perplexity](https://www.perplexity.com/)
- Frontend: [Next.js](https://nextjs.org/docs), [Tailwind](https://tailwindcss.com/docs/guides/nextjs), [Shadcn](https://ui.shadcn.com/docs/installation), [Framer Motion](https://www.framer.com/motion/introduction/)
- Backend: [PostgreSQL](https://www.postgresql.org/about/), [Supabase](https://supabase.com/), [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql), [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- Auth: [Clerk](https://clerk.com/)
- Payments: [Stripe](https://stripe.com/)


## Core Features

1. User Authentication via Clerk
   - [x] User registration
   - [x] User login
   - [x] Password reset functionality

2. Toy Management
- [ ] Add new toys to the collection
 - [ ] Edit existing toy details
 - [ ] Delete toys from the collection
 - [ ] View all toys in a tabular format
 - [ ] Search functionality for toys
 - [ ] Filter toys by various attributes (e.g., type, date acquired)
 - [ ] Sort toys by different fields

3. Toy Details
  - [ ] Name
 - [ ] Date acquired
 - [ ] Cost
 - [ ] Current value
 - [ ] Type
 - [ ] Notes
 - [ ] Image upload and display

4. eBay Integration
- [ ] Fetch current eBay prices for active listings via eBay API
 - [ ] Fetch eBay prices for sold items via RapidAPI
 - [ ] Store fetched prices (Listed Value and Sold Value)
 - [ ] Bulk update eBay prices for all toys

5. Data Visualization
- [ ] Export collection data to CSV
 - [ ] Export collection data to PDF
 - [ ] Sync sold values to Google Sheets

6. Export Functionality
- [ ] Export collection data to CSV
 - [ ] Export collection data to PDF
 - [ ] Sync sold values to Google Sheets

7. Data Backup
- [ ] Automated backups of the collection data
 - [ ] Ability to restore from backup


8. Advanced Features
- [ ] Barcode scanning for quick toy lookup
 - [ ] AI-powered image recognition for toy identification

9. User Preferences
    - [ ] Customizable dashboard layout
    - [ ] User-defined custom fields for toys

10. Collaboration
    - [ ] Sharing collections with other users
    - [ ] Commenting system on toy entries

11. Notifications
    - [ ] Price alerts for specific toys
    - [ ] Reminders for updating toy values

12. API
    - [ ] RESTful API for third-party integrations

13. Performance Optimization
    - [ ] Pagination for large collections
    - [ ] Caching frequently accessed data


## 14. User Interface
 - [ ] Responsive design for mobile and desktop
 - [ ] Accessible UI components
 - [ ] Dark mode / theme customization

## 15. Security
 - [ ] Data encryption
 - [ ] GDPR compliance
 - [ ] Rate limiting to prevent abuse

## 16. Analytics
 - [ ] User engagement tracking
 - [ ] Collection growth metrics
