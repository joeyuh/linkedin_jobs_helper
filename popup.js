document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabs = document.querySelectorAll('.tab');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab
      tabs.forEach(tab => tab.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Setup rule templates and handlers
  const ruleTemplate = document.getElementById('rule-template');
  const descriptionRulesContainer = document.getElementById('description-rules-container');
  const companyRulesContainer = document.getElementById('company-rules-container');
  
  // Rule counters for unique IDs
  let descriptionRuleCounter = 0;
  let companyRuleCounter = 0;
  
  // Data structures to store rules
  let descriptionRules = [];
  let companyRules = [];
  let globalSettings = {
    noLongerAccepting: { action: null, options: {} },
    applied: { action: null, options: {} },
    reposted: { action: null, options: {} },
    highlightPromoted: { enabled: false, color: '#FFFF00' },
    highlightViewed: { enabled: false, color: '#E6E6FA' },
    showApplicationCount: false
  };
  
  // Load saved rules and settings from Chrome storage
  loadFromStorage();
  
  // Add rule button handlers
  document.getElementById('add-description-rule').addEventListener('click', () => {
    addRule('description');
  });
  
  document.getElementById('add-company-rule').addEventListener('click', () => {
    addRule('company');
  });
  
  // Setup global settings handlers
  setupGlobalSettingsHandlers();
  
  // Function to create a new rule
  function addRule(type, savedRule = null) {
    const container = type === 'description' ? descriptionRulesContainer : companyRulesContainer;
    const ruleId = type === 'description' ? `desc-${descriptionRuleCounter++}` : `comp-${companyRuleCounter++}`;
    
    // Clone the template
    const ruleElement = document.importNode(ruleTemplate.content, true);
    const ruleContainer = ruleElement.querySelector('.rule-container');
    ruleContainer.id = ruleId;
    
    // Set unique name for radio buttons
    const radioButtons = ruleElement.querySelectorAll('.action-radio');
    radioButtons.forEach(radio => {
      radio.name = `action-${ruleId}`;
      radio.addEventListener('change', () => handleActionChange(ruleId, radio.value));
    });
    
    // Add rule input handler for regex validation
    const ruleInput = ruleElement.querySelector('.rule-input');
    ruleInput.addEventListener('input', () => validateAndSaveRule(ruleId));
    
    // Add checkbox handlers
    const checkboxes = ruleElement.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => validateAndSaveRule(ruleId));
    });
    
    // Add color picker handlers
    const colorPickers = ruleElement.querySelectorAll('input[type="color"]');
    colorPickers.forEach(picker => {
      picker.addEventListener('change', () => validateAndSaveRule(ruleId));
    });
    
    // Add delete button handler
    const deleteButton = ruleElement.querySelector('.delete-rule-button');
    deleteButton.addEventListener('click', () => {
      container.removeChild(document.getElementById(ruleId));
      deleteRule(ruleId);
    });
    
    // Append the new rule to the container
    container.appendChild(ruleElement);
    
    // If we have saved data, populate the rule
    if (savedRule) {
      populateRuleFromSaved(ruleId, savedRule);
    } else {
      // Auto select the "Hide" action and "Auto Hide" checkbox for new rules
      const hideRadio = document.querySelector(`#${ruleId} .action-radio[value="hide"]`);
      const autoHideCheckbox = document.querySelector(`#${ruleId} .auto-hide-checkbox`);
      
      if (hideRadio && autoHideCheckbox) {
        hideRadio.checked = true;
        autoHideCheckbox.checked = true;
        handleActionChange(ruleId, 'hide');
      }
    }
  }
  
  // Function to handle action radio button changes
  function handleActionChange(ruleId, action) {
    const ruleElement = document.getElementById(ruleId);
    const hideOptions = ruleElement.querySelector('.hide-options');
    const warnOptions = ruleElement.querySelector('.warn-options');
    
    if (action === 'hide') {
      hideOptions.style.display = 'block';
      warnOptions.style.display = 'none';
    } else if (action === 'warn') {
      hideOptions.style.display = 'none';
      warnOptions.style.display = 'block';
    } else if (action === 'disable') {
      hideOptions.style.display = 'none';
      warnOptions.style.display = 'none';
    }
    
    validateAndSaveRule(ruleId);
  }
  
  // Function to validate regex and ensure at least one option is selected
  function validateAndSaveRule(ruleId) {
    const ruleElement = document.getElementById(ruleId);
    const ruleInput = ruleElement.querySelector('.rule-input');
    const invalidRegexMessage = ruleElement.querySelector('.invalid-regex');
    const selectedAction = ruleElement.querySelector('.action-radio:checked')?.value;
    
    let isValid = true;
    let ruleData = { pattern: ruleInput.value, action: selectedAction, options: {} };
    
    // Validate regex
    if (ruleInput.value) {
      try {
        new RegExp(ruleInput.value);
        invalidRegexMessage.style.display = 'none';
      } catch (e) {
        invalidRegexMessage.style.display = 'block';
        isValid = false;
      }
    }
    
    // Check if an action is selected
    if (!selectedAction) {
      isValid = false;
    } else if (selectedAction === 'disable') {
      // If disabled, no further validation needed
      ruleData.options = {};
    } else {
      // Get selected options based on action
      if (selectedAction === 'hide') {
        const autoHide = ruleElement.querySelector('.auto-hide-checkbox').checked;
        const clickHide = ruleElement.querySelector('.click-hide-checkbox').checked;
        const warningElement = ruleElement.querySelector('.hide-options .checkbox-warning');
        
        if (!autoHide && !clickHide) {
          warningElement.style.display = 'block';
          isValid = false; // At least one option must be selected
        } else {
          warningElement.style.display = 'none';
        }
        
        ruleData.options = {
          autoHide,
          clickHide
        };
      } else if (selectedAction === 'warn') {
        const changeBgColor = ruleElement.querySelector('.bg-color-checkbox').checked;
        const highlight = ruleElement.querySelector('.highlight-checkbox').checked;
        const bgColor = ruleElement.querySelector('.color-picker').value;
        const warningElement = ruleElement.querySelector('.warn-options .checkbox-warning');
        
        if (!changeBgColor && !highlight) {
          warningElement.style.display = 'block';
          isValid = false; // At least one option must be selected
        } else {
          warningElement.style.display = 'none';
        }
        
        ruleData.options = {
          changeBgColor,
          highlight,
          bgColor
        };
      }
    }
    
    // If valid and has a pattern, save the rule
    if (isValid && ruleInput.value) {
      saveRule(ruleId, ruleData);
    }
    
    return isValid;
  }
  
  // Function to save a rule to the appropriate array and Chrome storage
  function saveRule(ruleId, ruleData) {
    if (ruleId.startsWith('desc-')) {
      // Update or add to description rules
      const index = descriptionRules.findIndex(rule => rule.id === ruleId);
      if (index >= 0) {
        descriptionRules[index] = { id: ruleId, ...ruleData };
      } else {
        descriptionRules.push({ id: ruleId, ...ruleData });
      }
    } else if (ruleId.startsWith('comp-')) {
      // Update or add to company rules
      const index = companyRules.findIndex(rule => rule.id === ruleId);
      if (index >= 0) {
        companyRules[index] = { id: ruleId, ...ruleData };
      } else {
        companyRules.push({ id: ruleId, ...ruleData });
      }
    }
    
    // Save to Chrome storage
    saveToStorage();
  }
  
  // Function to delete a rule
  function deleteRule(ruleId) {
    if (ruleId.startsWith('desc-')) {
      descriptionRules = descriptionRules.filter(rule => rule.id !== ruleId);
    } else if (ruleId.startsWith('comp-')) {
      companyRules = companyRules.filter(rule => rule.id !== ruleId);
    }
    
    // Save to Chrome storage
    saveToStorage();
  }
  
  // Function to populate a rule from saved data
  function populateRuleFromSaved(ruleId, savedRule) {
    const ruleElement = document.getElementById(ruleId);
    const ruleInput = ruleElement.querySelector('.rule-input');
    
    // Set the pattern
    ruleInput.value = savedRule.pattern;
    
    // Set the action
    const actionRadio = ruleElement.querySelector(`.action-radio[value="${savedRule.action}"]`);
    if (actionRadio) {
      actionRadio.checked = true;
      handleActionChange(ruleId, savedRule.action);
    }
    
    // Set the options
    if (savedRule.action === 'hide') {
      ruleElement.querySelector('.auto-hide-checkbox').checked = savedRule.options.autoHide || false;
      ruleElement.querySelector('.click-hide-checkbox').checked = savedRule.options.clickHide || false;
      // Hide warning since we're loading a saved rule
      ruleElement.querySelector('.hide-options .checkbox-warning').style.display = 'none';
    } else if (savedRule.action === 'warn') {
      ruleElement.querySelector('.bg-color-checkbox').checked = savedRule.options.changeBgColor || false;
      ruleElement.querySelector('.highlight-checkbox').checked = savedRule.options.highlight || false;
      if (savedRule.options.bgColor) {
        ruleElement.querySelector('.color-picker').value = savedRule.options.bgColor;
      }
      // Hide warning since we're loading a saved rule
      ruleElement.querySelector('.warn-options .checkbox-warning').style.display = 'none';
    }
  }
  
  // Function to set up global settings handlers
  function setupGlobalSettingsHandlers() {
    // No longer accepting applications
    setupGlobalSetting('no-longer-accepting', 'noLongerAccepting');
    
    // Already applied
    setupGlobalSetting('applied', 'applied');
    
    // Reposted job
    setupGlobalSetting('reposted', 'reposted');
    
    // Highlight settings
    document.getElementById('highlight-promoted').addEventListener('change', function() {
      globalSettings.highlightPromoted.enabled = this.checked;
      saveToStorage();
    });
    
    document.querySelectorAll('#highlight-promoted + label + input[type="color"]').forEach(picker => {
      picker.addEventListener('change', function() {
        globalSettings.highlightPromoted.color = this.value;
        saveToStorage();
      });
    });
    
    document.getElementById('highlight-viewed').addEventListener('change', function() {
      globalSettings.highlightViewed.enabled = this.checked;
      saveToStorage();
    });
    
    document.querySelectorAll('#highlight-viewed + label + input[type="color"]').forEach(picker => {
      picker.addEventListener('change', function() {
        globalSettings.highlightViewed.color = this.value;
        saveToStorage();
      });
    });
    
    // Show application count
    document.getElementById('show-application-count').addEventListener('change', function() {
      globalSettings.showApplicationCount = this.checked;
      saveToStorage();
    });
  }
  
  // Helper function to set up a global setting
  function setupGlobalSetting(prefix, settingKey) {
    // Radio button handlers
    document.querySelectorAll(`input[name="${prefix}-action"]`).forEach(radio => {
      radio.addEventListener('change', function() {
        globalSettings[settingKey].action = this.value;
        
        // Show/hide appropriate options
        const hideOptions = document.querySelector(`#${prefix}-hide`).closest('.action-container').querySelector('.hide-options');
        const warnOptions = document.querySelector(`#${prefix}-hide`).closest('.action-container').querySelector('.warn-options');
        
        if (this.value === 'hide') {
          hideOptions.style.display = 'block';
          warnOptions.style.display = 'none';
        } else if (this.value === 'warn') {
          hideOptions.style.display = 'none';
          warnOptions.style.display = 'block';
        } else if (this.value === 'disable') {
          hideOptions.style.display = 'none';
          warnOptions.style.display = 'none';
        }
        
        validateAndSaveGlobalSetting(prefix, settingKey);
      });
    });
    
    // Checkbox handlers for hide options
    document.getElementById(`${prefix}-auto-hide`).addEventListener('change', function() {
      globalSettings[settingKey].options.autoHide = this.checked;
      validateAndSaveGlobalSetting(prefix, settingKey);
    });
    
    document.getElementById(`${prefix}-click-hide`).addEventListener('change', function() {
      globalSettings[settingKey].options.clickHide = this.checked;
      validateAndSaveGlobalSetting(prefix, settingKey);
    });
    
    // Checkbox handlers for warn options
    document.getElementById(`${prefix}-bg-color`).addEventListener('change', function() {
      globalSettings[settingKey].options.changeBgColor = this.checked;
      validateAndSaveGlobalSetting(prefix, settingKey);
    });
    
    document.getElementById(`${prefix}-highlight`).addEventListener('change', function() {
      globalSettings[settingKey].options.highlight = this.checked;
      validateAndSaveGlobalSetting(prefix, settingKey);
    });
    
    // Color picker handler
    const colorPicker = document.querySelector(`#${prefix}-bg-color + label + input[type="color"]`);
    if (colorPicker) {
      colorPicker.addEventListener('change', function() {
        globalSettings[settingKey].options.bgColor = this.value;
        saveToStorage();
      });
    }
  }
  
  // Function to validate and save global settings
  function validateAndSaveGlobalSetting(prefix, settingKey) {
    const action = globalSettings[settingKey].action;
    let isValid = true;
    
    if (action === 'disable') {
      // If disabled, no further validation needed
      isValid = true;
    } else if (action === 'hide') {
      const autoHide = document.getElementById(`${prefix}-auto-hide`).checked;
      const clickHide = document.getElementById(`${prefix}-click-hide`).checked;
      const warningElement = document.querySelector(`#${prefix}-auto-hide`).closest('.checkbox-group').querySelector('.checkbox-warning');
      
      if (!autoHide && !clickHide) {
        warningElement.style.display = 'block';
        isValid = false; // At least one option must be selected
      } else {
        warningElement.style.display = 'none';
      }
    } else if (action === 'warn') {
      const changeBgColor = document.getElementById(`${prefix}-bg-color`).checked;
      const highlight = document.getElementById(`${prefix}-highlight`).checked;
      const warningElement = document.querySelector(`#${prefix}-bg-color`).closest('.checkbox-group').querySelector('.checkbox-warning');
      
      if (!changeBgColor && !highlight) {
        warningElement.style.display = 'block';
        isValid = false; // At least one option must be selected
      } else {
        warningElement.style.display = 'none';
      }
    }
    
    if (isValid && action) {
      saveToStorage();
    }
    
    return isValid;
  }
  
  // Function to save all data to Chrome storage
  function saveToStorage() {
    chrome.storage.sync.set({
      descriptionRules,
      companyRules,
      globalSettings
    }, function() {
      console.log('Settings saved');
    });
  }
  
  // Function to load data from Chrome storage
  function loadFromStorage() {
    chrome.storage.sync.get(['descriptionRules', 'companyRules', 'globalSettings'], function(result) {
      // Load description rules
      if (result.descriptionRules && Array.isArray(result.descriptionRules)) {
        descriptionRules = result.descriptionRules;
        descriptionRules.forEach(rule => {
          addRule('description', rule);
        });
        
        // Update counter to avoid ID conflicts
        if (descriptionRules.length > 0) {
          const maxId = Math.max(...descriptionRules.map(rule => {
            const match = rule.id.match(/desc-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }));
          descriptionRuleCounter = maxId + 1;
        }
      }
      
      // Load company rules
      if (result.companyRules && Array.isArray(result.companyRules)) {
        companyRules = result.companyRules;
        companyRules.forEach(rule => {
          addRule('company', rule);
        });
        
        // Update counter to avoid ID conflicts
        if (companyRules.length > 0) {
          const maxId = Math.max(...companyRules.map(rule => {
            const match = rule.id.match(/comp-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }));
          companyRuleCounter = maxId + 1;
        }
      }
      
      // Load global settings
      if (result.globalSettings) {
        globalSettings = { ...globalSettings, ...result.globalSettings };
        
        // Update UI for global settings
        updateGlobalSettingsUI();
      }
      
      // If no rules exist, add empty ones
      if (descriptionRules.length === 0) {
        addRule('description');
      }
      
      if (companyRules.length === 0) {
        addRule('company');
      }
    });
  }
  
  // Function to update the UI based on loaded global settings
  function updateGlobalSettingsUI() {
    // Set default Hide - Auto Hide for all global settings if no action is set
    if (!globalSettings.noLongerAccepting.action) {
      globalSettings.noLongerAccepting.action = 'hide';
      globalSettings.noLongerAccepting.options = { autoHide: true, clickHide: false };
    }
    if (!globalSettings.applied.action) {
      globalSettings.applied.action = 'hide';
      globalSettings.applied.options = { autoHide: true, clickHide: false };
    }
    if (!globalSettings.reposted.action) {
      globalSettings.reposted.action = 'hide';
      globalSettings.reposted.options = { autoHide: true, clickHide: false };
    }
    
    // No longer accepting applications
    updateGlobalSettingUI('no-longer-accepting', 'noLongerAccepting');
    
    // Already applied
    updateGlobalSettingUI('applied', 'applied');
    
    // Reposted job
    updateGlobalSettingUI('reposted', 'reposted');
    
    // Highlight settings
    document.getElementById('highlight-promoted').checked = globalSettings.highlightPromoted.enabled;
    document.querySelectorAll('#highlight-promoted + label + input[type="color"]').forEach(picker => {
      picker.value = globalSettings.highlightPromoted.color;
    });
    
    document.getElementById('highlight-viewed').checked = globalSettings.highlightViewed.enabled;
    document.querySelectorAll('#highlight-viewed + label + input[type="color"]').forEach(picker => {
      picker.value = globalSettings.highlightViewed.color;
    });
    
    // Show application count
    document.getElementById('show-application-count').checked = globalSettings.showApplicationCount;
  }
  
  // Helper function to update a global setting UI
  function updateGlobalSettingUI(prefix, settingKey) {
    const setting = globalSettings[settingKey];
    
    if (setting.action) {
      // Set action radio
      document.getElementById(`${prefix}-${setting.action}`).checked = true;
      
      // Show appropriate options section
      const hideOptions = document.querySelector(`#${prefix}-hide`).closest('.action-container').querySelector('.hide-options');
      const warnOptions = document.querySelector(`#${prefix}-hide`).closest('.action-container').querySelector('.warn-options');
      
      if (setting.action === 'hide') {
        hideOptions.style.display = 'block';
        warnOptions.style.display = 'none';
        
        // Set hide options
        document.getElementById(`${prefix}-auto-hide`).checked = setting.options.autoHide || false;
        document.getElementById(`${prefix}-click-hide`).checked = setting.options.clickHide || false;
        
        // Hide warning for loaded settings
        hideOptions.querySelector('.checkbox-warning').style.display = 'none';
      } else if (setting.action === 'warn') {
        hideOptions.style.display = 'none';
        warnOptions.style.display = 'block';
        
        // Set warn options
        document.getElementById(`${prefix}-bg-color`).checked = setting.options.changeBgColor || false;
        document.getElementById(`${prefix}-highlight`).checked = setting.options.highlight || false;
        
        // Hide warning for loaded settings
        warnOptions.querySelector('.checkbox-warning').style.display = 'none';
        
        const colorPicker = document.querySelector(`#${prefix}-bg-color + label + input[type="color"]`);
        if (colorPicker && setting.options.bgColor) {
          colorPicker.value = setting.options.bgColor;
        }
      } else if (setting.action === 'disable') {
        hideOptions.style.display = 'none';
        warnOptions.style.display = 'none';
      }
    }
  }
});