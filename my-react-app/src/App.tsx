import './App.css';
import { UserList } from './components/UserList';
import { SubscriptionNotifier } from './components/SubscriptionNotifier';

function App() {
  return (
    <div className="app-shell">
      <SubscriptionNotifier />
      <header className="app-header">
        <div>
          <p className="eyebrow">GraphQL Demo</p>
          <h1>Users & Companies</h1>
          <p className="subhead">
            Browse users, attach them to companies, and manage the data through GraphQL queries and mutations. Watch for real-time notifications when new users are added!
          </p>
        </div>
      </header>

      <main>
        <UserList />
      </main>
    </div>
  );
}

export default App;
