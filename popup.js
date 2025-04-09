// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const targetId = tab.dataset.tab;
    document.querySelectorAll('#main, #templates').forEach(section => {
      section.style.display = section.id === targetId ? 'block' : 'none';
    });
  });
});

// Main form functionality
document.getElementById("fill").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  });
});

document.getElementById("edit").addEventListener("click", () => {
  const form = document.getElementById("form");
  form.style.display = "block";
  form.classList.add('visible');
  
  chrome.storage.local.get(["autofillData"], ({ autofillData }) => {
    const data = autofillData || {};
    ["name", "email", "college", "phone"].forEach(key => {
      document.getElementById(key).value = data[key] || "";
    });
  });
});

document.getElementById("save").addEventListener("click", () => {
  const autofillData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    college: document.getElementById("college").value,
    phone: document.getElementById("phone").value,
  };

  chrome.storage.local.set({ autofillData }, () => {
    const status = document.getElementById("status");
    status.textContent = "✓ Information saved successfully!";
    status.className = "status success";
    setTimeout(() => {
      status.className = "status";
    }, 3000);
  });
});

// Template functionality
function loadTemplates() {
  chrome.storage.local.get(['templates'], ({ templates = [] }) => {
    const templateList = document.querySelector('.template-list');
    templateList.innerHTML = templates.map((template, index) => `
      <div class="template-item">
        <span class="template-name">${template.name}</span>
        <div class="template-actions">
          <button class="icon-button use-template" data-index="${index}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="icon-button edit-template" data-index="${index}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="icon-button delete-template" data-index="${index}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for template actions
    document.querySelectorAll('.use-template').forEach(button => {
      button.addEventListener('click', () => useTemplate(parseInt(button.dataset.index)));
    });

    document.querySelectorAll('.edit-template').forEach(button => {
      button.addEventListener('click', () => editTemplate(parseInt(button.dataset.index)));
    });

    document.querySelectorAll('.delete-template').forEach(button => {
      button.addEventListener('click', () => deleteTemplate(parseInt(button.dataset.index)));
    });
  });
}

document.getElementById("addTemplate").addEventListener("click", () => {
  const name = prompt("Enter template name:");
  if (!name) return;

  chrome.storage.local.get(['templates', 'autofillData'], ({ templates = [], autofillData }) => {
    templates.push({
      name,
      data: { ...autofillData }
    });
    chrome.storage.local.set({ templates }, () => {
      loadTemplates();
      const status = document.getElementById("status");
      status.textContent = "✓ Template saved successfully!";
      status.className = "status success";
      setTimeout(() => {
        status.className = "status";
      }, 3000);
    });
  });
});

function useTemplate(index) {
  chrome.storage.local.get(['templates'], ({ templates }) => {
    const template = templates[index];
    chrome.storage.local.set({ autofillData: template.data }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
      });
    });
  });
}

function editTemplate(index) {
  chrome.storage.local.get(['templates'], ({ templates }) => {
    const template = templates[index];
    const name = prompt("Enter new template name:", template.name);
    if (!name) return;

    templates[index] = {
      ...template,
      name
    };

    chrome.storage.local.set({ templates }, () => {
      loadTemplates();
    });
  });
}

function deleteTemplate(index) {
  if (!confirm("Are you sure you want to delete this template?")) return;

  chrome.storage.local.get(['templates'], ({ templates }) => {
    templates.splice(index, 1);
    chrome.storage.local.set({ templates }, () => {
      loadTemplates();
    });
  });
}

// Import/Export functionality
document.getElementById("export").addEventListener("click", () => {
  chrome.storage.local.get(["autofillData", "templates"], (data) => {
    const exportData = {
      autofillData: data.autofillData || {},
      templates: data.templates || []
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formfillpro-data.json";
    a.click();
  });
});

document.getElementById("import").addEventListener("click", () => {
  document.getElementById("envUpload").click();
});

document.getElementById("envUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = () => {
    try {
      const importedData = JSON.parse(reader.result);
      chrome.storage.local.set(importedData, () => {
        const status = document.getElementById("status");
        status.textContent = "✓ Data imported successfully!";
        status.className = "status success";
        setTimeout(() => {
          status.className = "status";
          loadTemplates();
        }, 3000);
      });
    } catch (error) {
      const status = document.getElementById("status");
      status.textContent = "✗ Invalid import file format";
      status.className = "status error";
      setTimeout(() => {
        status.className = "status";
      }, 3000);
    }
  };
  
  reader.readAsText(file);
});

// Initialize templates on load
loadTemplates();
  