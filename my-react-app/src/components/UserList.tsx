import React, { useState } from 'react';
import {
  useGetUsersQuery,
  useAddUserMutation,
  useEditUserMutation,
  useDeleteUserMutation,
  useOnUserAddedSubscription,
  type GetUsersQuery,
} from '../generated/graphql';
import './UserList.css';

export const UserList = () => {
  const { data, loading, error, refetch } = useGetUsersQuery();
  const [addUser] = useAddUserMutation();
  const [editUser] = useEditUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [formData, setFormData] = useState({
    firstName: '',
    age: '',
    companyId: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Live updates: when a user is added elsewhere, refetch the list
  useOnUserAddedSubscription({
    onData: () => {
      refetch();
    },
  });

  type RawUser = NonNullable<NonNullable<GetUsersQuery['users']>>[number];
  type UserItem = { id: string } & NonNullable<NonNullable<GetUsersQuery['users']>[number]>;
  const users: UserItem[] = (data?.users ?? []).flatMap((u: RawUser) =>
    u && u.id ? [{ ...(u as UserItem), id: u.id }] : [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await editUser({
          variables: {
            id: editingId,
            firstName: formData.firstName || undefined,
            age: formData.age ? parseInt(formData.age) : undefined,
            companyId: formData.companyId || undefined,
          },
        });
        setEditingId(null);
      } else {
        await addUser({
          variables: {
            firstName: formData.firstName,
            age: parseInt(formData.age),
            companyId: formData.companyId || undefined,
          },
        });
      }
      
      setFormData({ firstName: '', age: '', companyId: '' });
      refetch();
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      firstName: user.firstName,
      age: user.age.toString(),
      companyId: user.companyId || '',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">Error loading users: {error.message}</div>;

  return (
    <div className="user-list-container">
      <h2>Users</h2>
      
      <form onSubmit={handleSubmit} className="user-form">
        <h3>{editingId ? 'Edit User' : 'Add New User'}</h3>
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required={!editingId}
        />
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          required={!editingId}
        />
        <input
          type="text"
          placeholder="Company ID (optional)"
          value={formData.companyId}
          onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
        />
        <div className="form-buttons">
          <button type="submit">{editingId ? 'Update' : 'Add'} User</button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ firstName: '', age: '', companyId: '' });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <h3>{user.firstName}</h3>
            <p>Age: {user.age}</p>
            {user.company && (
              <p className="company-info">
                Company: {user.company.name} - {user.company.description}
              </p>
            )}
            <div className="card-actions">
              <button onClick={() => handleEdit(user)} className="edit-btn">
                Edit
              </button>
              <button onClick={() => handleDelete(user.id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
