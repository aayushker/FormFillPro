chrome.storage.local.get(["autofillData"], (result) => {
    const data = result.autofillData || {};
  
    for (const [key, value] of Object.entries(data)) {
      const inputs = document.querySelectorAll("input, textarea, select");
  
      inputs.forEach(input => {
        const name = input.name?.toLowerCase() || "";
        const id = input.id?.toLowerCase() || "";
        const placeholder = input.placeholder?.toLowerCase() || "";
  
        if ([name, id, placeholder].some(attr => attr.includes(key.toLowerCase()))) {
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    }
  });
  