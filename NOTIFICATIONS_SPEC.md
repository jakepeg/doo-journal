# Doo Journal Notifications Feature Spec

## Overview

Add a simple weekly notification system to encourage regular journaling habits in the Doo Journal app. Users can configure a single weekly reminder through their profile settings.

---

## Requirements

### User Story

As a Doo Journal user, I want to receive a weekly reminder notification so that I maintain a consistent journaling habit.

### Acceptance Criteria

- ✅ User can enable/disable weekly reminders in their profile
- ✅ User can choose day of week (Monday - Sunday) and time slot (Morning 9AM or Afternoon 6PM)
- ✅ Notification displays:
  > "Hey! Hope you're having a nice week. Make sure your journal is up to date!"
- ✅ Clicking notification opens journal create entry page (`/add-entry`)
- ✅ Settings persist across sessions and canister upgrades
- ✅ Works in PWA mode (installed app)
- ✅ Follows existing Doo Journal architecture patterns
- ✅ Make the feature easy to remove, upgrade or replace (with a more advanced version) later

---

## Technical Design

### 1. Backend Changes (Motoko)

- **Update `UserProfile` Type** – `main.mo`
  - Add `weeklyReminderSettings: ?WeeklyReminderSettings`
- **New Types**:

  ```motoko
  public type TimeSlot = {
    #morning;   // 9:00 AM
    #afternoon; // 6:00 PM
  };

  public type WeeklyReminderSettings = {
    enabled: Bool;
    dayOfWeek: Nat8; // 0=Sunday, 1=Monday, etc.
    timeSlot: TimeSlot;
  };
  ```

- **Active User Tracking** – Track user activity/session state
- **Timer Integration** – Use ICP's timer functionality for scheduled reminders
- **Direct Notifications** – Send notifications to active users via canister messages

### 2. Frontend Changes

- **Update Profile Hook** – `src/hooks/useProfile.ts`
- **New Component** – `src/components/WeeklyReminderSection.tsx`
  - Integrated into profile edit form
  - Simple UI: Toggle + Day selector + Morning/Afternoon radio buttons
  - Uses existing `shadcn/ui` components (`Switch`, `Card`, `Label`, `RadioGroup`)
  - Handles browser notification permissions
- **Update Profile Edit Route** – `src/routes/profile/edit.tsx`
  - Add `<WeeklyReminderSection />` component to existing form
  - Include reminder settings in profile update
  - No routing changes needed
- **Activity Tracking** – `src/hooks/useActivityTracker.ts`
  - Send periodic heartbeat to backend when app is active
  - Handle visibility change events
  - Manage user session state

### 3. PWA Enhancement

- **Service Worker Update** – `sw.js` (Now fully supported on ICP)
  - Handle direct notification display for active users
  - Handle notification clicks to open `/add-entry`
  - No push event handling needed (active users only)

---

## Implementation Plan

**Phase 1: Active User Notifications** (Simplified Implementation)

- Update `UserProfile` and `WeeklyReminderSettings` types in `main.mo`
- Add user activity tracking and session management
- Implement ICP timer-based scheduling for active users
- Create `WeeklyReminderSection` component with morning/afternoon selection
- Create `useActivityTracker` hook for heartbeat functionality
- Test notifications for users with app currently open
- Deploy and verify active user notifications work

**Phase 2: Push for Closed Apps** (Enhanced Coverage)

- Add `PushSubscription` storage to backend
- Add HTTPS outcalls to Web Push services (FCM, Mozilla, APNS)
- Handle push subscription lifecycle in frontend
- Extend timer system to cover inactive users
- Test reliable notifications for closed apps

**Phase 3: Enhanced Features**

- Add timezone support using user's browser timezone
- Implement notification analytics and delivery tracking
- Add smart scheduling (skip if user already journaled)
- Enhanced time slots (early morning, lunch, evening, custom)

**Phase 4: Testing & Polish**

- Cross-browser testing (Chrome, Firefox, Safari)
- Test PWA installation and background notifications
- Verify canister upgrade preserves settings and subscriptions
- Test push notification delivery across different scenarios
- User acceptance testing

---

## Technical Decisions

### Why Integrate with Profile?

- Follows existing patterns: Uses established `UserProfile` type + `useProfile` hook
- Single source of truth: No separate notification state
- Stable storage: Automatic persistence via `userProfiles` Map
- Role compatibility: Works with existing access control system
- Push subscriptions tied to user identity for proper targeting

### Why ICP Over External Push Services?

- **Decentralization**: Aligns with Web3 principles, no Big Tech dependencies
- **Data Sovereignty**: User notification preferences stay on-chain
- **Cost Predictability**: ICP cycles vs. unpredictable external service costs
- **Integration**: Native support for IC identity and canister communication
- **Reliability**: ICP's consensus mechanism ensures scheduled tasks execute

### Why Two-Phase Implementation?

- **User Feedback**: Phase 1 lets us validate UX before complex infrastructure
- **Risk Mitigation**: Client-side approach provides immediate fallback
- **Resource Optimization**: Focus development effort on proven user demand
- **Testing Strategy**: Easier to debug client-side issues before adding server complexity

### Why Active Users First?

- **Simpler Implementation**: No HTTP outcalls or push subscriptions needed
- **Cost Efficient**: Avoids cycle costs for external API calls
- **Immediate Value**: Works for most engaged users (those with app open)
- **Faster Testing**: Quick to implement and verify functionality
- **Progressive Enhancement**: Can add closed-app notifications later if needed

### Why ICP Timers + Activity Tracking?

- **Reliable Scheduling**: ICP timers ensure consistent reminder timing
- **Real-time Detection**: Active user tracking identifies who can receive notifications
- **Efficient Targeting**: Only notifies users who can actually see the notification
- **Battery Friendly**: No background push for inactive users
- **Cost Optimized**: Minimal cycle usage for maximum user value

### Why Morning/Afternoon Time Slots?

- **Simplified UX**: No complex time picking - just two intuitive choices
- **Kid-Friendly**: Morning (start the day) vs Afternoon (after school/activities)
- **Efficient Processing**: Only 2 timer slots needed per day (9AM, 6PM)
- **Better Adoption**: Lower cognitive load increases user engagement
- **Universal Appeal**: Works across timezones without complex calculations
- **Future Expandable**: Can add more slots (lunch, evening) if needed

### Why Weekly vs Daily?

- Less intrusive, habit-forming without annoyance
- Kid-friendly frequency
- Simpler logic: avoids complex timezone/frequency handling
- Better battery life (fewer background processes)

---

## Future Enhancements

- **Push Notifications for Closed Apps**

  - Add HTTP outcalls to external push services
  - Push subscription management and lifecycle
  - Delivery confirmation and retry logic
  - Background notification delivery for inactive users

- **Smart Scheduling**

  - Skip notifications if user already journaled that day
  - Adaptive timing based on user's most active hours
  - Streak-based motivation messages
  - Holiday/special date customization

- **Enhanced User Experience**

  - Multiple reminder types (daily, bi-weekly, custom days)
  - Rich notification content with journal prompts
  - Notification categories (reminders, streaks, celebrations)
  - Integration with device notification preferences

- **ICP Ecosystem Integration**
  - Cross-canister notifications for related dApps
  - Identity-based notification preferences across IC apps
  - Decentralized notification reputation system

---

## Testing Strategy

### User Acceptance Tests

- Complete user journey:  
  enable → configure → receive notification → click → open journal
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile PWA functionality

---

## Success Metrics

- Users can successfully enable weekly reminders
- Notifications appear at configured time
- Clicking notifications opens journal entries
- Settings persist across app restarts
- No regression in existing profile functionality
