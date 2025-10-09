// Add this to your Homepage component to measure real loading times
useEffect(() => {
  const startTime = performance.now();
  
  // Measure when component is fully loaded
  const measureLoadTime = () => {
    const loadTime = performance.now() - startTime;
    console.log(`🚀 Homepage loaded in: ${loadTime.toFixed(2)}ms`);
    
    // Measure individual query times
    if (homepage) {
      console.log(`📊 Homepage query completed with ${homepage.entries?.length || 0} entries`);
    }
  };

  if (!isLoading) {
    measureLoadTime();
  }
}, [isLoading, homepage]);

// Also add this to measure network vs processing time
useEffect(() => {
  if (homepage?.entries) {
    const processingStart = performance.now();
    // Simulate the processing you're doing
    const processingTime = performance.now() - processingStart;
    console.log(`⚡ Entry processing took: ${processingTime.toFixed(2)}ms`);
  }
}, [homepage?.entries]);