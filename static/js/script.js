document.addEventListener("DOMContentLoaded", () => {
	const checkboxes = document.querySelectorAll(".status-checkbox");
	const filterSelect = document.querySelector("#status");

	checkboxes.forEach(box => {
        box.addEventListener("change", async () => {
            const todoItem = box.closest(".todo-item");
            const id = todoItem.dataset.id;
            const newStatus = box.checked ? "done" : "in progress";
    
            try {
                const response = await fetch(`/update-status/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                });
    
                if (response.ok) {
                    todoItem.classList.toggle("done", newStatus === "done");
    
                    const selectedFilter = filterSelect?.value;
                    const urlParams = new URLSearchParams(window.location.search);
                    const isOverdueView = urlParams.get("overdue") === "true";

                    if ((selectedFilter && selectedFilter !== newStatus) || (isOverdueView && newStatus === "done")) {
                        todoItem.style.transition = "opacity 0.3s";
                        todoItem.style.opacity = "0";
                        setTimeout(() => todoItem.remove(), 300);
                    }
                } else {
                    console.error("Update failed.");
                }
            } catch (err) {
                console.error("Error:", err);
            }
        });
    });

    const deleteButtons = document.querySelectorAll(".delete-button");

    deleteButtons.forEach(button => {
        button.addEventListener("click", async () => {
            const todoItem = button.closest(".todo-item");
            const id = todoItem.dataset.id;

            try {
                const res = await fetch(`/delete/${id}`, { method: "DELETE" });
                if (res.ok) {
                    todoItem.remove();
                } else {
                    console.error("Failed to delete item.");
                }
            } catch (err) {
                console.error("Error:", err);
            }
        });
    });
});