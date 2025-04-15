const API_URL = '/api/todos';
let currentPage = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    document.getElementById('todo-form').addEventListener('submit', addTodo);
    document.getElementById('prev-btn').addEventListener('click', goToPrevPage);
    document.getElementById('next-btn').addEventListener('click', goToNextPage);
    document.getElementById('page-size').addEventListener('change', changePageSize);
});

async function loadTodos() {
    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&pageSize=${pageSize}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid data format from API');
        }

        renderTodos(data.items);
        updatePaginationInfo(data.totalCount);
    } catch (error) {
        console.error('Error loading todos:', error);
        document.getElementById('todo-list').innerHTML =
            `<li class="error">Error loading todos: ${error.message}</li>`;
    }
}

function renderTodos(todos) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    if (todos.length === 0) {
        list.innerHTML = '<li>No tasks found</li>';
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement('li');

        // Bullet point
        const bullet = document.createElement('span');
        bullet.className = `bullet ${todo.isCompleted ? 'completed' : 'pending'}`;

        // Task text
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.title;

        // Status text
        const statusSpan = document.createElement('span');
        statusSpan.className = todo.isCompleted ? 'completed' : 'pending';
        statusSpan.textContent = todo.isCompleted ? 'Done' : 'Pending';

        // Actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = 'Toggle';
        toggleBtn.onclick = () => toggleTodo(todo.id, textSpan, statusSpan, bullet);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTodo(todo.id);
            }
        };

        actionsDiv.appendChild(toggleBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(bullet);
        li.appendChild(textSpan);
        li.appendChild(statusSpan);
        li.appendChild(actionsDiv);
        list.appendChild(li);
    });
}

function updatePaginationInfo(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;

    // Disable/enable buttons
    document.getElementById('prev-btn').disabled = currentPage <= 1;
    document.getElementById('next-btn').disabled = currentPage >= totalPages;
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTodos();
    }
}

function goToNextPage() {
    const totalPages = parseInt(document.getElementById('page-info').textContent.split(' of ')[1]);
    if (currentPage < totalPages) {
        currentPage++;
        loadTodos();
    }
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('page-size').value);
    currentPage = 1;
    loadTodos();
}


async function addTodo(event) {
    event.preventDefault();
    const title = document.getElementById('title').value.trim();
    if (!title) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                isCompleted: false
            })
        });

        if (!response.ok) throw new Error('Failed to add todo');

        document.getElementById('title').value = '';

        // Reset to first page and reload
        currentPage = 1;
        await loadTodos();

    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Failed to add task: ' + error.message);
    }
}

// Optimized Toggle function
async function toggleTodo(id, textSpan, statusSpan, bullet) {
    try {
        const currentStatus = statusSpan.textContent.trim() === 'Done';
        const newStatus = !currentStatus;

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                isCompleted: newStatus,
                title: textSpan.textContent
            })
        });

        if (response.ok) {
            // Update just this item's UI
            statusSpan.textContent = newStatus ? 'Done' : 'Pending';
            statusSpan.className = newStatus ? 'completed' : 'pending';
            bullet.className = `bullet ${newStatus ? 'completed' : 'pending'}`;
        }
    } catch (error) {
        console.error('Toggle error:', error);
        await loadTodos(); // Fallback to full refresh if error
    }
}

async function deleteTodo(id) {
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await loadTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}
