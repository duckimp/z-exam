import { useState, useEffect } from 'react'
import { useForm, router, Head, Link, usePage } from '@inertiajs/react'
import {
  ShieldCheck, Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, KeyRound
} from 'lucide-react'
import AdminLayout from '@/Layouts/AdminLayout'

export default function UsersPage({ users, roles, filters }) {
  const [search, setSearch] = useState(filters?.search || '')
  const [showModalUser, setShowModalUser] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  // Form for user CRUD
  const formUser = useForm({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'guru'
  })

  // Sync search query to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      router.get('/users', { search }, {
        preserveState: true,
        replace: true
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleOpenAddUser = () => {
    setEditingUser(null)
    formUser.setData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'guru'
    })
    formUser.clearErrors()
    setShowModalUser(true)
  }

  const handleOpenEditUser = (u) => {
    const uRole = u.roles?.[0]?.name || 'guru'
    setEditingUser(u)
    formUser.setData({
      name: u.name,
      username: u.username || '',
      email: u.email,
      password: '',
      role: uRole
    })
    formUser.clearErrors()
    setShowModalUser(true)
  }

  const submitUser = (e) => {
    e.preventDefault()
    if (editingUser) {
      formUser.put(`/users/${editingUser.id}`, {
        onSuccess: () => {
          setShowModalUser(false)
          formUser.reset()
        }
      })
    } else {
      formUser.post('/users', {
        onSuccess: () => {
          setShowModalUser(false)
          formUser.reset()
        }
      })
    }
  }

  const handleDeleteUser = (userObj) => {
    if (userObj.id === usePage().props.auth.user.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.')
      return
    }
    setUserToDelete(userObj)
  }

  const confirmDeleteUser = () => {
    if (!userToDelete) return
    router.delete(`/users/${userToDelete.id}`, {
      onSuccess: () => {
        setUserToDelete(null)
      }
    })
  }

  // Helpers to render roles neatly
  const getRoleLabel = (roleList = []) => {
    const roleName = roleList[0]?.name
    if (roleName === 'super_admin') return <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black rounded-lg">ADMIN</span>
    if (roleName === 'guru') return <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-black rounded-lg">GURU</span>
    if (roleName === 'pengawas') return <span className="px-2 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 text-[10px] font-black rounded-lg">PENGAWAS</span>
    return <span className="text-slate-400">—</span>
  }

  // To check logged-in user to prevent deleting self
  const currentUserId = router.page?.props?.auth?.user?.id

  return (
    <AdminLayout>
      <Head title="Manajemen User" />
      <div className="animate-fade-in">
        
        {/* Header */}
        <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="page-title text-2xl font-black text-slate-800">Manajemen User</h1>
            <p className="page-desc text-sm text-slate-500 mt-1">Kelola data administrator, guru mata pelajaran, dan pengawas ujian.</p>
          </div>
          <button className="btn btn-primary py-2.5" onClick={handleOpenAddUser}>
            <Plus size={14} className="mr-1.5" /> Tambah User
          </button>
        </div>

        {/* User Panel */}
        <div className="panel bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Action Bar */}
          <div className="panel-header px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 flex items-center max-w-md w-full">
              <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                className="input w-full"
                placeholder="Cari Nama, Username, atau Email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 bg-slate-50/30 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nama Lengkap</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-xs font-mono text-slate-400">
                      Tidak ada data user.
                    </td>
                  </tr>
                ) : (
                  users.data.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="p-4 pl-6 font-bold text-slate-800">{u.name}</td>
                      <td className="p-4 font-mono text-slate-600">{u.username || '—'}</td>
                      <td className="p-4 text-slate-500 font-semibold">{u.email}</td>
                      <td className="p-4">{getRoleLabel(u.roles)}</td>
                      <td className="p-4 pr-6 text-right flex items-center justify-end gap-1">
                        <button 
                          className="btn btn-sm btn-ghost p-2 text-slate-400 hover:text-indigo-600 cursor-pointer" 
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className={`btn btn-sm btn-ghost p-2 ${u.id === currentUserId ? 'opacity-30 cursor-not-allowed text-slate-350' : 'text-slate-400 hover:text-red-650 cursor-pointer'}`} 
                          onClick={() => u.id !== currentUserId && handleDeleteUser(u)}
                          disabled={u.id === currentUserId}
                          title={u.id === currentUserId ? 'Tidak bisa menghapus diri sendiri' : 'Hapus User'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {users.total > 0 && (
            <div className="panel-header px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono">Total: {users.total} user</span>
              <div className="flex gap-2">
                <Link 
                  href={users.prev_page_url || '#'} 
                  only={['users']}
                  className={`btn btn-sm btn-outline px-3 py-1.5 ${!users.prev_page_url ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <ChevronLeft size={14} />
                </Link>
                <Link 
                  href={users.next_page_url || '#'} 
                  only={['users']}
                  className={`btn btn-sm btn-outline px-3 py-1.5 ${!users.next_page_url ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal: User Form ── */}
        {showModalUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-700">{editingUser ? 'Edit Data User' : 'Tambah User Baru'}</h3>
                <button onClick={() => setShowModalUser(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitUser} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formUser.data.name} 
                    onChange={e => formUser.setData('name', e.target.value)} 
                    required 
                  />
                  {formUser.errors.name && <span className="text-xs text-red-655 font-bold">{formUser.errors.name}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Username</label>
                    <input 
                      type="text" 
                      className="input font-mono" 
                      value={formUser.data.username} 
                      onChange={e => formUser.setData('username', e.target.value)} 
                      required 
                    />
                    {formUser.errors.username && <span className="text-xs text-red-655 font-bold">{formUser.errors.username}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Role Akses</label>
                    <select 
                      className="input bg-white font-semibold text-sm" 
                      value={formUser.data.role} 
                      onChange={e => formUser.setData('role', e.target.value)}
                      required
                    >
                      <option value="guru">Guru</option>
                      <option value="pengawas">Pengawas</option>
                    </select>
                    {formUser.errors.role && <span className="text-xs text-red-655 font-bold">{formUser.errors.role}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Alamat Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={formUser.data.email} 
                    onChange={e => formUser.setData('email', e.target.value)} 
                    required 
                  />
                  {formUser.errors.email && <span className="text-xs text-red-655 font-bold">{formUser.errors.email}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">
                    Password {editingUser && <span className="text-[10px] text-slate-400 font-semibold font-sans">(Kosongkan jika tidak diubah)</span>}
                  </label>
                  <input 
                    type="password" 
                    className="input" 
                    value={formUser.data.password} 
                    onChange={e => formUser.setData('password', e.target.value)} 
                    required={!editingUser} 
                  />
                  {formUser.errors.password && <span className="text-xs text-red-655 font-bold">{formUser.errors.password}</span>}
                </div>

                <div className="flex justify-end gap-2.5 mt-4 border-t border-slate-100 pt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModalUser(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={formUser.processing}>
                    {formUser.processing ? 'Menyimpan...' : 'Simpan User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Konfirmasi Hapus ── */}
        {userToDelete && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Hapus User?</h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                    Apakah Anda yakin ingin menghapus user <span className="text-slate-800 font-bold">"{userToDelete.name}"</span>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-2.5 w-full mt-2">
                  <button type="button" className="btn btn-outline flex-1 py-2.5 cursor-pointer" onClick={() => setUserToDelete(null)}>
                    Batal
                  </button>
                  <button type="button" className="btn bg-red-600 hover:bg-red-700 text-white flex-1 py-2.5 font-bold rounded-lg shadow-sm cursor-pointer" onClick={confirmDeleteUser}>
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
