# Frontend Role Testing Scenarios

## Document Purpose

This document provides comprehensive testing scenarios for each user role in the MNU Events platform. The goal is to enable thorough testing of all functionality, UI/UX consistency, visual elements, color schemes, and potential mismatches across the entire frontend application.

## System Overview

The platform supports four distinct user roles:
- STUDENT
- ORGANIZER  
- MODERATOR
- ADMIN

Each role has dedicated routes, layouts, permissions, and UI components. The application uses role-based access control with protected routes and automatic redirects based on user roles.

---

## 1. STUDENT Role Testing Scenarios

### 1.1 Authentication & Access

#### Login Flow
1. Navigate to `/login` page
2. Verify page displays login form with email and password fields
3. Verify "Sign Up" link is present and functional
4. Enter student credentials and submit
5. Verify successful redirect to home page `/`
6. Verify user info appears in header (name or email)
7. Verify profile dropdown is accessible from header

#### Expected Behavior After Login
- User sees personalized home page with "My Upcoming Events" section if registered for events
- Bottom navigation appears on mobile devices
- Profile menu shows: "My Registrations", "CSI Dashboard", "Edit Profile", "Logout"
- Gamification badge displays user level and points in header (desktop only)

### 1.2 Home Page Experience

#### Hero Section (Event Slider)
1. Verify hero section occupies full viewport height
2. Check event slider displays trending events (up to 6 events)
3. Verify each slide shows:
   - Event background image with dark overlay
   - Event category badge (red background, white text)
   - Event title (large, bold, white text)
   - Event description (truncated to 2 lines)
   - Event date and location with icons
4. Verify slide indicators at bottom (dots)
5. Verify navigation arrows on desktop (left/right)
6. Check auto-advance every 5 seconds
7. Verify "Learn More" and "View All Events" buttons

#### Marketplace/Services Section
1. Scroll to Marketplace section
2. Verify section title: "Marketplace услуг" with red accent on "услуг"
3. Check "Create Service" button (purple background)
4. Check "Post Ad" button (outlined)
5. Verify search bar with magnifying glass icon
6. Test category filter dropdown (all categories listed)
7. Test sort filter (rating, price ascending/descending, newest)
8. Click "Фильтры" button to open advanced filters
9. Verify price range inputs (min/max)
10. Check service cards display:
    - Service image placeholder
    - Service title
    - Service description
    - Category badge
    - Price display
    - Rating and review count
    - Provider information

#### My Upcoming Events (Authenticated Students Only)
1. Verify section appears only if student has registered events
2. Check section title: "My Upcoming Events" with red accent
3. Verify horizontal scroll container
4. Check each event card shows:
   - Event image with gradient overlay
   - Category badge (red background)
   - CSI tags (if applicable) with proper colors:
     - Creativity: purple background, purple text
     - Service: green background, green text
     - Intelligence: blue background, blue text
   - Event date with calendar icon
   - Event title (clickable)
   - Location with red location icon
5. Verify hover effects (scale image, border color change to red)
6. Test "View All" link on desktop
7. Test mobile "View All" button at bottom

### 1.3 Events Page

#### Navigation & Access
1. Navigate to `/events` from header or home page
2. Verify page displays all upcoming events
3. Check page layout and responsiveness

#### Event Browsing
1. Verify events are displayed in card grid format
2. Check each event card contains:
   - Event image
   - Category badge (red)
   - CSI tags with appropriate colors
   - Title
   - Date and time
   - Location
   - Capacity information
   - Price (if paid event)
3. Test hover effects on event cards
4. Click event card to open event details modal
5. Verify modal displays full event information
6. Test modal close functionality (X button, outside click, ESC key)

#### Event Details Page
1. Click "View Details" or navigate to `/events/:id`
2. Verify comprehensive event information display:
   - Large event image
   - Event title and description
   - Organizer information
   - Start date and end date formatted properly
   - Location details
   - Capacity and available seats
   - Price (for paid events)
   - Registration status
   - CSI tags with proper color coding

#### Registration Actions
1. For free events:
   - Verify "Register" button appears (green background)
   - Click register button
   - Verify success toast notification
   - Verify button changes to "Cancel Registration" (red)
   - Verify available seats count decreases

2. For paid events:
   - Verify "Buy Ticket" button appears
   - Click buy ticket button
   - Verify redirect to mock payment page
   - Complete payment flow
   - Return to event page
   - Verify registration confirmed

3. For full events:
   - Verify "Event Full" or "Join Waitlist" button
   - Test waitlist registration

4. For past events:
   - Verify registration button is disabled
   - Check appropriate messaging

#### QR Code Check-in (Student Scanner)
1. Navigate to `/scan-event` (STUDENT only)
2. Verify access restricted to STUDENT role only
3. Check QR scanner interface loads properly
4. Test camera permissions request
5. Scan event QR code
6. Verify check-in success message
7. Verify check-in recorded in backend

### 1.4 My Registrations Page

#### Page Access & Layout
1. Navigate to `/registrations` (STUDENT only)
2. Verify page shows two tabs:
   - Registrations tab
   - My Tickets tab
3. Check tab badge counts display correct numbers
4. Verify active tab has red background styling

#### Registrations Tab
1. Activate Registrations tab
2. Check search bar functionality (sticky on desktop)
3. Test filter buttons (ALL, UPCOMING, PAST, WAITLIST)
4. Verify filter chips have proper styling:
   - Active: red background, white text
   - Inactive: gray background
5. Browse registered events list
6. Check each registration card shows:
   - Event image
   - Event title and date
   - Registration status badge:
     - REGISTERED: green background
     - WAITLIST: yellow background
     - CANCELLED: gray background
   - Location
   - Cancel button (for active registrations)

#### Cancel Registration Flow
1. Click "Cancel Registration" button
2. Verify confirmation dialog appears
3. Confirm cancellation
4. Verify toast notification
5. Verify registration removed or status updated
6. Check available seats increased on event page

#### My Tickets Tab
1. Switch to "My Tickets" tab
2. Verify paid event tickets display
3. Check ticket component shows:
   - Event details
   - QR code
   - Transaction ID
   - Payment status
   - Ticket validity

### 1.5 CSI Dashboard Page

#### Access & Overview
1. Navigate to `/csi-dashboard` (STUDENT only)
2. Verify page title and description
3. Check CSI explanation section

#### CSI Statistics Display
1. Verify three CSI category cards:
   - Creativity (purple theme)
   - Service (green theme)
   - Intelligence (blue theme)
2. Each card should show:
   - Category icon and name
   - Points earned
   - Events attended count
   - Progress visualization

#### CSI Events History
1. Scroll to events history section
2. Verify events grouped by CSI category
3. Check each event shows CSI tags
4. Verify color consistency with category theme
5. Test filtering by CSI category

### 1.6 Clubs Page

#### Browsing Clubs
1. Navigate to `/clubs`
2. Verify club cards display:
   - Club image/logo
   - Club name
   - Member count
   - Organizer name
   - Join button (for non-members)
3. Test club search/filter functionality
4. Click club card to view details

#### Club Details Page
1. Navigate to `/clubs/:id`
2. Verify club information display:
   - Club banner/image
   - Club name and description
   - Organizer information
   - Member count
   - Creation date
   - List of upcoming club events

#### Join/Leave Club Actions (STUDENT only)
1. For clubs not joined:
   - Verify "Join Club" button appears
   - Click join button
   - Verify success notification
   - Verify button changes to "Leave Club"
   - Verify member count increases

2. For joined clubs:
   - Verify "Leave Club" button appears
   - Click leave button
   - Verify confirmation dialog
   - Confirm leave action
   - Verify button changes back to "Join Club"

3. For club organizers:
   - Verify "You are the organizer" badge displays
   - Verify no join/leave button

4. Access restrictions for non-students:
   - ORGANIZER: "Organizers cannot join clubs. Manage your clubs from the dashboard."
   - ADMIN/MODERATOR: "Only students can join clubs."

### 1.7 Profile Page

#### View Profile
1. Navigate to `/profile`
2. Verify profile information display:
   - Profile avatar/photo
   - Full name
   - Email
   - Student ID (if applicable)
   - Faculty/Department
   - Role badge with appropriate color:
     - STUDENT: blue/teal background
3. Check gamification summary (for students):
   - Current level
   - Total points
   - Recent achievements

#### Edit Profile
1. Click "Edit Profile" button
2. Verify edit modal opens
3. Test form fields:
   - First name
   - Last name
   - Email (read-only or editable based on settings)
   - Faculty
   - Bio
4. Make changes and save
5. Verify toast notification on success
6. Verify profile updates immediately

#### Profile Actions
1. Test "Share Profile" button (copy link or native share)
2. Verify "Logout" button functionality

### 1.8 Services Marketplace (Student-Specific)

#### Create Service
1. Navigate to `/services/create` (STUDENT only)
2. Verify form fields:
   - Service title
   - Description
   - Category dropdown
   - Price type (FIXED, HOURLY, NEGOTIABLE)
   - Price amount
   - Image upload
3. Fill form and submit
4. Verify service goes to moderation queue
5. Verify success notification

#### Create Advertisement
1. Navigate to `/advertisements/create` (STUDENT only)
2. Verify ad creation form
3. Test form validation
4. Submit advertisement
5. Verify moderation queue submission

### 1.9 UI/UX Testing Checkpoints

#### Color Scheme Consistency
1. Primary Red: `#d62e1f`
   - Verify used consistently for primary CTAs
   - Check hover states darken to `#ff4433`
2. Dark Mode Colors:
   - Background: `#0a0a0a`
   - Card background: `#1a1a1a`
   - Border: `#2a2a2a`
   - Text: white
   - Muted text: `#a0a0a0`
3. Light Mode Colors:
   - Background: `#f9f9f9` or `#f5f5f5`
   - Card background: white
   - Border: `#e5e5e5` or gray-200
   - Text: gray-900
   - Muted text: gray-600

#### Typography
1. Headings: extrabold, proper sizing hierarchy
2. Body text: readable font size (14-16px)
3. Proper line height and spacing

#### Buttons & Interactive Elements
1. Primary buttons: red background, white text, rounded corners
2. Secondary buttons: outlined or gray background
3. Hover states: smooth transitions, color changes
4. Disabled states: reduced opacity, no interaction
5. Loading states: spinner or skeleton

#### Responsive Design
1. Test on mobile (320px - 767px)
2. Test on tablet (768px - 1023px)
3. Test on desktop (1024px+)
4. Verify bottom navigation appears only on mobile
5. Check header adapts properly
6. Verify card grids adjust columns

#### Dark Mode
1. Toggle theme from header
2. Verify all sections adapt
3. Check no "flash of wrong theme"
4. Verify images/logos switch (if applicable)
5. Check contrast ratios remain accessible

#### Liquid Glass Effects
1. Header: `liquid-glass-strong` or `liquid-glass-subtle`
2. Cards: `liquid-glass-card`
3. Buttons: `liquid-glass-red-button`
4. Verify backdrop blur effects work

---

## 2. ORGANIZER Role Testing Scenarios

### 2.1 Authentication & Access

#### Login Flow
1. Navigate to `/admin/login` (shared with admin)
2. Enter organizer credentials
3. Verify redirect to `/organizer` dashboard
4. If attempting regular `/login`, verify redirect still works

#### Auto-Redirect Behavior
1. Attempt to access home page `/`
2. Verify automatic redirect to `/organizer`
3. Attempt to access student-only routes
4. Verify access denied or redirect

### 2.2 Organizer Dashboard

#### Dashboard Overview
1. Verify dashboard loads at `/organizer`
2. Check welcome message with organizer name
3. Verify "View Analytics" button in header

#### KPI Cards
1. Verify four statistic cards:
   - Total Events (gray theme)
   - Upcoming Events (gray theme)
   - Total Registrations (gray theme)
   - Active Clubs (gray theme, shows 0 if not implemented)
2. Check numbers update correctly
3. Verify card styling: liquid-glass-card with rounded corners

#### Upcoming Events Table
1. Verify events listed in chronological order
2. Check each event row shows:
   - Event title
   - Status badge:
     - Upcoming: green or default
     - Ongoing: blue
     - Completed: gray
   - Date and location
   - Registration progress bar:
     - Red progress bar
     - Percentage display
     - Count: "X / Y registered"
3. Verify action buttons per event:
   - "View" (outlined)
   - "QR Display" (purple outlined) - for displaying QR at lectures
   - "Scan Tickets" (red outlined) - for scanning student tickets
   - "Export" (green outlined) - download participant CSV
   - "Manage" (red filled) - edit event

#### Empty State
1. If no events, verify message: "No upcoming events"
2. Check "Create Your First Event" CTA button
3. Verify button styling

### 2.3 Create Event Flow

#### Access Create Event
1. Click "Create Event" from dashboard
2. Verify navigation to `/organizer/create-event`
3. Check page uses OrganizerLayout

#### Event Creation Form
1. Verify all form fields:
   - Event title (required)
   - Description (required, textarea)
   - Category dropdown (ACADEMIC, SPORTS, CULTURAL, TECH, SOCIAL, CAREER, OTHER)
   - CSI Tags (multi-select checkboxes):
     - CREATIVITY (purple)
     - SERVICE (green)
     - INTELLIGENCE (blue)
   - Start date and time (datetime-local)
   - End date and time (datetime-local)
   - Location (required)
   - Capacity (number, required)
   - Price (number, 0 for free)
   - Club association (optional dropdown)
   - Image upload (optional)

#### Form Validation
1. Test required field validation
2. Verify date validation (end date after start date)
3. Check capacity > 0
4. Test price validation (≥ 0)

#### Submit Event
1. Fill form with valid data
2. Click "Create Event" button
3. Verify loading state on button
4. Verify success toast notification
5. Verify redirect to dashboard
6. Verify new event appears in upcoming events

### 2.4 Edit Event Flow

#### Access Edit
1. Click "Manage" button on an event
2. Verify navigation to `/organizer/events/:id/edit`
3. Check form pre-populated with event data

#### Edit Functionality
1. Modify event details
2. Verify all fields editable (except date if event started)
3. Save changes
4. Verify toast notification
5. Verify updates reflected on dashboard
6. Verify updates visible on public event page

### 2.5 Event QR Display Page

#### Access QR Display
1. Click "QR Display" button for an event
2. Verify navigation to `/organizer/event-qr/:eventId`
3. Verify fullscreen QR code display

#### QR Display Features
1. Check large QR code centered
2. Verify event title displayed
3. Verify event date/time shown
4. Check "Full Screen" button functionality
5. Verify students can scan this QR for check-in
6. Test "Back to Dashboard" button

### 2.6 Organizer Scanner Page

#### Access Scanner
1. Click "Scan Tickets" button for an event
2. Verify navigation to `/organizer/scanner/:eventId`
3. Check access restricted to ORGANIZER role

#### Scanner Interface
1. Verify camera initialization
2. Check QR scanner view loads
3. Test scanning student ticket QR codes
4. Verify successful scan shows:
   - Student name
   - Ticket validity
   - Check-in confirmation
5. Verify invalid/duplicate scan handling
6. Check scan history/log

### 2.7 Export Participants

#### Export Functionality
1. Click "Export" button on event
2. Verify loading toast: "Exporting participants..."
3. Verify CSV file download
4. Open CSV and check data:
   - Student names
   - Email addresses
   - Registration status
   - Check-in status
   - Registration date
5. Verify filename format: `EventTitle_participants_YYYY-MM-DD.csv`

### 2.8 Organizer Analytics Page

#### Access Analytics
1. Click "View Analytics" from dashboard header
2. Verify navigation to `/organizer/analytics`
3. Check OrganizerLayout applied

#### Analytics Dashboard
1. Verify analytics overview cards
2. Check charts and visualizations:
   - Event registrations over time
   - Popular event categories
   - Registration trends
3. Verify data accuracy
4. Test date range filters (if implemented)

### 2.9 Organizer-Specific Restrictions

#### Club Membership
1. Navigate to `/clubs/:id` as organizer
2. Verify message: "Organizers cannot join clubs. Manage your clubs from the dashboard."
3. Verify no join/leave button

#### Student-Only Features
1. Attempt to access `/registrations`
2. Verify access denied or redirect
3. Attempt to access `/scan-event` (student scanner)
4. Verify access denied
5. Attempt to access `/csi-dashboard`
6. Verify access denied

### 2.10 Organizer Layout & Navigation

#### Sidebar Navigation
1. Verify OrganizerLayout sidebar:
   - Dashboard link
   - Create Event link
   - Analytics link
   - Profile link
   - Logout button
2. Check active state highlighting (red background)
3. Verify sidebar collapse/expand on mobile
4. Check sidebar icons and labels

#### Header
1. Verify header shows organizer name
2. Check theme toggle functionality
3. Verify no gamification badge (organizers don't have this)
4. Check profile dropdown

### 2.11 UI/UX Testing (Organizer-Specific)

#### Color Consistency
1. Organizer badge: orange background (`bg-orange-600`)
2. Primary CTAs: red (`#d62e1f`)
3. Status badges: consistent with student view
4. Card borders: gray in light mode, `#2a2a2a` in dark mode

#### Button Hierarchy
1. Primary actions: red filled buttons
2. Secondary actions: outlined buttons with color coding:
   - View: gray/default
   - QR Display: purple
   - Scan Tickets: red
   - Export: green
   - Manage: red filled

#### Responsive Design
1. Test dashboard on mobile, tablet, desktop
2. Verify event cards stack properly
3. Check sidebar adapts to mobile (hamburger menu)
4. Test form layouts on different screens

#### Dark Mode
1. Toggle theme on organizer pages
2. Verify all organizer pages adapt
3. Check chart/graph colors remain readable
4. Verify liquid glass effects work

---

## 3. MODERATOR Role Testing Scenarios

### 3.1 Authentication & Access

#### Login Flow
1. Navigate to `/admin/login` (shared login for ADMIN/ORGANIZER/MODERATOR)
2. Enter moderator credentials
3. Verify redirect to `/moderator` dashboard
4. Verify access denied for non-moderator roles

### 3.2 Moderator Dashboard

#### Dashboard Overview
1. Navigate to `/moderator`
2. Verify ModeratorLayout applied
3. Check page title: "Moderation Dashboard"
4. Verify description: "Review and manage content submissions"

#### Statistics Cards
1. Verify four KPI cards:
   - Pending Review (orange theme)
     - Badge: "Requires attention"
   - Approved (green theme)
     - Badge: "Content published"
   - Rejected (red theme)
     - Badge: "Content declined"
   - Total Reviewed (gray theme)
     - Badge: "All time"
2. Check numbers display correctly
3. Verify card hover effects

#### Quick Actions Section
1. Verify "Pending Queue" link
   - Shows pending count badge (orange)
   - Click redirects to moderation queue
2. Verify "Approved Content" link
   - Shows approved count badge (green)
   - Click redirects to queue with approved filter

#### Recent Pending Items
1. If pending items exist:
   - Verify up to 5 recent items shown
   - Each item shows:
     - Item type badge (SERVICE: blue, EVENT: purple, ADVERTISEMENT: orange)
     - Item title
     - Submission date
     - "Review" button (red)
2. If no pending items:
   - Verify "All Caught Up!" message
   - Check green checkmark icon

### 3.3 Moderation Queue Page

#### Access Queue
1. Click "Pending Queue" from dashboard or navigate to `/moderator/queue`
2. Verify page title: "Moderation Queue"
3. Check filters at top:
   - Status filter: PENDING, APPROVED, REJECTED
   - Type filter: All Types, Services, Events, Advertisements

#### Queue Display
1. Verify queue items listed as cards
2. Each card shows:
   - Item type badge with color coding
   - Submission date
   - Item title (bold, large)
   - Item description (in gray box)
   - Item image preview (if available)
   - Rejection reason (if rejected)

#### Moderation Actions (Pending Items)
1. For each pending item, verify action buttons:
   - "Approve" button (green)
   - "Reject" button (outlined red)

#### Approve Flow
1. Click "Approve" button
2. Verify loading state: "Processing..."
3. Verify item moves out of pending queue
4. Verify approved count increases
5. Check item visible in approved filter

#### Reject Flow
1. Click "Reject" button
2. Verify rejection modal opens:
   - Modal title: "Reject Submission"
   - Explanation text
   - Textarea for rejection reason
   - "Cancel" button
   - "Confirm Rejection" button (red)
3. Enter rejection reason
4. Click "Confirm Rejection"
5. Verify loading state
6. Verify item moves to rejected filter
7. Verify rejected count increases

#### Filter Testing
1. Switch to "Approved" status filter
   - Verify only approved items shown
   - Verify no action buttons
2. Switch to "Rejected" status filter
   - Verify only rejected items shown
   - Verify rejection reason displayed
3. Test type filters (SERVICE, EVENT, ADVERTISEMENT)
4. Test combined filters (e.g., Pending Services)

#### Empty States
1. When no items match filters:
   - Verify "All caught up!" message
   - Check green checkmark icon
   - Verify friendly message

### 3.4 Moderator Layout & Navigation

#### Sidebar Navigation
1. Verify ModeratorLayout sidebar:
   - Dashboard link
   - Moderation Queue link
   - Profile link
   - Logout button
2. Check active state (red background)
3. Verify sidebar logo and branding
4. Test sidebar collapse on mobile

#### Access Restrictions
1. Verify moderators cannot access:
   - `/admin/*` routes
   - `/organizer/*` routes
   - Student-specific features
2. Verify moderators CAN access:
   - Public pages (events, clubs) in read-only mode
   - Profile page

### 3.5 UI/UX Testing (Moderator-Specific)

#### Color Scheme
1. Moderator badge color (if shown in profile): specific color for moderator role
2. Pending items: orange theme
3. Approved items: green theme
4. Rejected items: red theme
5. Action buttons: green for approve, red for reject

#### Typography & Readability
1. Item titles: bold, large, easy to read
2. Descriptions: gray background box, proper contrast
3. Dates: smaller, muted color
4. Badges: uppercase, bold, small font

#### Responsive Design
1. Test queue on mobile: cards stack vertically
2. Test on tablet: check layout
3. Desktop: verify optimal spacing
4. Check action buttons remain accessible on all sizes

#### Modal Interactions
1. Rejection modal:
   - Backdrop blur effect
   - Click outside to close (should NOT close, must click Cancel)
   - ESC key closes modal
   - Textarea autofocus
   - Character count or validation

#### Dark Mode
1. Toggle dark mode on moderator pages
2. Verify card backgrounds: `#1a1a1a`
3. Check modal backgrounds
4. Verify text remains readable
5. Check badge colors adapt

---

## 4. ADMIN Role Testing Scenarios

### 4.1 Authentication & Access

#### Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Verify redirect to `/admin` dashboard
4. Verify ADMIN role required for access
5. If non-admin attempts access, verify "Access denied" message

### 4.2 Admin Dashboard

#### Dashboard Overview
1. Navigate to `/admin`
2. Verify AdminLayout applied
3. Check page title: "Admin Dashboard"
4. Verify description: "Platform statistics and overview"

#### Statistics Cards
1. Verify four KPI cards:
   - Total Users
   - Total Events
   - Total Registrations
   - Active Clubs
2. Check all numbers accurate
3. Verify badges: "All registered users", "All platform events", etc.
4. Verify card hover effects (shadow lift)

#### Quick Actions
1. Verify three quick action cards:
   - Manage Events → `/admin/events`
   - Manage Users → `/admin/users`
   - Manage Clubs → `/admin/clubs`
2. Test each link navigates correctly
3. Verify hover effects (border color change to red)

### 4.3 Manage Events (Admin)

#### Access Page
1. Navigate to `/admin/events`
2. Verify page title: "Manage Events"
3. Check filter/search controls

#### Events List
1. Verify all platform events listed
2. Each event card shows:
   - Event title
   - Organizer name
   - Date and location
   - Category badge
   - Registration count
   - Status badge
3. Verify action buttons:
   - "View" (navigate to public event page)
   - "Edit" (admin can edit any event)
   - "Delete" (admin can delete events)

#### Edit Event (Admin)
1. Click "Edit" on any event
2. Verify edit form opens
3. Verify admin can edit all fields
4. Make changes and save
5. Verify toast notification
6. Verify changes reflected

#### Delete Event
1. Click "Delete" button
2. Verify confirmation dialog: "Are you sure you want to delete this event?"
3. Confirm deletion
4. Verify event removed
5. Verify toast notification
6. Verify event count decreases

#### Search & Filter
1. Test search by event title
2. Test filter by category
3. Test filter by status (upcoming, past, etc.)
4. Test filter by organizer
5. Verify results update in real-time

### 4.4 Manage Users (Admin)

#### Access Page
1. Navigate to `/admin/users`
2. Verify page title: "Manage Users"
3. Check search and filter controls

#### Users List
1. Verify paginated user list (20 users per page)
2. Each user card shows:
   - User name
   - Email
   - Role badge with color:
     - STUDENT: blue (`bg-blue-100 text-blue-800`)
     - ORGANIZER: purple (`bg-purple-100 text-purple-800`)
     - ADMIN: red (`bg-red-100 text-red-800`)
   - Registration date
   - Action buttons

#### Search Users
1. Enter search query (name or email)
2. Click search button
3. Verify results filtered
4. Verify "Page 1 of X" updates

#### Filter by Role
1. Select role filter dropdown
2. Choose STUDENT
3. Verify only students shown
4. Repeat for ORGANIZER and ADMIN
5. Select "All Roles" to reset

#### Change User Role
1. Locate user card
2. Click role dropdown on user card
3. Select new role (STUDENT, ORGANIZER, ADMIN)
4. Verify confirmation or immediate change
5. Verify toast notification: "User role updated successfully"
6. Verify role badge updates

#### Delete User
1. Click "Delete" button on user card
2. Verify confirmation: `Are you sure you want to delete user "{email}"?`
3. Confirm deletion
4. Verify toast notification: "User deleted successfully"
5. Verify user removed from list
6. Verify total count decreases

#### Pagination
1. If more than 20 users:
   - Verify "Previous" and "Next" buttons
   - Verify page indicator: "Page X of Y"
   - Click "Next" to go to page 2
   - Verify users load
   - Click "Previous" to go back

### 4.5 Manage Clubs (Admin)

#### Access Page
1. Navigate to `/admin/clubs`
2. Verify page title: "Manage Clubs"
3. Check clubs list

#### Clubs List
1. Verify all platform clubs listed
2. Each club card shows:
   - Club name
   - Organizer
   - Member count
   - Creation date
   - Action buttons

#### Edit Club
1. Click "Edit" on club
2. Verify edit modal/form
3. Test editing:
   - Club name
   - Description
   - Image
4. Save changes
5. Verify toast notification

#### Delete Club
1. Click "Delete" button
2. Verify confirmation dialog
3. Confirm deletion
4. Verify club removed
5. Verify member count and organizer notified (if implemented)

### 4.6 Pricing Settings (Admin)

#### Access Page
1. Navigate to `/admin/pricing`
2. Verify page title: "Pricing Settings"
3. Check current pricing configuration

#### Pricing Configuration
1. Verify settings displayed:
   - Default event price
   - Commission percentage
   - Subscription tiers (if implemented)
   - Ad pricing
2. Test editing pricing values
3. Save changes
4. Verify toast notification
5. Verify settings apply platform-wide

### 4.7 Admin Layout & Navigation

#### Sidebar Navigation
1. Verify AdminLayout sidebar with red accent
2. Check navigation items:
   - Dashboard (📊 icon)
   - Manage Events (📅 icon)
   - Manage Users (👥 icon)
   - Manage Clubs (🏢 icon)
   - Pricing Settings (💰 icon)
3. Verify active state highlighting (red background)
4. Check sidebar expand/collapse
5. Verify logo: red "A" badge + "Admin Panel"

#### Header
1. Verify admin header consistent with layout
2. Check theme toggle
3. Verify language selector
4. Check profile dropdown with logout

### 4.8 Admin Access to All Features

#### Public Pages Access
1. Verify admin can view events page
2. Verify admin can view event details
3. Verify admin can view clubs
4. Verify admin cannot join clubs (message: "Only students can join clubs")

#### Admin vs Other Roles
1. Verify admin cannot access:
   - Student-specific: registrations, CSI dashboard, scanner
   - Organizer-specific: organizer dashboard, event creation (unless explicitly allowed)
2. Verify admin CAN access:
   - All admin pages
   - Profile page
   - Public pages (read-only)

### 4.9 UI/UX Testing (Admin-Specific)

#### Color Scheme
1. Admin badge: red (`#d62e1f` or `bg-red-600`)
2. Sidebar: red accents
3. Active navigation: red background
4. Primary buttons: red
5. Destructive actions (delete): red with confirmation

#### Admin Panel Aesthetics
1. Logo: Red "A" badge in sidebar
2. Typography: bold, professional
3. Cards: liquid-glass effect
4. Buttons: consistent rounded corners (rounded-xl)

#### Responsive Design
1. Test admin dashboard on desktop, tablet, mobile
2. Verify sidebar collapses to hamburger on mobile
3. Check user/event/club cards stack properly
4. Verify tables scroll horizontally if needed

#### Dark Mode
1. Toggle dark mode on admin pages
2. Verify sidebar background: dark theme
3. Check all admin pages adapt
4. Verify contrast ratios
5. Check data tables remain readable

#### Confirmation Dialogs
1. Delete event: clear confirmation message
2. Delete user: shows user email in confirmation
3. Delete club: appropriate warning
4. Role change: immediate or with confirmation

---

## 5. Cross-Role UI/UX Testing

### 5.1 Common Elements Across All Roles

#### Header Consistency
1. Logo placement: centered
2. Theme toggle: consistent position
3. Language selector: consistent position
4. Profile dropdown: same style across roles
5. Logout functionality: works for all roles

#### Toast Notifications
1. Success: green background, checkmark icon
2. Error: red background, X icon
3. Info: blue background, info icon
4. Position: top-right or top-center
5. Auto-dismiss after 3-5 seconds
6. Manual close button (X)

#### Loading States
1. Spinner: consistent style (red color)
2. Skeleton loaders: gray placeholders
3. Button loading: text changes to "Loading..." or spinner
4. Page loading: centered spinner with backdrop

#### Error States
1. Error messages: red background, clear text
2. 404 page: consistent styling, "Go Home" button
3. Access denied: clear message with required role info
4. Network errors: retry button

### 5.2 Responsive Breakpoints

#### Mobile (< 768px)
1. Single column layouts
2. Bottom navigation for students
3. Hamburger menus for admin/organizer/moderator
4. Stack cards vertically
5. Hide desktop-only elements
6. Touch-friendly button sizes (min 44px)

#### Tablet (768px - 1023px)
1. Two-column layouts where appropriate
2. Sidebar remains visible but can collapse
3. Cards in 2-column grid
4. Desktop navigation visible

#### Desktop (≥ 1024px)
1. Full sidebar navigation
2. Multi-column grids (3-4 columns)
3. Hover states active
4. Maximum content width: 7xl (1280px)

### 5.3 Theme Switching

#### Light to Dark Transition
1. Click theme toggle
2. Verify smooth transition (300ms)
3. Check all elements adapt:
   - Backgrounds
   - Text colors
   - Borders
   - Shadows
   - Images/logos (if applicable)
4. Verify no flash of unstyled content
5. Verify theme persists on page reload

#### Dark Mode Specifics
1. Background: `#0a0a0a`
2. Card backgrounds: `#1a1a1a`
3. Borders: `#2a2a2a`
4. Text: white
5. Muted text: `#a0a0a0`
6. Verify readability and contrast

### 5.4 Accessibility Testing

#### Keyboard Navigation
1. Tab through all interactive elements
2. Verify focus indicators visible
3. Test Enter/Space for button activation
4. Test ESC to close modals/dropdowns
5. Verify skip links (if implemented)

#### Screen Reader Compatibility
1. Verify alt text on images
2. Check ARIA labels on icons
3. Verify form labels
4. Check heading hierarchy (h1 → h2 → h3)
5. Verify button descriptions

#### Color Contrast
1. Verify WCAG AA compliance
2. Check text on colored backgrounds
3. Verify button text readable
4. Check badge text contrast
5. Verify link colors distinguishable

### 5.5 Animation & Transitions

#### Expected Animations
1. Page transitions: smooth fade or slide
2. Modal open/close: scale and fade
3. Dropdown open: smooth slide down
4. Button hover: background color change (200-300ms)
5. Card hover: shadow lift, scale slightly

#### Performance
1. Animations should not lag
2. No jank during scroll
3. Smooth theme transitions
4. Lazy load images below fold

---

## 6. Common UI/UX Issues to Check

### 6.1 Text & Typography Issues

1. Truncation: check long titles don't break layout (use `line-clamp-2`)
2. Overflow: verify long emails or names handled
3. Font sizes: ensure readability (min 14px for body)
4. Line height: adequate spacing (1.5-1.7 for body text)
5. Font weights: hierarchy clear (bold for headings, normal for body)

### 6.2 Color Mismatches

1. Red shades: verify `#d62e1f` used consistently
2. Badge colors: check role badges match specification
3. Status colors: green (success), red (error), yellow (warning), blue (info)
4. Dark mode borders: all use `#2a2a2a` consistently
5. Background colors: verify no unexpected grays

### 6.3 Button Inconsistencies

1. Primary CTA: always red background, white text
2. Secondary: outlined or gray background
3. Destructive: red with confirmation
4. Disabled: reduced opacity, no pointer
5. Sizes: consistent padding across similar buttons

### 6.4 Card & Container Issues

1. Rounded corners: verify `rounded-2xl` or `rounded-xl` consistent
2. Shadows: check hover states add shadow
3. Borders: light mode vs dark mode consistency
4. Padding: internal spacing uniform
5. Liquid glass effect: backdrop blur applied correctly

### 6.5 Spacing & Layout

1. Section padding: consistent top/bottom spacing
2. Grid gaps: uniform spacing between cards
3. Container max-width: 7xl (1280px) for main content
4. Margin collapsing: no unexpected gaps
5. Mobile padding: adequate on small screens

### 6.6 Image & Media Issues

1. Broken images: fallback to placeholder
2. Aspect ratios: images don't distort
3. Lazy loading: images below fold load on scroll
4. Image optimization: fast load times
5. Dark mode images: logos/images swap if needed

### 6.7 Form & Input Issues

1. Input borders: visible and distinguishable
2. Focus states: clear blue or red ring
3. Error states: red border, error message below
4. Placeholder text: muted color, descriptive
5. Required fields: marked with asterisk or label
6. Validation: inline error messages

### 6.8 Modal & Overlay Issues

1. Backdrop: dark overlay behind modal
2. Close button: visible X in top-right
3. ESC key closes modal
4. Click outside closes modal (or doesn't, based on design)
5. Focus trap: tab stays within modal
6. Scrollable content: if modal content long

### 6.9 Navigation Issues

1. Active state: current page highlighted
2. Hover state: background change on hover
3. Breadcrumbs: if implemented, show current path
4. Back button: returns to previous page
5. Deep linking: direct URLs work correctly

### 6.10 Data Display Issues

1. Empty states: friendly message when no data
2. Loading states: skeleton or spinner while fetching
3. Pagination: correct page numbers, functional next/prev
4. Sorting: arrow indicators, correct order
5. Filtering: results update immediately

---

## 7. Performance & Quality Checkpoints

### 7.1 Page Load Performance

1. First Contentful Paint (FCP): < 1.5s
2. Largest Contentful Paint (LCP): < 2.5s
3. Time to Interactive (TTI): < 3.5s
4. Total page size: reasonable (< 3MB initial load)

### 7.2 Network Handling

1. Failed API calls: show error message, retry option
2. Slow network: loading indicators
3. Offline: appropriate offline message
4. API errors: user-friendly error messages (not raw server errors)

### 7.3 Browser Compatibility

1. Chrome/Edge: full functionality
2. Firefox: verify all features work
3. Safari: check webkit-specific issues
4. Mobile browsers: test on iOS Safari, Chrome mobile

### 7.4 Security & Privacy

1. Passwords: masked input
2. API tokens: not exposed in client
3. Role checks: enforce on backend (frontend checks are UX only)
4. XSS prevention: inputs sanitized
5. CSRF protection: verify cookies httpOnly

---

## 8. Role-Specific Feature Matrix

| Feature | STUDENT | ORGANIZER | MODERATOR | ADMIN |
|---------|---------|-----------|-----------|-------|
| **Authentication** |
| Login | ✅ `/login` | ✅ `/admin/login` | ✅ `/admin/login` | ✅ `/admin/login` |
| Logout | ✅ | ✅ | ✅ | ✅ |
| **Home & Public Pages** |
| Home Page | ✅ Full access | ❌ Redirect to `/organizer` | ❌ Redirect to `/moderator` | ❌ Redirect to `/admin` |
| Events Page | ✅ View all | ✅ View all | ✅ View all (read-only) | ✅ View all (read-only) |
| Event Details | ✅ View + Register | ✅ View only | ✅ View only | ✅ View only |
| Clubs Page | ✅ View all | ✅ View all | ✅ View all (read-only) | ✅ View all (read-only) |
| Club Details | ✅ View + Join/Leave | ✅ View only | ✅ View only | ✅ View only |
| **Student Features** |
| Register for Events | ✅ | ❌ | ❌ | ❌ |
| My Registrations | ✅ | ❌ | ❌ | ❌ |
| Buy Tickets | ✅ | ❌ | ❌ | ❌ |
| My Tickets | ✅ | ❌ | ❌ | ❌ |
| Join Clubs | ✅ | ❌ | ❌ | ❌ |
| CSI Dashboard | ✅ | ❌ | ❌ | ❌ |
| QR Scanner (Check-in) | ✅ `/scan-event` | ❌ | ❌ | ❌ |
| Create Service | ✅ | ❌ | ❌ | ❌ |
| Create Advertisement | ✅ | ❌ | ❌ | ❌ |
| Gamification | ✅ | ❌ | ❌ | ❌ |
| **Organizer Features** |
| Organizer Dashboard | ❌ | ✅ `/organizer` | ❌ | ❌ |
| Create Event | ❌ | ✅ | ❌ | ❌ |
| Edit Own Events | ❌ | ✅ | ❌ | ❌ |
| QR Display (Lecture) | ❌ | ✅ | ❌ | ❌ |
| Scan Tickets | ❌ | ✅ | ❌ | ❌ |
| Export Participants | ❌ | ✅ | ❌ | ❌ |
| Organizer Analytics | ❌ | ✅ | ❌ | ❌ |
| **Moderator Features** |
| Moderator Dashboard | ❌ | ❌ | ✅ `/moderator` | ❌ |
| Moderation Queue | ❌ | ❌ | ✅ | ❌ |
| Approve Content | ❌ | ❌ | ✅ | ❌ |
| Reject Content | ❌ | ❌ | ✅ | ❌ |
| **Admin Features** |
| Admin Dashboard | ❌ | ❌ | ❌ | ✅ `/admin` |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |
| Manage All Events | ❌ | ❌ | ❌ | ✅ |
| Edit Any Event | ❌ | ❌ | ❌ | ✅ |
| Delete Events | ❌ | ❌ | ❌ | ✅ |
| Manage Clubs | ❌ | ❌ | ❌ | ✅ |
| Delete Clubs | ❌ | ❌ | ❌ | ✅ |
| Pricing Settings | ❌ | ❌ | ❌ | ✅ |
| **Profile** |
| View Profile | ✅ | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ | ✅ |

---

## 9. Testing Execution Guide

### 9.1 Pre-Testing Setup

1. Prepare test accounts for each role:
   - Student account
   - Organizer account
   - Moderator account
   - Admin account
2. Seed database with sample data:
   - Events (upcoming, past, free, paid)
   - Clubs
   - Registrations
   - Services
   - Advertisements
3. Set up testing environment:
   - Test on Chrome, Firefox, Safari
   - Prepare mobile devices or emulators
   - Enable dark mode and light mode

### 9.2 Testing Workflow

1. **Start with STUDENT role**: Complete all student scenarios
2. **Move to ORGANIZER role**: Test organizer functionality
3. **Test MODERATOR role**: Verify moderation features
4. **Test ADMIN role**: Validate admin capabilities
5. **Cross-role testing**: Verify access controls and redirects
6. **UI/UX validation**: Check consistency across all roles
7. **Responsive testing**: Test on mobile, tablet, desktop
8. **Dark mode testing**: Toggle theme on all pages
9. **Accessibility check**: Keyboard nav, screen reader
10. **Performance check**: Page load times, interactions

### 9.3 Issue Reporting Template

When reporting issues, include:

1. **Role**: Which user role encountered the issue
2. **Page/Route**: Specific URL or page name
3. **Issue Type**: UI, UX, Functionality, Performance, Accessibility
4. **Description**: Clear description of the problem
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Steps to Reproduce**:
   - Step 1
   - Step 2
   - Step 3
8. **Screenshots**: Visual evidence of the issue
9. **Browser/Device**: Chrome 120 / iPhone 14 / etc.
10. **Dark Mode**: Yes/No
11. **Severity**: Critical, High, Medium, Low

### 9.4 Common Test Scenarios Per Role

#### STUDENT Scenario
1. Register new student account
2. Browse events and register for 2-3 events (free and paid)
3. Join 1-2 clubs
4. View My Registrations page
5. Check CSI Dashboard
6. Create a service listing
7. Test QR check-in scanner
8. Update profile
9. Logout and log back in

#### ORGANIZER Scenario
1. Login as organizer
2. View dashboard statistics
3. Create a new event
4. Edit an existing event
5. Export participant list
6. Display QR code for an event
7. Scan student tickets
8. View analytics
9. Logout

#### MODERATOR Scenario
1. Login as moderator
2. View moderation dashboard
3. Review pending services/events/ads
4. Approve 2-3 items
5. Reject 1 item with reason
6. Filter by status and type
7. Verify empty state when queue clear
8. Logout

#### ADMIN Scenario
1. Login as admin
2. View admin dashboard statistics
3. Manage users: search, filter, change role
4. Manage events: view, edit, delete
5. Manage clubs: view, edit, delete
6. Update pricing settings
7. Verify all quick actions work
8. Logout

### 9.5 Final Validation Checklist

Before marking testing complete, verify:

- [ ] All four roles tested thoroughly
- [ ] All routes accessible with correct permissions
- [ ] All forms validate and submit correctly
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] All buttons and links functional
- [ ] All images load correctly with fallbacks
- [ ] All toast notifications appear appropriately
- [ ] All modals open and close properly
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Dark mode works on all pages
- [ ] Light mode works on all pages
- [ ] Theme toggle persists across pages
- [ ] No console errors or warnings
- [ ] Loading states appear during data fetching
- [ ] Error states display user-friendly messages
- [ ] Empty states show helpful messaging
- [ ] Pagination works where implemented
- [ ] Search and filter functionality works
- [ ] Logout works and clears session
- [ ] Access control enforced (students can't access admin, etc.)
- [ ] Color consistency across all pages
- [ ] Typography hierarchy clear
- [ ] Spacing and alignment consistent
- [ ] Buttons have consistent styling
- [ ] Cards have uniform appearance
- [ ] Icons display correctly
- [ ] Badges use correct colors
- [ ] Hover states work on desktop
- [ ] Touch targets sized appropriately on mobile
- [ ] Keyboard navigation functional
- [ ] Focus indicators visible
- [ ] Alt text present on images
- [ ] Form labels associated with inputs
- [ ] Performance acceptable (pages load < 3s)
- [ ] No broken links
- [ ] No 404 errors

---

## 10. Conclusion

This comprehensive testing guide covers all aspects of the MNU Events platform frontend across four user roles. By following these scenarios systematically, testers can identify UI/UX inconsistencies, color mismatches, functional bugs, accessibility issues, and performance problems.

The testing process should be iterative: test, report issues, fix, retest. Maintain a living document of found issues with their status (Open, In Progress, Fixed, Verified).

For best results:
- Test with fresh eyes (different testers for different sections)
- Use real devices, not just emulators
- Test at different times of day (different network conditions)
- Have both technical and non-technical users test
- Prioritize critical flows (login, registration, payment)
- Don't skip edge cases (empty states, error states)
- Document everything with screenshots

By the end of testing, the platform should provide a consistent, polished, and intuitive experience for all user roles across all devices and themes.
