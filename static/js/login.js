document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("loginForm");
	const errorMsg = document.querySelector(".error-message");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const formData = new FormData(form);
		const username = formData.get("username");
		const password = formData.get("password");

		try {
			const response = await fetch("/login", {
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
		} catch (err) {
			console.error("Login error:", err);
			errorMsg.style.display = "block";
		}
	});
});
