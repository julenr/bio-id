exports.getTasks = ctx => {
  ctx.body = 'tasks';
};

exports.updateTask = ctx => {
  ctx.body = { message: 'Task updated!', data: 'result' };
};

exports.deleteTask = ctx => {
  ctx.body = { message: 'success!' };
};

exports.createConcurrentTasks = ctx => {
  ctx.body = { message: 'Tasks created!', taskOne: 't1', taskTwo: 't2' };
};

exports.deleteConcurrentTasks = ctx => {
  ctx.body = { message: 'Tasks deleted successfully!' };
};
