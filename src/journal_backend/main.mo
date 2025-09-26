import AccessControl "authorization/access-control";
import Registry "blob-storage/registry";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";

persistent actor Journal {
  // Principal-OrderedMap specialization
  type PrincipalMap<V> = OrderedMap.Map<Principal, V>;
  transient let PrincipalMapOps = OrderedMap.Make<Principal>(Principal.compare);

  // Transient state (recreated on upgrade)
  transient var accessControlState = AccessControl.initState();
  transient var registry = Registry.new();

  // Types
  public type UserProfile = {
    name : Text;
    bio : Text;
    profilePicture : ?Text;
    coverImage : ?Text;
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

  // Stable state
  var userProfiles : PrincipalMap<UserProfile> = PrincipalMapOps.empty<UserProfile>();
  var journalEntries : PrincipalMap<[JournalEntry]> = PrincipalMapOps.empty<[JournalEntry]>();

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
    { profile; entries = allEntries };
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
};
