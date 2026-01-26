/**
 * Global Jest Teardown
 * Ensures all async resources are properly cleaned up
 */
module.exports = async () => {
  // Give workers time to close gracefully
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
};
