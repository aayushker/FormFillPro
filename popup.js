document.getElementById("fill").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    });
  });
  
  document.getElementById("edit").addEventListener("click", () => {
    document.getElementById("form").style.display = "block";
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
      alert("Saved locally!");
    });
  });
  
  document.getElementById("export").addEventListener("click", () => {
    chrome.storage.local.get(["autofillData"], ({ autofillData }) => {
      const lines = Object.entries(autofillData || {})
        .map(([k, v]) => `${k.toUpperCase()}=${v}`)
        .join("\n");
      const blob = new Blob([lines], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "autofill.env";
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
      const text = reader.result;
      const lines = text.split("\n");
      const data = {};
      lines.forEach(line => {
        const [key, val] = line.split("=");
        if (key && val) {
          data[key.trim().toLowerCase()] = val.trim();
        }
      });
      chrome.storage.local.set({ autofillData: data }, () => {
        alert("Imported successfully!");
      });
    };
    reader.readAsText(file);
  });
  