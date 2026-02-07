

# Implementation Plan: Username, Search, Ratings, Leaderboard, and Profile Hover Card

This is a large feature set with 5 interconnected pieces. Here is the full plan:

---

## 1. Database Changes (Migration)

### New columns on `user_profiles`:
- `username` (text, unique, nullable initially so existing users can set it later)
- `searchable_global` (boolean, default true) -- controls whether the user appears in global search or org-only

### New table: `user_ratings`
- `id` (uuid, primary key)
- `rater_id` (uuid, references auth.users)
- `rated_user_id` (uuid, references auth.users)
- `rating` (integer, 1-5)
- `match_id` (uuid) -- only allow rating people you've chatted with
- `created_at` (timestamptz)
- Unique constraint on (rater_id, rated_user_id) so each user can rate another only once (can update)

### New table: `user_activity`
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `session_date` (date)
- `minutes_spent` (integer, default 0)
- Unique constraint on (user_id, session_date)

### RLS Policies:
- `user_ratings`: Users can insert/update own ratings, everyone can read ratings (for leaderboard)
- `user_activity`: Users can insert/update own activity, everyone can read (for leaderboard)
- Add unique index on `user_profiles.username`

---

## 2. Username Feature

### Settings page (`src/pages/Settings.tsx`):
- Add a "Username" input field in the Account card
- Validate uniqueness in real-time (debounced check against DB)
- Save username alongside other settings
- Show `@username` format

### Onboarding (`src/pages/Onboarding.tsx`):
- Add an optional username field in Step 1 (Personal Info) so new users can set it during setup

---

## 3. User Search

### New component: `src/components/search/UserSearch.tsx`
- Search input in the homepage header area
- Searches `user_profiles` by `username` (partial match using `ilike`)
- Respects the `searchable_global` setting:
  - If the searched user has `searchable_global = false`, they only appear to users from the same organization
  - If `searchable_global = true`, they appear to everyone
- Shows results as a dropdown list with username, name, department, and organization
- Clicking a result opens their profile hover card / popup

### Homepage (`src/pages/Index.tsx`):
- Add a search icon/bar in the header next to the settings button

### Settings (`src/pages/Settings.tsx`):
- Add a "Searchable by Global Users" toggle (similar to the existing viewability toggle)

---

## 4. Chat Ratings

### Chat Window (`src/components/chat/ChatWindow.tsx`):
- Add a star rating component (1-5 stars) in the chat header area
- Users can rate the person they are chatting with
- Rating is saved to `user_ratings` table
- If already rated, show existing rating (editable)

### New component: `src/components/chat/RatingStars.tsx`
- Reusable star rating component (interactive + display modes)

---

## 5. Leaderboard

### New component: `src/components/leaderboard/LeaderboardBox.tsx`
- Shows top 5 users ranked by a composite score:
  - Average rating (from `user_ratings`)
  - Time spent on website (from `user_activity`)
- Formula: `score = (avg_rating * weight) + (total_minutes * weight)`
- Displays rank, username/name, score, and average rating
- Banner at the top: "The #1 user on the 8th of every month wins Rs. 5,000!"

### Activity Tracking:
- New hook: `src/hooks/useActivityTracker.ts`
- Tracks time spent on the website using `setInterval` (pings every minute)
- Upserts into `user_activity` table with today's date
- Runs in `Index.tsx` (the main app shell)

### Placement:
- Add the leaderboard box below the main tab content on the homepage (visible on all tabs)

---

## 6. Profile Hover Card (X/Twitter-style)

### New component: `src/components/profile/UserProfileCard.tsx`
- A hover card (using Radix HoverCard) that shows when hovering over a user's name
- Displays: name, username, bio, department, organization, interests, average rating, post count
- Shows the user's recent posts (respecting visibility rules -- org-only posts only visible to same-org users)
- Privacy-aware: if user has `searchable_global = false` and viewer is from a different org, the card won't show

### Integration points:
- `PostCard.tsx`: Wrap the author name with the hover card trigger (skip for anonymous posts)
- `Chat.tsx`: Wrap chat partner names with the hover card
- `UserSearch.tsx`: Search results link to hover card

### New API: `src/lib/profile-api.ts`
- `fetchUserProfile(userId, viewerId)`: Fetches profile data respecting privacy settings
- `fetchUserPosts(userId, viewerId)`: Fetches user's posts respecting visibility (org-only filtered)
- `fetchUserRating(userId)`: Gets average rating

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/components/search/UserSearch.tsx` | Search bar + results dropdown |
| `src/components/chat/RatingStars.tsx` | Star rating component |
| `src/components/leaderboard/LeaderboardBox.tsx` | Top 5 leaderboard widget |
| `src/components/profile/UserProfileCard.tsx` | Hover card for user profiles |
| `src/hooks/useActivityTracker.ts` | Tracks time spent on website |
| `src/lib/profile-api.ts` | Profile, posts, and rating fetch APIs |
| Migration SQL | Schema changes for username, ratings, activity |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add search bar, leaderboard box, activity tracker |
| `src/pages/Settings.tsx` | Add username input, searchable toggle |
| `src/pages/Onboarding.tsx` | Add optional username field |
| `src/components/feed/PostCard.tsx` | Wrap author name with profile hover card |
| `src/components/chat/ChatWindow.tsx` | Add rating stars |
| `src/pages/Chat.tsx` | Wrap chat partner names with hover card |

---

## Technical Notes

- Username uniqueness is enforced at the DB level (unique index) and validated in the UI before saving
- Activity tracking uses a lightweight approach -- increments a counter every 60 seconds via `setInterval`, batched into daily rows
- The leaderboard score combines ratings and activity using a weighted formula to prevent gaming by just keeping the tab open
- Profile hover cards lazy-load data only when the user hovers (no upfront cost)
- All privacy settings (searchable_global, viewability_global, org-only posts) are respected consistently across search, hover cards, and leaderboard

