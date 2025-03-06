// Background script for LinkedIn Jobs Filter extension
// This script handles the initialization and storage management

// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
      // Set default values for all settings
      const defaultSettings = {
        descriptionRules: [],
        companyRules: [],
        globalSettings: {
          noLongerAccepting: { 
            action: 'hide', 
            options: { 
              autoHide: true, 
              clickHide: false 
            } 
          },
          applied: { 
            action: 'hide', 
            options: { 
              autoHide: true, 
              clickHide: false 
            } 
          },
          reposted: { 
            action: 'hide', 
            options: { 
              autoHide: true, 
              clickHide: false 
            } 
          },
          highlightPromoted: { 
            enabled: true, 
            color: '#FFFF00' 
          },
          highlightViewed: { 
            enabled: true, 
            color: '#E6E6FA' 
          },
          showApplicationCount: true
        }
      };
      
      // Save default settings to Chrome storage
      chrome.storage.sync.set(defaultSettings, function() {
        console.log('Default settings initialized');
      });
    }
  });
  
  // Listen for messages from the popup or content scripts
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getRules') {
      // Get all rules and settings from storage and send them back
      chrome.storage.sync.get(['descriptionRules', 'companyRules', 'globalSettings'], function(result) {
        sendResponse(result);
      });
      return true; // Required for async sendResponse
    }
  });
  
  // Function to update badge with number of active rules
  function updateBadge() {
    chrome.storage.sync.get(['descriptionRules', 'companyRules'], function(result) {
      const descCount = Array.isArray(result.descriptionRules) ? result.descriptionRules.length : 0;
      const compCount = Array.isArray(result.companyRules) ? result.companyRules.length : 0;
      const totalCount = descCount + compCount;
      
      if (totalCount > 0) {
        chrome.action.setBadgeText({ text: totalCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#0077b5' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    });
  }
  
  // Listen for storage changes to update badge
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && (changes.descriptionRules || changes.companyRules)) {
      updateBadge();
    }
  });
  
  // Initialize badge on startup
  updateBadge();