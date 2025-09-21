document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");
  const announcementBanner = document.querySelector(".announcement-banner");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement management elements
  const manageAnnouncementsButton = document.getElementById("manage-announcements-button");
  const announcementModal = document.getElementById("announcement-modal");
  const closeAnnouncementModal = document.querySelector(".close-announcement-modal");
  const announcementsListContainer = document.getElementById("announcements-list-container");
  const announcementFormContainer = document.getElementById("announcement-form-container");
  const announcementsList = document.getElementById("announcements-list");
  const addAnnouncementButton = document.getElementById("add-announcement-button");
  const announcementForm = document.getElementById("announcement-form");
  const cancelFormButton = document.getElementById("cancel-form-button");
  const cancelFormButtonBottom = document.getElementById("cancel-form-button-bottom");
  const announcementMessageDiv = document.getElementById("announcement-message");
  const formTitle = document.getElementById("form-title");
  const saveAnnouncementButton = document.getElementById("save-announcement-button");

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // Authentication state
  let currentUser = null;

  // Announcement management state
  let currentEditingAnnouncement = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Before school hours
    afternoon: { start: "15:00", end: "18:00" }, // After school hours
    weekend: { days: ["Saturday", "Sunday"] }, // Weekend days
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Invalid username or password",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // === ANNOUNCEMENT MANAGEMENT FUNCTIONS ===

  // Open announcement management modal
  function openAnnouncementModal() {
    announcementModal.classList.remove("hidden");
    announcementModal.classList.add("show");
    showAnnouncementsList();
    loadAnnouncementsForManagement();
  }

  // Close announcement management modal
  function closeAnnouncementModalHandler() {
    announcementModal.classList.remove("show");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      showAnnouncementsList();
      resetAnnouncementForm();
    }, 300);
  }

  // Show announcements list view
  function showAnnouncementsList() {
    announcementsListContainer.classList.remove("hidden");
    announcementFormContainer.classList.add("hidden");
    currentEditingAnnouncement = null;
  }

  // Show announcement form view
  function showAnnouncementForm(isEdit = false) {
    announcementsListContainer.classList.add("hidden");
    announcementFormContainer.classList.remove("hidden");
    formTitle.textContent = isEdit ? "Edit Announcement" : "Add New Announcement";
    saveAnnouncementButton.textContent = isEdit ? "Update Announcement" : "Save Announcement";
  }

  // Reset announcement form
  function resetAnnouncementForm() {
    announcementForm.reset();
    currentEditingAnnouncement = null;
    hideAnnouncementMessage();
    
    // Set minimum date to today for expiration date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("announcement-expiration-date").min = today;
  }

  // Show message in announcement modal
  function showAnnouncementMessage(text, type) {
    announcementMessageDiv.textContent = text;
    announcementMessageDiv.className = `message ${type}`;
    announcementMessageDiv.classList.remove("hidden");
    
    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        hideAnnouncementMessage();
      }, 3000);
    }
  }

  // Hide announcement message
  function hideAnnouncementMessage() {
    announcementMessageDiv.classList.add("hidden");
  }

  // Load announcements for management
  async function loadAnnouncementsForManagement() {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/announcements/manage?teacher_username=${encodeURIComponent(currentUser.username)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const announcements = await response.json();
      displayAnnouncementsForManagement(announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      announcementsList.innerHTML = '<p class="error">Failed to load announcements. Please try again.</p>';
    }
  }

  // Display announcements in management view
  function displayAnnouncementsForManagement(announcements) {
    if (announcements.length === 0) {
      announcementsList.innerHTML = `
        <div class="empty-state">
          <p>No announcements found.</p>
          <p>Click "Add New Announcement" to create your first announcement.</p>
        </div>
      `;
      return;
    }

    announcementsList.innerHTML = '';
    
    announcements.forEach(announcement => {
      const announcementCard = document.createElement('div');
      announcementCard.className = `announcement-card ${announcement.is_active ? 'active' : 'inactive'}`;
      
      // Format dates
      const startDate = announcement.start_date ? new Date(announcement.start_date).toLocaleDateString() : 'Immediate';
      const expirationDate = new Date(announcement.expiration_date).toLocaleDateString();
      
      announcementCard.innerHTML = `
        <div class="announcement-header">
          <h5 class="announcement-title">${escapeHtml(announcement.title)}</h5>
          <div class="announcement-status">
            <span class="status-badge ${announcement.is_active ? 'active' : 'inactive'}">
              ${announcement.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <p class="announcement-message">${escapeHtml(announcement.message)}</p>
        <div class="announcement-dates">
          <small><strong>Start:</strong> ${startDate} | <strong>Expires:</strong> ${expirationDate}</small>
        </div>
        <div class="announcement-actions">
          <button class="edit-announcement-btn" data-id="${announcement.id}">Edit</button>
          <button class="delete-announcement-btn" data-id="${announcement.id}">Delete</button>
        </div>
      `;
      
      announcementsList.appendChild(announcementCard);
    });

    // Add event listeners for edit and delete buttons
    announcementsList.querySelectorAll('.edit-announcement-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const announcementId = e.target.dataset.id;
        const announcement = announcements.find(a => a.id === announcementId);
        editAnnouncement(announcement);
      });
    });

    announcementsList.querySelectorAll('.delete-announcement-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const announcementId = e.target.dataset.id;
        const announcement = announcements.find(a => a.id === announcementId);
        deleteAnnouncement(announcementId, announcement.title);
      });
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Edit announcement
  function editAnnouncement(announcement) {
    currentEditingAnnouncement = announcement;
    showAnnouncementForm(true);
    
    // Populate form with existing data
    document.getElementById("announcement-title").value = announcement.title;
    document.getElementById("announcement-message").value = announcement.message;
    document.getElementById("announcement-start-date").value = announcement.start_date || '';
    document.getElementById("announcement-expiration-date").value = announcement.expiration_date;
  }

  // Delete announcement
  function deleteAnnouncement(announcementId, title) {
    showConfirmationDialog(
      `Are you sure you want to delete the announcement "${title}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(
            `/announcements/${announcementId}?teacher_username=${encodeURIComponent(currentUser.username)}`,
            { method: 'DELETE' }
          );

          const result = await response.json();

          if (response.ok) {
            showAnnouncementMessage('Announcement deleted successfully', 'success');
            loadAnnouncementsForManagement();
            // Refresh the banner
            fetchAndDisplayAnnouncements();
          } else {
            showAnnouncementMessage(result.detail || 'Failed to delete announcement', 'error');
          }
        } catch (error) {
          console.error('Error deleting announcement:', error);
          showAnnouncementMessage('Failed to delete announcement. Please try again.', 'error');
        }
      }
    );
  }

  // Handle announcement form submission
  async function handleAnnouncementFormSubmit(event) {
    event.preventDefault();
    
    if (!currentUser) {
      showAnnouncementMessage('You must be logged in to manage announcements', 'error');
      return;
    }

    const title = document.getElementById("announcement-title").value.trim();
    const message = document.getElementById("announcement-message").value.trim();
    const startDate = document.getElementById("announcement-start-date").value;
    const expirationDate = document.getElementById("announcement-expiration-date").value;

    // Validate form
    if (!title || !message || !expirationDate) {
      showAnnouncementMessage('Please fill in all required fields', 'error');
      return;
    }

    // Validate dates
    const today = new Date().toISOString().split('T')[0];
    if (expirationDate < today) {
      showAnnouncementMessage('Expiration date cannot be in the past', 'error');
      return;
    }

    if (startDate && startDate > expirationDate) {
      showAnnouncementMessage('Start date cannot be after expiration date', 'error');
      return;
    }

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('title', title);
    formData.append('message', message);
    formData.append('expiration_date', expirationDate);
    formData.append('teacher_username', currentUser.username);
    
    if (startDate) {
      formData.append('start_date', startDate);
    }

    try {
      let url, method;
      
      if (currentEditingAnnouncement) {
        // Update existing announcement
        url = `/announcements/${currentEditingAnnouncement.id}?${formData.toString()}`;
        method = 'PUT';
      } else {
        // Create new announcement
        url = `/announcements/?${formData.toString()}`;
        method = 'POST';
      }

      const response = await fetch(url, { method });
      const result = await response.json();

      if (response.ok) {
        const action = currentEditingAnnouncement ? 'updated' : 'created';
        showAnnouncementMessage(`Announcement ${action} successfully`, 'success');
        showAnnouncementsList();
        loadAnnouncementsForManagement();
        resetAnnouncementForm();
        // Refresh the banner
        fetchAndDisplayAnnouncements();
      } else {
        showAnnouncementMessage(result.detail || `Failed to ${currentEditingAnnouncement ? 'update' : 'create'} announcement`, 'error');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      showAnnouncementMessage('Failed to save announcement. Please try again.', 'error');
    }
  }

  // Event listeners for announcement management
  if (manageAnnouncementsButton) {
    manageAnnouncementsButton.addEventListener("click", openAnnouncementModal);
  }
  
  if (closeAnnouncementModal) {
    closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);
  }
  
  if (addAnnouncementButton) {
    addAnnouncementButton.addEventListener("click", () => {
      resetAnnouncementForm();
      showAnnouncementForm(false);
    });
  }
  
  if (cancelFormButton) {
    cancelFormButton.addEventListener("click", showAnnouncementsList);
  }
  
  if (cancelFormButtonBottom) {
    cancelFormButtonBottom.addEventListener("click", showAnnouncementsList);
  }
  
  if (announcementForm) {
    announcementForm.addEventListener("submit", handleAnnouncementFormSubmit);
  }

  // Close announcement modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  // === END ANNOUNCEMENT MANAGEMENT FUNCTIONS ===

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Function to determine activity type (this would ideally come from backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    } else if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    } else if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    } else if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    } else if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Default to "academic" if no match
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear the activities list
    activitiesList.innerHTML = "";

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    // Display filtered activities
    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Function to fetch and display announcements
  async function fetchAndDisplayAnnouncements() {
    try {
      const response = await fetch('/announcements/');
      if (!response.ok) {
        console.error('Failed to fetch announcements:', response.status);
        return;
      }
      
      const announcements = await response.json();
      
      // Clear existing content
      announcementBanner.innerHTML = '';
      
      if (announcements.length === 0) {
        // Hide banner if no announcements
        announcementBanner.style.display = 'none';
        return;
      }
      
      // Show banner and display first active announcement
      announcementBanner.style.display = 'block';
      const announcement = announcements[0]; // Get the newest active announcement
      
      // Create announcement content with emoji and message
      const content = document.createElement('span');
      content.innerHTML = `<span aria-hidden="true">📢</span> ${announcement.message}`;
      
      // Add title as tooltip if it's different from message
      if (announcement.title && announcement.title !== announcement.message) {
        content.title = announcement.title;
      }
      
      announcementBanner.appendChild(content);
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Keep banner hidden if there's an error
      announcementBanner.style.display = 'none';
    }
  }

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchActivities();
  fetchAndDisplayAnnouncements();
});
