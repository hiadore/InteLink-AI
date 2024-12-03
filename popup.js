function openDashboard() {
    chrome.windows.create({
        url: "dashboard.html",
        type: "popup",
        width: 600, // Set custom width for the dashboard
        height: 500 // Set custom height for the dashboard
    });
}

document.getElementById("manage-tones-btn").addEventListener("click", openDashboard);
