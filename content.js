chrome.storage.local.get(["autofillData"], (result) => {
  const data = result.autofillData || {};

  // Common field patterns for better matching
  const fieldPatterns = {
    name: ['name', 'fullname', 'full-name', 'full_name', 'fname', 'lname', 'firstname', 'lastname'],
    email: ['email', 'e-mail', 'mail'],
    phone: ['phone', 'mobile', 'cell', 'contact', 'tel', 'telephone'],
    college: ['college', 'university', 'school', 'institution', 'org', 'organization']
  };

  // Helper function to check if a field matches any pattern
  const matchesPattern = (fieldText, patterns) => {
    return patterns.some(pattern => 
      fieldText.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Get all form fields
  const formFields = document.querySelectorAll('input, textarea, select');
  
  formFields.forEach(field => {
    // Get all possible attributes that might indicate field purpose
    const fieldIdentifiers = [
      field.name,
      field.id,
      field.placeholder,
      field.getAttribute('aria-label'),
      field.getAttribute('data-field'),
      field.previousElementSibling?.textContent, // Check label text if it's before the input
      document.querySelector(`label[for="${field.id}"]`)?.textContent // Check for associated label
    ].filter(Boolean).join(' ').toLowerCase();

    // Try to match field with data
    for (const [dataKey, patterns] of Object.entries(fieldPatterns)) {
      if (matchesPattern(fieldIdentifiers, patterns) && data[dataKey]) {
        // Set the field value
        field.value = data[dataKey];
        
        // Trigger relevant events to ensure proper form behavior
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // If it's a select element, make sure the option is selected
        if (field.tagName === 'SELECT') {
          Array.from(field.options).forEach(option => {
            if (option.text.toLowerCase().includes(data[dataKey].toLowerCase())) {
              option.selected = true;
            }
          });
        }
      }
    }
  });

  // Provide visual feedback
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    Form fields filled automatically
  `;
  
  document.body.appendChild(notification);
  
  // Animate notification
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
});
  