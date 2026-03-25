document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId = null;

  function showMessage(text, type) {
    // Clear any existing hide timeout so older calls don't hide a newer message
    if (messageTimeoutId !== null) {
      clearTimeout(messageTimeoutId);
      messageTimeoutId = null;
    }

    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
      messageTimeoutId = null;
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build activity card content safely without using innerHTML with untrusted data
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;

        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = details.description;

        const scheduleEl = document.createElement("p");
        const scheduleStrong = document.createElement("strong");
        scheduleStrong.textContent = "Schedule:";
        scheduleEl.appendChild(scheduleStrong);
        scheduleEl.appendChild(document.createTextNode(" " + details.schedule));

        const availabilityEl = document.createElement("p");
        const availabilityStrong = document.createElement("strong");
        availabilityStrong.textContent = "Availability:";
        availabilityEl.appendChild(availabilityStrong);
        availabilityEl.appendChild(
          document.createTextNode(" " + spotsLeft + " spots left")
        );

        const participantsSectionEl = document.createElement("div");
        participantsSectionEl.className = "participants-section";

        const participantsHeaderEl = document.createElement("h5");
        participantsHeaderEl.textContent = "Participants";

        const participantsListEl = document.createElement("ul");
        participantsListEl.className = "participants-list";

        details.participants.forEach((participant) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const span = document.createElement("span");
          span.className = "participant-email";
          span.textContent = participant;

          const button = document.createElement("button");
          button.className = "participant-remove";
          button.type = "button";
          button.setAttribute(
            "aria-label",
            `Unregister ${participant} from ${name}`
          );
          button.setAttribute("data-activity", name);
          button.setAttribute("data-email", participant);
          button.textContent = "x";

          li.appendChild(span);
          li.appendChild(button);
          participantsListEl.appendChild(li);
        });

        participantsSectionEl.appendChild(participantsHeaderEl);
        participantsSectionEl.appendChild(participantsListEl);

        // Clear any existing content and append the newly created elements
        while (activityCard.firstChild) {
          activityCard.removeChild(activityCard.firstChild);
        }
        activityCard.appendChild(titleEl);
        activityCard.appendChild(descriptionEl);
        activityCard.appendChild(scheduleEl);
        activityCard.appendChild(availabilityEl);
        activityCard.appendChild(participantsSectionEl);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    if (!activity || !email) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
