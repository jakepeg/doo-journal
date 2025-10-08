import AccessControl "authorization/access-control";
import Registry "blob-storage/registry";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Timer "mo:base/Timer";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";

persistent actor Journal {
  // Principal-OrderedMap specialization
  type PrincipalMap<V> = OrderedMap.Map<Principal, V>;
  transient let PrincipalMapOps = OrderedMap.Make<Principal>(Principal.compare);

  // Transient state (recreated on upgrade)
  transient var accessControlState = AccessControl.initState();
  transient var registry = Registry.new();

  // Helper functions for content conversion
  private func _blobToText(blob : Blob) : Text {
    switch (Text.decodeUtf8(blob)) {
      case (?text) { text };
      case null { "" };
    };
  };

  // vetKD Management Canister Types
  type VetKdCurve = { #bls12_381_g2 };

  type VetKdKeyId = {
    curve : VetKdCurve;
    name : Text;
  };

  type VetKdDeriveKeyArgs = {
    context : Blob;
    input : Blob;
    key_id : VetKdKeyId;
    transport_public_key : Blob;
  };

  type VetKdPublicKeyArgs = {
    canister_id : ?Principal;
    context : Blob;
    key_id : VetKdKeyId;
  };

  type VetKdSystemApi = actor {
    vetkd_derive_key : (VetKdDeriveKeyArgs) -> async { encrypted_key : Blob };
    vetkd_public_key : (VetKdPublicKeyArgs) -> async { public_key : Blob };
  };

  // vetKD Infrastructure - Now Enabled!

  // Management canister actor for vetKD
  let vetKdSystemApi : VetKdSystemApi = actor ("aaaaa-aa");

  // Domain separator for this dapp - used to isolate keys per application
  let DOMAIN_SEPARATOR = "doo-journal-app";

  // Key name for this specific application - environment detection
  // Available keys per environment:
  // - Local: "dfx_test_key"
  // - Mainnet: "key_1", "test_key_1"
  private func getKeyName() : Text {
    // Simple environment detection based on canister ID pattern
    let selfPrincipal = Principal.fromActor(Journal);
    let selfText = Principal.toText(selfPrincipal);

    // Local dfx uses predictable patterns like "rdmx6-jaaaa-aaaaa-aaadq-cai"
    if (Text.contains(selfText, #text "jaaaa") and Text.contains(selfText, #text "aaaaa")) {
      "dfx_test_key" // Local development
    } else {
      "key_1" // Mainnet and other networks
    };
  }; // vetKD API functions for frontend

  /**
   * Get the public key for this canister's vetKD key
   * This is needed by the frontend to perform encryption
   */
  public shared ({ caller }) func getVetKdPublicKey() : async Blob {
    AccessControl.initialize(accessControlState, caller);

    let keyId : VetKdKeyId = {
      curve = #bls12_381_g2;
      name = getKeyName();
    };

    let args : VetKdPublicKeyArgs = {
      canister_id = null; // Use current canister
      context = Text.encodeUtf8(DOMAIN_SEPARATOR);
      key_id = keyId;
    };

    let result = await vetKdSystemApi.vetkd_public_key(args);
    result.public_key;
  };

  /**
   * Derive an encrypted key for a specific user and transport public key
   * This returns a key encrypted with the user's transport secret key
   */
  public shared ({ caller }) func deriveEncryptedKey(transportPublicKey : Blob, derivationInput : Blob) : async Blob {
    AccessControl.initialize(accessControlState, caller);

    let keyId : VetKdKeyId = {
      curve = #bls12_381_g2;
      name = getKeyName();
    };

    let args : VetKdDeriveKeyArgs = {
      context = Text.encodeUtf8(DOMAIN_SEPARATOR);
      input = derivationInput;
      key_id = keyId;
      transport_public_key = transportPublicKey;
    };

    let result = await vetKdSystemApi.vetkd_derive_key(args);
    result.encrypted_key;
  };

  /**
   * Legacy function for backward compatibility
   * Now returns user-specific derivation input for vetKD
   */
  public shared ({ caller }) func getUserEncryptionKey() : async Blob {
    AccessControl.initialize(accessControlState, caller);

    // Return the caller's principal as derivation input
    // This ensures each user gets a unique key derived from the same vetKD key
    Principal.toBlob(caller);
  };

  /**
   * Get IBE identity derivation for the calling user
   * Returns the user's principal as IBE identity - the actual IBE private key
   * will be derived on the frontend using the master public key
   */
  public shared ({ caller }) func getIBEIdentity() : async Blob {
    AccessControl.initialize(accessControlState, caller);

    // Return the caller's principal as IBE identity
    // This will be used with the master public key to derive the private key on frontend
    Principal.toBlob(caller);
  };

  // Types
  public type TimeSlot = {
    #morning; // 9:00 AM
    #afternoon; // 6:00 PM
  };

  public type WeeklyReminderSettings = {
    enabled : Bool;
    dayOfWeek : Nat8; // 0=Sunday, 1=Monday, etc.
    timeSlot : TimeSlot;
    timezone : ?Text; // Optional: "America/New_York", "Europe/London", etc. (null for backward compatibility)
  };

  public type UserProfile = {
    name : Text;
    bio : Text;
    profilePicture : ?Text;
    coverImage : ?Text;
    weeklyReminderSettings : ?WeeklyReminderSettings;
  };

  public type JournalEntry = {
    id : Text;
    title : Text;
    content : Text;
    isPublic : Bool;
    timestamp : Int;
    date : Int;
    imagePath : ?Text;
  };

  // Stable state - persists through canister upgrades
  var userProfiles : PrincipalMap<UserProfile> = PrincipalMapOps.empty<UserProfile>();
  var journalEntries : PrincipalMap<[JournalEntry]> = PrincipalMapOps.empty<[JournalEntry]>();

  // Stable storage for transient state (for upgrade preservation)
  var accessControlStable : [(Principal, AccessControl.UserRole)] = [];
  var registryStable : [(Text, Registry.FileReference)] = [];

  // Migration: Handle deprecated KEY_NAME stable variable (unused but keeps compatibility)
  var _deprecatedKeyName : ?Text = null;

  // Activity tracking (transient state)
  transient var activeUsers = HashMap.HashMap<Principal, Int>(16, Principal.equal, Principal.hash);
  transient var notificationTimers : ?Timer.TimerId = null;

  // ---- Access control ----
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.initialize(accessControlState, caller);
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ---- Profiles ----
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    PrincipalMapOps.get(userProfiles, caller);
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    PrincipalMapOps.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    AccessControl.initialize(accessControlState, caller);
    userProfiles := PrincipalMapOps.put(userProfiles, caller, profile);
  };

  // ---- Journal entries ----
  public shared ({ caller }) func createJournalEntry(
    title : Text,
    content : Text,
    isPublic : Bool,
    date : Int,
    imagePath : ?Text,
  ) : async Text {
    AccessControl.initialize(accessControlState, caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create journal entries");
    };

    // Hard guard: prevent storing extremely large inline content (e.g., massive base64 images)
    // IC query reply limit is 3,145,728 bytes; keeping single entry well below this helps aggregates.
    let maxStoreBytes : Nat = 2_000_000; // ~2MB ceiling for raw Text bytes
    if (Text.size(content) > maxStoreBytes) {
      Debug.trap("Entry content too large (" # debug_show (Text.size(content)) # " bytes). Please use smaller images or externalize them.");
    };

    let entryId = Text.concat("entry-", debug_show (Time.now()));
    let newEntry : JournalEntry = {
      id = entryId;
      title;
      content;
      isPublic;
      timestamp = Time.now();
      date;
      imagePath;
    };

    let existingEntries = PrincipalMapOps.get(journalEntries, caller);
    let updatedEntries = switch (existingEntries) {
      case null { [newEntry] };
      case (?entries) { Array.append(entries, [newEntry]) };
    };

    journalEntries := PrincipalMapOps.put(journalEntries, caller, updatedEntries);
    entryId;
  };

  public shared ({ caller }) func updateJournalEntry(
    entryId : Text,
    title : Text,
    content : Text,
    isPublic : Bool,
    date : Int,
    imagePath : ?Text,
  ) : async () {
    AccessControl.initialize(accessControlState, caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update journal entries");
    };

    // Same size guard as create
    let maxStoreBytes : Nat = 2_000_000;
    if (Text.size(content) > maxStoreBytes) {
      Debug.trap("Updated content too large (" # debug_show (Text.size(content)) # " bytes). Please reduce size.");
    };

    let entries = PrincipalMapOps.get(journalEntries, caller);
    switch (entries) {
      case null { Debug.trap("No entries found") };
      case (?userEntries) {
        let updatedEntries = Array.map<JournalEntry, JournalEntry>(
          userEntries,
          func(entry : JournalEntry) : JournalEntry {
            if (entry.id == entryId) {
              {
                id = entryId;
                title;
                content;
                isPublic;
                timestamp = Time.now();
                date;
                imagePath;
              };
            } else { entry };
          },
        );
        journalEntries := PrincipalMapOps.put(journalEntries, caller, updatedEntries);
      };
    };
  };

  public shared ({ caller }) func deleteJournalEntry(entryId : Text) : async () {
    AccessControl.initialize(accessControlState, caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete journal entries");
    };

    let entries = PrincipalMapOps.get(journalEntries, caller);
    switch (entries) {
      case null { Debug.trap("No entries found") };
      case (?userEntries) {
        let filteredEntries = Array.filter<JournalEntry>(
          userEntries,
          func(entry : JournalEntry) : Bool { entry.id != entryId },
        );
        journalEntries := PrincipalMapOps.put(journalEntries, caller, filteredEntries);
      };
    };
  };

  // ---- Queries for journal entries ----
  public query ({ caller }) func getAllJournalEntries() : async [JournalEntry] {
    let entries = PrincipalMapOps.get(journalEntries, caller);
    switch (entries) {
      case null { [] };
      case (?userEntries) { userEntries };
    };
  };

  public query func getJournalEntryById(user : Principal, entryId : Text) : async ?JournalEntry {
    let entries = PrincipalMapOps.get(journalEntries, user);
    switch (entries) {
      case null { null };
      case (?userEntries) {
        Array.find(userEntries, func(entry : JournalEntry) : Bool { entry.id == entryId });
      };
    };
  };

  public query func getPublicJournalEntries(user : Principal) : async [JournalEntry] {
    let entries = PrincipalMapOps.get(journalEntries, user);
    switch (entries) {
      case null { [] };
      case (?userEntries) {
        Array.filter(userEntries, func(entry : JournalEntry) : Bool { entry.isPublic });
      };
    };
  };

  // ---- File registry passthroughs ----
  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    AccessControl.initialize(accessControlState, caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can register file references");
    };
    Registry.add(registry, path, hash);
  };

  public query func getFileReference(path : Text) : async Registry.FileReference {
    Registry.get(registry, path);
  };

  public query func listFileReferences() : async [Registry.FileReference] {
    Registry.list(registry);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    AccessControl.initialize(accessControlState, caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can drop file references");
    };
    Registry.remove(registry, path);
  };

  // ---- Aggregates ----
  public query func getUserHomepage(user : Principal) : async {
    profile : ?UserProfile;
    publicEntries : [JournalEntry];
  } {
    let profile = PrincipalMapOps.get(userProfiles, user);
    let entries = PrincipalMapOps.get(journalEntries, user);
    let publicEntries = switch (entries) {
      case null { [] };
      case (?userEntries) {
        Array.filter(userEntries, func(entry : JournalEntry) : Bool { entry.isPublic });
      };
    };
    { profile; publicEntries };
  };

  public query ({ caller }) func getOwnHomepage() : async {
    profile : ?UserProfile;
    entries : [JournalEntry];
  } {
    let profile = PrincipalMapOps.get(userProfiles, caller);
    let entries = PrincipalMapOps.get(journalEntries, caller);
    let allEntries = switch (entries) {
      case null { [] };
      case (?userEntries) { userEntries };
    };
    // Truncate overly large contents for this aggregate query to avoid exceeding reply size limits.
    let perEntryTruncateBytes : Nat = 50_000; // ~50KB preview per entry keeps list lightweight

    func truncateText(t : Text) : Text {
      if (Text.size(t) <= perEntryTruncateBytes) { t } else {
        // Build truncated text safely by iterating chars up to limit
        let arr = Text.toArray(t);
        if (arr.size() <= perEntryTruncateBytes) { t } else {
          let slice = Array.subArray<Char>(arr, 0, perEntryTruncateBytes);
          Text.concat(Text.fromArray(slice), "...[truncated]");
        };
      };
    };

    // Map entries applying truncation only if needed
    let truncatedEntries = Array.map<JournalEntry, JournalEntry>(
      allEntries,
      func(e : JournalEntry) : JournalEntry {
        if (Text.size(e.content) > perEntryTruncateBytes) {
          {
            id = e.id;
            title = e.title;
            content = truncateText(e.content);
            isPublic = e.isPublic;
            timestamp = e.timestamp;
            date = e.date;
            imagePath = e.imagePath;
          };
        } else { e };
      },
    );

    { profile; entries = truncatedEntries };
  };

  public query func getCoverImagePath(user : Principal) : async ?Text {
    let profile = PrincipalMapOps.get(userProfiles, user);
    switch (profile) {
      case null { null };
      case (?userProfile) { userProfile.coverImage };
    };
  };

  public query func getPublicJournalEntryWithProfile(
    user : Principal,
    entryId : Text,
  ) : async ?{ entry : JournalEntry; profile : UserProfile } {
    let entries = PrincipalMapOps.get(journalEntries, user);
    let profile = PrincipalMapOps.get(userProfiles, user);

    switch (entries, profile) {
      case (?userEntries, ?userProfile) {
        let entry = Array.find(
          userEntries,
          func(e : JournalEntry) : Bool {
            e.id == entryId and e.isPublic
          },
        );
        switch (entry) {
          case (?publicEntry) {
            ?{ entry = publicEntry; profile = userProfile };
          };
          case null { null };
        };
      };
      case _ { null };
    };
  };

  // ---- Activity Tracking & Notifications ----

  // Update user activity timestamp
  public shared ({ caller }) func updateUserActivity() : async () {
    activeUsers.put(caller, Time.now());
  };

  // Check if user is currently active (within 5 minutes)
  private func isUserActive(principal : Principal) : Bool {
    switch (activeUsers.get(principal)) {
      case (?lastSeen) {
        let now = Time.now();
        let fiveMinutesInNanoseconds : Int = 5 * 60 * 1000 * 1000 * 1000; // 5 minutes in nanoseconds
        (now - lastSeen) < fiveMinutesInNanoseconds;
      };
      case null { false };
    };
  };

  // Get current day of week (0=Sunday, 1=Monday, etc.)
  private func getCurrentDayOfWeek() : Nat8 {
    let now = Time.now();
    let secondsSinceEpoch = now / 1000000000; // Convert nanoseconds to seconds
    let daysSinceEpoch = secondsSinceEpoch / 86400; // 86400 seconds in a day
    let dayOfWeek = (daysSinceEpoch + 4) % 7; // Epoch was Thursday (4), so adjust
    let dayOfWeekNat = Int.abs(dayOfWeek);
    if (dayOfWeekNat < 256) {
      Nat8.fromNat(dayOfWeekNat);
    } else { 0 };
  };

  // Get current hour (0-23)
  private func getCurrentHour() : Nat8 {
    let now = Time.now();
    let secondsSinceEpoch = now / 1000000000;
    let secondsInDay = secondsSinceEpoch % 86400;
    let currentHour = secondsInDay / 3600;
    let hourNat = Int.abs(currentHour);
    if (hourNat < 256) {
      Nat8.fromNat(hourNat);
    } else { 0 };
  };

  // Check if it's time for reminders based on time slot
  private func isReminderTime(timeSlot : TimeSlot) : Bool {
    let currentHour = getCurrentHour();
    switch (timeSlot) {
      case (#morning) { currentHour == 9 }; // 9 AM
      case (#afternoon) { currentHour == 18 }; // 6 PM
    };
  };

  // Process reminders for active users
  private func processActiveUserReminders() : async () {
    let currentDay = getCurrentDayOfWeek();

    for ((principal, profile) in PrincipalMapOps.entries(userProfiles)) {
      switch (profile.weeklyReminderSettings) {
        case (?settings) {
          if (
            settings.enabled and
            settings.dayOfWeek == currentDay and
            isReminderTime(settings.timeSlot) and
            isUserActive(principal)
          ) {

            // Send notification to active user
            // For now, we'll just log it - frontend will poll for notifications
            Debug.print("Notification due for user: " # Principal.toText(principal));
          };
        };
        case null {};
      };
    };
  };

  // Check if user has pending notification
  public shared query ({ caller }) func checkPendingNotification() : async Bool {
    switch (PrincipalMapOps.get(userProfiles, caller)) {
      case (?profile) {
        switch (profile.weeklyReminderSettings) {
          case (?settings) {
            if (
              settings.enabled and
              settings.dayOfWeek == getCurrentDayOfWeek() and
              isReminderTime(settings.timeSlot)
            ) {
              true;
            } else { false };
          };
          case null { false };
        };
      };
      case null { false };
    };
  };

  // Debug function to get current time info
  public query func getDebugTimeInfo() : async {
    currentHour : Nat8;
    currentDay : Nat8;
    currentTimestamp : Int;
  } {
    {
      currentHour = getCurrentHour();
      currentDay = getCurrentDayOfWeek();
      currentTimestamp = Time.now();
    };
  };

  // Debug function to manually trigger notification check
  public shared ({ caller }) func debugCheckNotification() : async {
    hasProfile : Bool;
    hasSettings : Bool;
    settingsEnabled : Bool;
    dayMatches : Bool;
    timeMatches : Bool;
    isActive : Bool;
    result : Bool;
  } {
    switch (PrincipalMapOps.get(userProfiles, caller)) {
      case (?profile) {
        switch (profile.weeklyReminderSettings) {
          case (?settings) {
            let currentDay = getCurrentDayOfWeek();
            let isRemTime = isReminderTime(settings.timeSlot);
            let active = isUserActive(caller);
            {
              hasProfile = true;
              hasSettings = true;
              settingsEnabled = settings.enabled;
              dayMatches = settings.dayOfWeek == currentDay;
              timeMatches = isRemTime;
              isActive = active;
              result = settings.enabled and settings.dayOfWeek == currentDay and isRemTime and active;
            };
          };
          case null {
            {
              hasProfile = true;
              hasSettings = false;
              settingsEnabled = false;
              dayMatches = false;
              timeMatches = false;
              isActive = isUserActive(caller);
              result = false;
            };
          };
        };
      };
      case null {
        {
          hasProfile = false;
          hasSettings = false;
          settingsEnabled = false;
          dayMatches = false;
          timeMatches = false;
          isActive = false;
          result = false;
        };
      };
    };
  };

  // System health monitoring for upgrade verification
  public query func getSystemHealth() : async {
    totalUsers : Nat;
    totalEntries : Nat;
    totalFiles : Nat;
    accessControlUsers : Nat;
  } {
    let entryCount = Array.foldLeft<(Principal, [JournalEntry]), Nat>(
      Iter.toArray(PrincipalMapOps.entries(journalEntries)),
      0,
      func(acc, (_, entries)) = acc + entries.size(),
    );

    {
      totalUsers = PrincipalMapOps.size(userProfiles);
      totalEntries = entryCount;
      totalFiles = Registry.size(registry);
      accessControlUsers = Array.foldLeft<(Principal, AccessControl.UserRole), Nat>(
        Iter.toArray(AccessControl.getEntries(accessControlState)),
        0,
        func(acc, _) = acc + 1,
      );
    };
  };

  // Initialize timers (called after deployment)
  public func initializeNotificationTimers() : async () {
    // Set up recurring timer to check every hour
    notificationTimers := ?Timer.recurringTimer<system>(
      #seconds(3600), // Check every hour
      func() : async () { await processActiveUserReminders() },
    );
  };

  // System functions for canister lifecycle
  system func preupgrade() {
    Debug.print("🔄 [Pre-upgrade] Preserving user data...");

    // Cancel timers
    switch (notificationTimers) {
      case (?timerId) { Timer.cancelTimer(timerId) };
      case null {};
    };

    // Preserve transient state to stable storage
    accessControlStable := Iter.toArray(AccessControl.getEntries(accessControlState));
    registryStable := Registry.toStableFormat(registry);

    // Log preservation stats
    let userCount = PrincipalMapOps.size(userProfiles);
    let entryCount = Array.foldLeft<(Principal, [JournalEntry]), Nat>(
      Iter.toArray(PrincipalMapOps.entries(journalEntries)),
      0,
      func(acc, (_, entries)) = acc + entries.size(),
    );

    Debug.print(
      "✅ [Pre-upgrade] Preserved " # Nat.toText(userCount) # " users, " #
      Nat.toText(entryCount) # " entries, " # Nat.toText(registryStable.size()) # " files"
    );
  };

  system func postupgrade() {
    Debug.print("🔄 [Post-upgrade] Restoring user data...");

    // Restore transient state from stable storage
    AccessControl.fromStableEntries(accessControlState, accessControlStable);
    Registry.fromStableFormat(registry, registryStable);

    // Clear temporary stable data after restoration
    accessControlStable := [];
    registryStable := [];

    Debug.print("✅ [Post-upgrade] Data restoration complete");

    // Recreate timers after upgrade
    ignore Timer.setTimer<system>(
      #seconds(1),
      func() : async () { await initializeNotificationTimers() },
    );
  };
};
