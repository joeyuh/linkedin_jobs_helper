// content.js - This script will modify the LinkedIn Jobs page based on user settings.
chrome.storage.sync.get(null, (settings) => {
    // Use the settings to apply regex rules and modify job cards accordingly.
    // You can iterate over job cards, fetch full descriptions when needed, and then:
    // - Hide the job card,
    // - Change its background color,
    // - Or highlight specific text based on the configured regex.
    console.log("Settings loaded in content script:", settings);
    
    // Example: Find all job cards (adjust selector as needed)
    const jobCards = document.querySelectorAll('.job-card-container');
    jobCards.forEach(card => {
      // Here you would add your logic to:
      // - Check the job description by fetching its full content if necessary.
      // - Apply the regex rules on job description and company name.
      // - Modify the UI according to the selected action.
      
      // For now, we simply log each card.
      console.log(card);
    });
  });