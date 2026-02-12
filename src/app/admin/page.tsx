'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Calendar, Check, X, Trash2, RefreshCw, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'users'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/users'),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADA' }),
      });

      if (res.ok) {
        toast.success('Reserva aprovada!');
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJEITADA' }),
      });

      if (res.ok) {
        toast.success('Reserva rejeitada');
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao rejeitar');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Excluir esta reserva?')) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Reserva excluída');
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'PENDENTE');
  const stats = {
    totalBookings: bookings.length,
    pending: pendingBookings.length,
    totalUsers: users.length,
    professors: users.filter(u => u.role === 'PROFESSOR').length,
    students: users.filter(u => u.role === 'ALUNO').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários e reservas do sistema</p>
          
          <div className="flex gap-4 mt-4">
            <Link href="/admin/usuarios" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
              Gerenciar Usuários
            </Link>
            <Link href="/admin/salas" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
              Gerenciar Salas
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="text-3xl font-black">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Reservas</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
            <div className="text-3xl font-black text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pendentes</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="text-3xl font-black text-blue-800">{stats.totalUsers}</div>
            <div className="text-sm text-blue-700">Total Usuários</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="text-3xl font-black text-green-800">{stats.professors}</div>
            <div className="text-sm text-green-700">Professores</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="text-3xl font-black text-purple-800">{stats.students}</div>
            <div className="text-sm text-purple-700">Alunos</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <Calendar size={20} className="inline mr-2" />
            Reservas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <Users size={20} className="inline mr-2" />
            Usuários
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {pendingBookings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Pendentes de Aprovação</h2>
                <div className="grid gap-4">
                  {pendingBookings.map((booking) => (
                    <div key={booking.id} className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-300">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{booking.course}</h3>
                          <p className="text-gray-700">{booking.professor.name}</p>
                          <div className="mt-2 text-sm text-gray-600">
                            {new Date(booking.date).toLocaleDateString('pt-BR')} • {booking.startTime}-{booking.endTime} • {booking.room.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(booking.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            <Check size={18} />
                          </button>
                          <button onClick={() => handleReject(booking.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-4">Todas as Reservas</h2>
            <div className="bg-white rounded-xl overflow-hidden border-2">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Disciplina</th>
                    <th className="px-6 py-4 text-left">Professor</th>
                    <th className="px-6 py-4 text-left">Data</th>
                    <th className="px-6 py-4 text-left">Horário</th>
                    <th className="px-6 py-4 text-left">Sala</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{booking.course}</td>
                      <td className="px-6 py-4">{booking.professor.name}</td>
                      <td className="px-6 py-4">{new Date(booking.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">{booking.startTime}-{booking.endTime}</td>
                      <td className="px-6 py-4">{booking.room.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          booking.status === 'APROVADA' ? 'bg-green-100 text-green-800' :
                          booking.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteBooking(booking.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="bg-white rounded-xl overflow-hidden border-2">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Nome</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">CPF</th>
                    <th className="px-6 py-4 text-left">Tipo</th>
                    <th className="px-6 py-4 text-left">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.cpf}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{user._count.bookingsCreated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
