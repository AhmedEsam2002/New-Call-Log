// Function to format Egyptian phone numbers
function formatEgyptianPhone(input) {
  let numbers = input.replace(/\D/g, "");
  if (numbers.startsWith("002")) {
    numbers = numbers.substring(3);
  } else if (numbers.startsWith("2")) {
    numbers = numbers.substring(1);
  }
  if (!numbers.startsWith("0")) {
    numbers = "0" + numbers;
  }
  if (numbers.length === 11) {
    return numbers;
  }
  return input;
}

document.addEventListener("DOMContentLoaded", () => {
  const phoneInput = document.getElementById("phone");
  const accountInput = document.getElementById("account");
  const logEntries = document.getElementById("logEntries");
  const form = document.getElementById("callForm");
  const searchInput = document.getElementById("searchInput");
  const callNumberDisplay = document.getElementById("call-number");
  const callHistoryContainer = document.createElement("div");
  callHistoryContainer.id = "callHistoryContainer";
  callHistoryContainer.style.marginTop = "20px";
  callHistoryContainer.style.padding = "15px";
  callHistoryContainer.style.borderRadius = "8px";
  callHistoryContainer.style.backgroundColor = "#e9f7ff"; // Light blue background for contrast
  callHistoryContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
  callHistoryContainer.style.display = "none";
  form.parentNode.appendChild(callHistoryContainer);

  let editingCallId = null;
  let callCount = parseInt(localStorage.getItem("callCount")) || 1;
  const calls = JSON.parse(localStorage.getItem("calls") || "[]");

  // Display initial call number
  callNumberDisplay.textContent = callCount;

  // Load saved calls
  displayCalls(calls);

  // Add phone number formatting on input
  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value;
    let cursorPosition = e.target.selectionStart;
    let beforeFormat = value;

    let formatted = formatEgyptianPhone(value);
    if (formatted !== value) {
      e.target.value = formatted;
      let lengthDiff = formatted.length - beforeFormat.length;
      e.target.setSelectionRange(
        cursorPosition + lengthDiff,
        cursorPosition + lengthDiff
      );
    }

    const customerType = document.querySelector(
      'input[name="type"][value="Customer"]:checked'
    );
    const pagentType = document.querySelector(
      'input[name="type"][value="P.Agent"]:checked'
    );
    if (customerType || pagentType) {
      accountInput.value = formatted;
    }

    // Show call history if the number matches previous records
    showCallHistory(formatted);
  });

  accountInput.addEventListener("input", () => {
    showCallHistory(accountInput.value);
  });

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCalls = calls.filter(
      (call) =>
        call.name.toLowerCase().includes(searchTerm) ||
        call.phone.includes(searchTerm) ||
        call.account.includes(searchTerm) ||
        call.description.toLowerCase().includes(searchTerm)
    );
    displayCalls(filteredCalls);
  });

  // Next Call button handler
  document.getElementById("nextCall").addEventListener("click", () => {
    const formData = {
      phone: phoneInput.value,
      name: document.getElementById("name").value,
      type: document.querySelector('input[name="type"]:checked')?.value,
      account: accountInput.value,
      description: document.getElementById("description").value,
      timestamp: new Date().toISOString(),
      id: editingCallId || Date.now(),
      callNumber: editingCallId
        ? calls.find((call) => call.id === editingCallId).callNumber
        : callCount,
    };

    if (!formData.phone) {
      showToast("Please fill all fields", "error");
      return;
    }

    if (editingCallId) {
      const index = calls.findIndex((call) => call.id === editingCallId);
      if (index !== -1) {
        calls[index] = formData;
      }
      editingCallId = null;
      document.getElementById("nextCall").textContent = "Next Call";
    } else {
      calls.unshift(formData);
      callCount++;
      localStorage.setItem("callCount", callCount);
    }

    localStorage.setItem("calls", JSON.stringify(calls));
    displayCalls(calls);
    form.reset();
    callNumberDisplay.textContent = callCount;
    showToast("Call logged successfully!");
  });

  // Display calls in the log
  function displayCalls(callsToDisplay) {
    logEntries.innerHTML = "";
    callsToDisplay.forEach((call) => {
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.innerHTML = `
          <div class="log-entry-header">
              <div>
                  <strong>Call #${call.callNumber}: ${call.name}</strong> (${
        call.type
      })
                  <br>
                  <small>${call.phone}</small>
              </div>
              <div class="log-entry-buttons">
                  <button class="btn edit-btn" onclick="editCall(${
                    call.id
                  })">Edit</button>
                  <button class="btn delete-btn" onclick="deleteCall(${
                    call.id
                  })">Delete</button>
              </div>
          </div>
          <div>
              <p>${call.description}</p>
              <small>${new Date(call.timestamp).toLocaleString()}</small>
          </div>
      `;
      logEntries.appendChild(entry);
    });
  }

  // Edit call
  window.editCall = (id) => {
    const call = calls.find((c) => c.id === id);
    if (call) {
      phoneInput.value = call.phone;
      document.getElementById("name").value = call.name;
      document.querySelector(
        `input[name="type"][value="${call.type}"]`
      ).checked = true;
      accountInput.value = call.account;
      document.getElementById("description").value = call.description;
      editingCallId = id;
      document.getElementById("nextCall").textContent = "Update Call";
    }
  };

  // Delete call
  window.deleteCall = (id) => {
    const index = calls.findIndex((call) => call.id === id);
    if (index !== -1) {
      calls.splice(index, 1);
      localStorage.setItem("calls", JSON.stringify(calls));
      displayCalls(calls);
      showToast("Call deleted successfully!");
    }
  };

  // Copy text functionality
  window.copyText = (elementId) => {
    const element = document.getElementById(elementId);
    element.select();
    navigator.clipboard
      .writeText(element.value)
      .then(() => showToast("Copied to clipboard!"))
      .catch(() => showToast("Failed to copy", "error"));
  };

  // Toast notification
  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.display = "block";
    toast.style.background = type === "success" ? "#4CAF50" : "#f44336";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // Show call history for a given phone or account number
  function showCallHistory(identifier) {
    const matchingCalls = calls.filter(
      (call) => call.phone === identifier || call.account === identifier
    );
    if (matchingCalls.length > 0) {
      callHistoryContainer.style.display = "block";
      callHistoryContainer.innerHTML = "<h3>Previous Call History:</h3>";
      matchingCalls.forEach((call) => {
        const historyEntry = document.createElement("div");
        historyEntry.className = "history-entry";
        historyEntry.style.marginBottom = "15px";
        historyEntry.style.padding = "10px";
        historyEntry.style.borderRadius = "6px";
        historyEntry.style.backgroundColor = "#ffffff"; // White background for contrast
        historyEntry.style.boxShadow = "0 1px 5px rgba(0, 0, 0, 0.1)";
        historyEntry.innerHTML = `
              <div style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px;">
                  <strong>Call #${call.callNumber}: ${call.name} (${
          call.type
        })</strong>
                  <small style="float: right; color: #666;">${new Date(
                    call.timestamp
                  ).toLocaleString()}</small>
              </div>
              <small style="display: block; margin-bottom: 5px;"><strong>Phone:</strong> ${
                call.phone
              } | <strong>Account:</strong> ${call.account}</small>
              <p style="margin: 5px 0; color: #333;">${call.description}</p>
          `;
        callHistoryContainer.appendChild(historyEntry);
      });
    } else {
      callHistoryContainer.style.display = "none";
    }
  }

  // Reset button functionality
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset Calls";
  resetButton.className = "btn delete-btn";
  resetButton.style.marginTop = "20px";
  document.querySelector(".form-container").appendChild(resetButton);

  resetButton.addEventListener("click", () => {
    localStorage.removeItem("calls");
    localStorage.setItem("callCount", 1);
    callCount = 1;
    callNumberDisplay.textContent = callCount;
    displayCalls([]);
    callHistoryContainer.style.display = "none";
    showToast("Call log reset successfully!", "success");
  });

  // Notes part
  const noteContent = document.getElementById("noteContent");
  const notesLog = document.getElementById("notesLog");
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");

  displayNotes(notes);

  document.getElementById("addNote").addEventListener("click", () => {
    const noteData = {
      content: noteContent.value,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };

    if (!noteData.content) {
      showToast("Please add some content", "error");
      return;
    }

    notes.unshift(noteData);
    localStorage.setItem("notes", JSON.stringify(notes));
    displayNotes(notes);
    noteContent.value = "";
    showToast("Note added successfully!");
  });

  function displayNotes(notesToDisplay) {
    notesLog.innerHTML = "";
    notesToDisplay.forEach((note) => {
      const entry = document.createElement("div");
      entry.className = "note-entry";
      entry.innerHTML = `
          <div>
              <p>${note.content}</p>
              <small>${new Date(note.timestamp).toLocaleString()}</small>
          </div>
      `;
      notesLog.appendChild(entry);
    });
  }

  window.copyNote = () => {
    const text = noteContent.value;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Note copied successfully!");
    });
  };
});
