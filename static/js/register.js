document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("registerForm");
	const errorMsg = document.querySelector(".error-message");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(form);
		const username = formData.get("username").trim();
		const password = formData.get("password");

		const response = await fetch("/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password })
		});

		const result = await response.json();

		if (result.status === "success") {
			window.location.href = "/tasks";
		} else {
			errorMsg.style.display = "block";
		}
	});
});
