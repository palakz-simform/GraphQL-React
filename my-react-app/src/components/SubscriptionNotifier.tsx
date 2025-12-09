import { useOnUserAddedSubscription } from '../generated/graphql';
import './SubscriptionNotifier.css';

export const SubscriptionNotifier = () => {
  const { data: subscriptionData } = useOnUserAddedSubscription({
    onData: ({ data }) => {
      // Debug log to verify subscription delivery
      console.debug('[subscription] userAdded', (data as any)?.userAdded ?? null);
    },
    onError: (err) => {
      console.error('[subscription] error', err);
    },
  });

  if (!subscriptionData?.userAdded) {
    return null;
  }

  const newUser = subscriptionData.userAdded;

  return (
    <div className="subscription-notification">
      <div className="notification-content">
        <span className="notification-icon">🔔</span>
        <div className="notification-text">
          <strong>New User Added!</strong>
          <p>
            {newUser.firstName} (Age: {newUser.age})
            {newUser.companyId && ` - Company ID: ${newUser.companyId}`}
          </p>
        </div>
      </div>
    </div>
  );
};
