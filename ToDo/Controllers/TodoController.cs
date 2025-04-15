using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[Route("api/todos")]
[ApiController]
public class TodoController : ControllerBase
{
	private readonly AppDbContext _context;

	public TodoController(AppDbContext context)
	{
		_context = context;
	}

    [HttpGet]
    public async Task<ActionResult> GetTodos(int page = 1, int pageSize = 10)
    {
        var totalCount = await _context.TodoItems.CountAsync();
        var items = await _context.TodoItems
            .OrderByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpPost]
    public async Task<ActionResult<TodoItem>> PostTodo(TodoItem todo)
    {
        _context.TodoItems.Add(todo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTodos), new { page = 1, pageSize = 10 }, todo);
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }

    [HttpGet("{id}")]
	public async Task<ActionResult<TodoItem>> GetTodo(int id)
	{
		var todo = await _context.TodoItems.FindAsync(id);
		if (todo == null)
		{
			return NotFound();
		}

		return todo;
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> DeleteTodo(int id)
	{
		var todo = await _context.TodoItems.FindAsync(id);
		if (todo == null)
			return NotFound();

		_context.TodoItems.Remove(todo);
		await _context.SaveChangesAsync();

		return NoContent();
	}

    [HttpPut("{id}")]
    public async Task<ActionResult<TodoItem>> PutTodo(int id, TodoItem todoUpdate)
    {
        if (id != todoUpdate.Id)
            return BadRequest();

        var existingTodo = await _context.TodoItems.FindAsync(id);
        if (existingTodo == null)
            return NotFound();

        existingTodo.IsCompleted = todoUpdate.IsCompleted;

        await _context.SaveChangesAsync();

        return existingTodo;
    }

}

