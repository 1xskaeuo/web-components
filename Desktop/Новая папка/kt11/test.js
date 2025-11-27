describe('TaskList Component', function() {
    let taskList;

    beforeEach(function() {
        taskList = document.createElement('task-list');
        document.body.appendChild(taskList);
    });

    afterEach(function() {
        document.body.removeChild(taskList);
    });

    describe('Adding tasks', function() {
        it('should add a new task to the list', function() {
            taskList.addTask('Test Task');
            const tasks = taskList.getTasks();
            chai.expect(tasks.length).to.equal(1);
            chai.expect(tasks[0].text).to.equal('Test Task');
            chai.expect(tasks[0].completed).to.equal(false);
        });

        it('should add multiple tasks', function() {
            taskList.addTask('Task 1');
            taskList.addTask('Task 2');
            taskList.addTask('Task 3');
            const tasks = taskList.getTasks();
            chai.expect(tasks.length).to.equal(3);
        });
    });

    describe('Deleting tasks', function() {
        it('should delete a task from the list', function() {
            taskList.addTask('Task to delete');
            const taskId = taskList.getTasks()[0].id;
            taskList.deleteTask(taskId);
            const tasks = taskList.getTasks();
            chai.expect(tasks.length).to.equal(0);
        });

        it('should delete correct task when multiple exist', function() {
            taskList.addTask('Task 1');
            taskList.addTask('Task 2');
            taskList.addTask('Task 3');
            const taskId = taskList.getTasks()[1].id;
            taskList.deleteTask(taskId);
            const tasks = taskList.getTasks();
            chai.expect(tasks.length).to.equal(2);
            chai.expect(tasks[0].text).to.equal('Task 1');
            chai.expect(tasks[1].text).to.equal('Task 3');
        });
    });

    describe('Toggling task completion', function() {
        it('should mark task as completed', function() {
            taskList.addTask('Task to complete');
            const taskId = taskList.getTasks()[0].id;
            taskList.toggleTask(taskId);
            const task = taskList.getTaskById(taskId);
            chai.expect(task.completed).to.equal(true);
        });

        it('should toggle task completion state', function() {
            taskList.addTask('Toggle task');
            const taskId = taskList.getTasks()[0].id;
            taskList.toggleTask(taskId);
            chai.expect(taskList.getTaskById(taskId).completed).to.equal(true);
            taskList.toggleTask(taskId);
            chai.expect(taskList.getTaskById(taskId).completed).to.equal(false);
        });
    });

    describe('List display after changes', function() {
        it('should correctly display tasks after adding', function() {
            taskList.addTask('Display Test');
            const listItems = taskList.querySelectorAll('.task-item');
            chai.expect(listItems.length).to.equal(1);
        });

        it('should correctly display tasks after deletion', function() {
            taskList.addTask('Task 1');
            taskList.addTask('Task 2');
            const taskId = taskList.getTasks()[0].id;
            taskList.deleteTask(taskId);
            const listItems = taskList.querySelectorAll('.task-item');
            chai.expect(listItems.length).to.equal(1);
        });

        it('should correctly display completed state', function() {
            taskList.addTask('Complete me');
            const taskId = taskList.getTasks()[0].id;
            taskList.toggleTask(taskId);
            const taskText = taskList.querySelector('.task-text');
            chai.expect(taskText.classList.contains('completed')).to.equal(true);
        });
    });
});