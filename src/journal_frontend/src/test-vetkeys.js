// Test vetKeys import in isolation
console.log('Testing vetKeys import...');

try {
  // Try importing one piece at a time to isolate the issue
  import('@dfinity/vetkeys').then((vetkeys) => {
    console.log('✅ vetKeys import successful:', Object.keys(vetkeys));
  }).catch((error) => {
    console.error('❌ vetKeys import failed:', error);
  });
} catch (error) {
  console.error('❌ Synchronous import error:', error);
}