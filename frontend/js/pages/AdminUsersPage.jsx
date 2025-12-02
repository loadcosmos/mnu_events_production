import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import usersService from '../services/usersService';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'ORGANIZER', label: 'Organizer' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'EXTERNAL_PARTNER', label: 'External Partner' },
  ];

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 20,
      };

      if (search) {
        params.search = search;
      }

      const response = await usersService.getAll(params);
      const usersData = response.data || response || [];
      const meta = response.meta || {};

      // Фильтруем по роли на клиенте (если бэкенд не поддерживает фильтрацию по роли)
      let filteredUsers = Array.isArray(usersData) ? usersData : [];
      if (selectedRole) {
        filteredUsers = filteredUsers.filter((user) => user.role === selectedRole);
      }

      setUsers(filteredUsers);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error('[AdminUsers] Load users failed:', err);
      setError(err.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersService.updateRole(userId, { role: newRole });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (err) {
      console.error('[AdminUsers] Update role failed:', err);
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleDelete = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"?`)) {
      return;
    }

    try {
      await usersService.delete(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      console.error('[AdminUsers] Delete user failed:', err);
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      STUDENT: 'bg-blue-100 text-blue-800',
      ORGANIZER: 'bg-purple-100 text-purple-800',
      MODERATOR: 'bg-green-100 text-green-800',
      ADMIN: 'bg-red-100 text-red-800',
      EXTERNAL_PARTNER: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Manage Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-2">Manage Users</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage user accounts</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 liquid-glass-card rounded-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl"
                />
              </div>
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setPage(1);
                    loadUsers();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-[#1a1a1a] dark:text-white"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="liquid-glass-red-button text-white rounded-2xl">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <Card className="liquid-glass-card rounded-2xl">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="liquid-glass-card rounded-2xl hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-red-600 dark:bg-red-700 flex items-center justify-center text-white font-semibold text-lg">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.faculty && (
                        <Badge variant="outline">
                          {user.faculty}
                        </Badge>
                      )}
                      {user.emailVerified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-800">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-sm dark:bg-[#1a1a1a] dark:text-white"
                  >
                    {roles.filter((r) => r.value).map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id, user.email)}
                    className="rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

