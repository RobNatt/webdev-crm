import { TodoItem } from "../lib/types";

type Props = {
  items: TodoItem[];
  cap: number;
};

export function TodayToDoPanel({ items, cap }: Props) {
  const reachedCap = items.length >= cap;
  return (
    <div className="card">
      <div className="between">
        <h3>Today&apos;s To-Do</h3>
        <strong>
          {items.length}/{cap}
        </strong>
      </div>
      {reachedCap ? <p style={{ color: "#a33" }}>Daily cap reached. No new tasks allowed.</p> : null}
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Method</th>
            <th>Script</th>
            <th>Overdue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((todo) => (
            <tr key={todo.id}>
              <td>{todo.leadName}</td>
              <td>{todo.method}</td>
              <td>{todo.scriptName}</td>
              <td>{todo.overdue ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
