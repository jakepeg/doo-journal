# Notification Testing Instructions

## Current Status

- ✅ Backend notification timers are initialized
- ✅ Debug functions are available
- ⏳ You need to set up your profile with reminder settings

## Steps to Test Notifications:

### 1. Set Up Your Profile

1. Open the app: https://2tc4y-yyaaa-aaaah-qqfvq-cai.icp0.io/
2. Log in with Internet Identity
3. Go to Settings/Profile
4. Set up reminder settings:
   - **Enable reminders**: ON
   - **Day**: Wednesday (today is day 3 = Wednesday)
   - **Time**: Morning (current time is 9 AM, which matches morning slot)

### 2. Update Activity

Navigate around the app to update your activity status.

### 3. Test Notification Permission

When prompted, click "Allow" for notifications.

### 4. Manual Testing (Browser Console)

Open browser console (F12) and run:

```javascript
// Test notification permission
console.log("Notification permission:", Notification.permission);

// Request permission if needed
if (Notification.permission !== "granted") {
  Notification.requestPermission().then((permission) => {
    console.log("Permission result:", permission);
  });
}

// Test basic notification (after permission granted)
new Notification("Test Notification 🧪", {
  body: "This is a test notification!",
  icon: "/icons/192x192.png",
});
```

### 5. Debug Backend State

Run these commands in terminal:

```bash
# Check current time info
dfx canister call journal_backend getDebugTimeInfo --network ic

# Check notification debug info
dfx canister call journal_backend debugCheckNotification --network ic

# Update activity
dfx canister call journal_backend updateUserActivity --network ic

# Check for pending notifications
dfx canister call journal_backend checkPendingNotification --network ic
```

## Current Time Context

- **Current Hour**: 9 (9 AM)
- **Current Day**: 3 (Wednesday)
- **Time Slot**: Morning (9 AM matches the morning notification time)

This means if you set up reminders for Wednesday Morning, you should get notifications right now!

## Troubleshooting

- Check browser console for notification logs (look for `[Notifications]` prefix)
- Make sure browser notifications are enabled for the site
- Ensure you have a profile with `weeklyReminderSettings` configured
- Verify you're marked as "active" by navigating the app
