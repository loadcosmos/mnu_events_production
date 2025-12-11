# Translation Implementation Status & Remaining Tasks

## ✅ COMPLETED

### 1. Translation Files Updated
- ✅ `frontend/js/i18n/locales/en.json` - Added all missing keys
- ✅ `frontend/js/i18n/locales/ru.json` - Added Russian translations
- ✅ `frontend/js/i18n/locales/kz.json` - Added Kazakh translations

**New Translation Namespaces Added:**
- `home.*` - Homepage elements (learnMore, viewAllEvents, trendingThisWeek, etc.)
- `profile.*` - Extended with shareProfile, myStats, language settings, etc.
- `clubs.*` - Club-related terms (studentClubs, organizer, clubStatistics, etc.)
- `services.*` - Marketplace/Services terms (perSession, contact, provider, etc.)
- `categories.*` - Event category translations (ACADEMIC, SPORTS, CULTURAL, etc.)
- `roles.*` - User role translations (STUDENT, FACULTY, ORGANIZER, etc.)

### 2. Critical Bug Fixed
- ✅ **ProfilePage Language Selector** - Fixed non-functional language dropdown
  - Replaced local state `selectedLanguage` with working `LanguageSelector` component
  - Added `useTranslation` hook
  - Language changes now properly update the entire app

---

## 🔧 REMAINING TASKS

### Priority 1: Homepage Components (High Impact)

#### File: `frontend/js/pages/home/HeroSlider.jsx`
**Lines to Update:**
- Line 128: `Learn More` → `{t('home.learnMore')}`
- Line 135: `View All Events` → `{t('home.viewAllEvents')}`
- Line 104: Category badge → `{t(\`categories.${event.category}\`)}`

**Required Changes:**
```jsx
// Add import at top
import { useTranslation } from 'react-i18next';

// Inside component
const { t } = useTranslation();

// Update buttons
<button>{t('home.learnMore')}</button>
<Link to="/events">{t('home.viewAllEvents')}</Link>

// Update category badge
<span>{t(`categories.${event.category}`)}</span>
```

#### File: `frontend/js/pages/home/EventsHorizontalScroll.jsx`
**Line to Update:**
- Line 177: `View All Events` → `{t('home.viewAllEvents')}`

#### File: `frontend/js/pages/HomePage.jsx`
**Lines to Update:**
- Line 302-303: `"Trending"` and `"This Week"` → Use `t('home.trendingThisWeek')`
- Line 304: `"Most popular events..."` → `{t('home.mostPopularEvents')}`

---

### Priority 2: ProfilePage Translations (Medium Impact)

#### File: `frontend/js/pages/student/ProfilePage.jsx`
**Already has `useTranslation` hook ✅**

**Lines to Update:**
1. **Line 308:** `Edit Profile` → `{t('profile.editProfile')}`
2. **Line 315:** `Share Profile` → `{t('profile.shareProfile')}`
3. **Line 332:** `Overview` → `{t('profile.overview')}`
4. **Line 339:** `Saved` → `{t('profile.saved')}`
5. **Line 346:** `Settings` → `{t('profile.settings')}`
6. **Line 363:** `My Stats` → `{t('profile.myStats')}`
7. **Line 371:** `Events Attended` → `{t('profile.eventsAttended')}`
8. **Line 378:** `Upcoming Events` → `{t('profile.upcomingEvents')}`
9. **Line 385:** `Clubs Joined` → `{t('profile.clubsJoined')}`
10. **Line 395:** `Gamification Progress` → `{t('profile.gamificationProgress')}`
11. **Line 405:** `Quick Access` → `{t('profile.quickAccess')}`
12. **Line 419:** `My Registrations` → `{t('profile.myRegistrations')}`
13. **Line 421:** Description → `{t('profile.viewManageRegistrations')}`
14. **Line 437:** `CSI Statistics` → `{t('profile.csiStatistics')}`
15. **Line 439:** Description → `{t('profile.viewCsiProgress')}`
16. **Line 452:** `My Interests` → `{t('profile.myInterests')}`
17. **Line 466:** `Saved Events` → `{t('saved.savedEvents')}`
18. **Line 480:** `Settings` → `{t('profile.settings')}`
19. **Line 512:** `Notifications` → `{t('profile.notifications')}`
20. **Line 513:** Description → `{t('profile.manageNotifications')}`
21. **Line 528:** `Privacy & Security` → `{t('profile.privacySecurity')}`
22. **Line 529:** Description → `{t('profile.controlPrivacy')}`
23. **Line 544:** `About & Help` → `{t('profile.aboutHelp')}`
24. **Line 545:** Description → `{t('profile.getHelp')}`
25. **Line 563:** `Logout` → `{t('auth.logout')}`
26. **Line 564:** Description → `{t('profile.signOutAccount')}`
27. **Line 286:** Role badge → `{t(\`roles.${user.role}\`)}`

---

### Priority 3: Role-Based Button Visibility (Critical for Faculty)

#### File: `frontend/js/pages/student/ProfilePage.jsx`
**Hide "My Registrations" for Faculty:**

```jsx
// Around line 408-425, wrap the "My Registrations" link with conditional:
{currentUser?.role === 'STUDENT' && (
  <Link to="/registrations" ...>
    ...My Registrations...
  </Link>
)}
```

#### File: `frontend/js/components/Layout.jsx` or Service Creation Pages
**Hide "Create Service" button for Faculty:**
- Find where "Create Service" button is rendered
- Add condition: `{user?.role !== 'FACULTY' && <button>Create Service</button>}`

---

### Priority 4: Category & Badge Translations

#### Files to Update:
1. **EventCard.jsx** - Category badges
2. **EventDetailsPage.jsx** - Category display
3. **EventsPage.jsx** - Filter categories
4. **ClubCard.jsx** - Category badges

**Pattern to use:**
```jsx
// Instead of: {event.category}
// Use: {t(`categories.${event.category}`)}

// For role badges:
// Instead of: {user.role}
// Use: {t(`roles.${user.role}`)}
```

---

### Priority 5: Fix "events.time" Bug

#### File: Search for files containing "events.time"
```bash
grep -r "events.time" frontend/js/
```

**Expected Issue:**
- Literal string "events.time" being displayed instead of actual time
- Should be using `t('events.time')` or proper time formatting

---

### Priority 6: Clubs Page Translations

#### File: `frontend/js/pages/clubs/ClubDetailsPage.jsx` (or similar)
**Terms to translate:**
- "Student Clubs" → `{t('clubs.studentClubs')}`
- "Organizer" → `{t('clubs.organizer')}`
- "Club Statistics" → `{t('clubs.clubStatistics')}`
- "Members" → `{t('clubs.members')}`
- "Categories" → `{t('clubs.categories')}`
- "Created" → `{t('clubs.created')}`

---

### Priority 7: Services/Marketplace Translations

#### Files: Service-related components
**Terms to translate:**
- "per session" → `{t('services.perSession')}`
- "Contact" → `{t('services.contact')}`
- "Safe Transaction" → `{t('services.safeTransaction')}`
- "Provider" → `{t('services.provider')}`
- "Create Service" → `{t('services.createService')}`

---

## 📝 IMPLEMENTATION CHECKLIST

### For Each Component:
1. [ ] Add import: `import { useTranslation } from 'react-i18next';`
2. [ ] Add hook: `const { t } = useTranslation();`
3. [ ] Replace hardcoded strings with `t('namespace.key')`
4. [ ] Test language switching in browser
5. [ ] Verify all three languages (EN/RU/KZ)

### Testing Steps:
1. Open the app in browser
2. Navigate to Profile → Settings
3. Switch between EN/RU/KZ using the language selector
4. Verify all text updates correctly
5. Check each page: Home, Events, Community, Clubs, Profile, Services

---

## 🐛 KNOWN ISSUES TO FIX

1. **"events.time" literal bug** - Find and fix where this translation key is being displayed as text
2. **Filter categories not translated** - Database values need translation mapping
3. **Footer not translated** - If footer exists, add translations
4. **Faculty role restrictions:**
   - Hide "My Registrations" button
   - Hide "Create Service" button
   - Show "Access Denied" message is already working

---

## 🎯 QUICK WIN: Most Visible Changes

To get the most visible improvements quickly, prioritize:
1. ✅ **ProfilePage language selector** (DONE)
2. **HeroSlider buttons** (Homepage hero section)
3. **ProfilePage all labels** (Settings page)
4. **Category badges** (Visible everywhere)
5. **Role badges** (Profile pages)

---

## 📚 Translation Key Reference

### Common Patterns:
```jsx
// Simple translation
{t('namespace.key')}

// With variables
{t('events.ticketsLeft', { count: 5 })}

// Dynamic keys (categories, roles)
{t(`categories.${event.category}`)}
{t(`roles.${user.role}`)}

// Pluralization
{t('events.showingEvents', { count: events.length })}
```

### Available Namespaces:
- `nav.*` - Navigation items
- `auth.*` - Authentication
- `events.*` - Events
- `posts.*` - Posts/Community
- `profile.*` - Profile
- `onboarding.*` - Onboarding wizard
- `saved.*` - Saved items
- `common.*` - Common UI elements
- `community.*` - Community page
- `home.*` - Homepage
- `clubs.*` - Clubs
- `services.*` - Services/Marketplace
- `categories.*` - Event categories
- `roles.*` - User roles

---

**Last Updated:** 2025-12-11
**Status:** Translation files complete, ProfilePage language selector fixed, remaining components need updates
