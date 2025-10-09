// Add this to your Homepage component to measure loading bottlenecks
// Place this at the top of your Homepage component

useEffect(() => {
  console.log('🚀 Homepage component mounted');
  const startTime = performance.now();
  
  return () => {
    const loadTime = performance.now() - startTime;
    console.log(`📊 Homepage component lifetime: ${loadTime.toFixed(2)}ms`);
  };
}, []);

useEffect(() => {
  if (actor) {
    console.log('🔧 Actor available at:', performance.now());
  }
}, [actor]);

useEffect(() => {
  if (isLoading) {
    console.log('⏳ Homepage query started at:', performance.now());
  } else {
    console.log('✅ Homepage query completed at:', performance.now());
    if (homepage?.entries) {
      console.log(`📝 Loaded ${homepage.entries.length} entries`);
    }
  }
}, [isLoading, homepage]);

// Also add this before your return statement
if (isLoading || !homepage) {
  console.log('🔄 Showing loading state at:', performance.now());
}