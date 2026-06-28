'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  FileText,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import SelectField from '@/components/SelectField';
import { readApiError } from '@/lib/api-client';

type Student = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  department?: string | null;
  createdAt?: string;
};

type PaginatedStudentsResponse = {
  data: Student[];
  total: number;
  page: number;
  pageCount: number;
  departments?: string[];
};

const emptyForm = {
  name: '',
  email: '',
  cpf: '',
  course: '',
};

const pageSize = 10;

function nameFromEmail(email: string) {
  const prefix = email.split('@')[0] || 'Aluno';
  return prefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Aluno';
}

export default function AdminAlunosPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [importCourse, setImportCourse] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('TODOS');
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemo = session?.user?.role === 'DEMO';

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [page, courseFilter, debouncedSearchTerm]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role: 'ALUNO',
        paginated: 'true',
        page: String(page),
        limit: String(pageSize),
      });

      if (courseFilter !== 'TODOS') {
        params.set('department', courseFilter);
      }

      const search = debouncedSearchTerm.trim();
      if (search) {
        params.set('search', search);
      }

      const res = await fetch(`/api/users?${params.toString()}`);

      if (res.ok) {
        const payload = (await res.json()) as PaginatedStudentsResponse;
        setStudents(payload.data);
        setTotalStudents(payload.total);
        setPageCount(payload.pageCount);
        setAvailableCourses(payload.departments || []);
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar os alunos'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar os alunos. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const courseOptions = [
    { value: 'TODOS', label: 'Todos os cursos' },
    ...availableCourses.map((course) => ({ value: course, label: course })),
  ];

  useEffect(() => {
    setPage(1);
  }, [courseFilter, debouncedSearchTerm]);

  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = students;
  const endIndex = Math.min(startIndex + students.length, totalStudents);

  const createStudent = async ({
    name,
    email,
    cpf,
    course,
  }: {
    name: string;
    email: string;
    cpf: string;
    course: string;
  }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        cpf,
        role: 'ALUNO',
        department: course,
      }),
    });

    if (!res.ok) {
      throw new Error(await readApiError(res, 'Não foi possível cadastrar o aluno'));
    }
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    const cpf = formData.cpf.replace(/\D/g, '');
    const email = formData.email.trim().toLowerCase();
    const name = formData.name.trim();
    const course = formData.course.trim();

    if (!name || !email || cpf.length !== 11 || !course) {
      toast.error('Informe nome, email, curso e CPF com 11 números.');
      return;
    }

    setSaving(true);
    try {
      await createStudent({ name, email, cpf, course });
      toast.success('Aluno cadastrado!');
      setFormData(emptyForm);
      await fetchStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível cadastrar o aluno');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (student: Student) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      email: student.email,
      cpf: student.cpf,
      course: student.department || '',
    });
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setEditFormData(emptyForm);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingStudent) return;

    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    const cpf = editFormData.cpf.replace(/\D/g, '');
    const email = editFormData.email.trim().toLowerCase();
    const name = editFormData.name.trim();
    const course = editFormData.course.trim();

    if (!name || !email || cpf.length !== 11 || !course) {
      toast.error('Informe nome, email, curso e CPF com 11 números.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          cpf,
          role: 'ALUNO',
          department: course,
        }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, 'Não foi possível atualizar o aluno'));
      }

      toast.success('Aluno atualizado!');
      closeEditModal();
      await fetchStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o aluno');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    setDeletingStudent(student);
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${deletingStudent.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, 'Não foi possível excluir o aluno'));
      }

      toast.success('Aluno excluído!');
      setDeletingStudent(null);
      await fetchStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o aluno');
    } finally {
      setSaving(false);
    }
  };

  const resetImport = () => {
    setSelectedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cleanCsvCell = (value: string) =>
    value
      .trim()
      .replace(/^"+|"+$/g, '')
      .trim();

  const parseCsv = (content: string, course: string) => {
    const rows = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      throw new Error('O arquivo CSV está vazio. Use o modelo email,cpf.');
    }

    return rows.map((line, index) => {
      const columns = line.split(',').map(cleanCsvCell);

      if (columns.length !== 2) {
        throw new Error(`Linha ${index + 1} fora do modelo. Use exatamente: email,cpf`);
      }

      const [email, cpfRaw] = columns;
      const cpf = cpfRaw.replace(/\D/g, '');

      if (!/^[^\s@]+@aluno\.fmpsc\.edu\.br$/i.test(email) || cpf.length !== 11) {
        throw new Error(`Linha ${index + 1} inválida. Use email de aluno e CPF com 11 números.`);
      }

      return {
        email: email.toLowerCase(),
        cpf,
        name: nameFromEmail(email),
        course,
      };
    });
  };

  const handleCsvFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      resetImport();
      return;
    }

    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFileName(file.name);

    const course = importCourse.trim();

    if (!course) {
      alert('Informe o curso antes de importar o CSV.');
      resetImport();
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Arquivo inválido. Envie um CSV no modelo: vitor@aluno.fmpsc.edu.br,10922543211');
      resetImport();
      return;
    }

    let rows: Array<{ name: string; email: string; cpf: string; course: string }> = [];

    try {
      rows = parseCsv(await file.text(), course);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Arquivo inválido. Use o modelo email,cpf.');
      resetImport();
      return;
    }

    setSaving(true);
    let created = 0;
    const failures: string[] = [];

    for (const row of rows) {
      try {
        await createStudent(row);
        created += 1;
      } catch (error) {
        failures.push(`${row.email}: ${error instanceof Error ? error.message : 'erro'}`);
      }
    }

    if (created > 0) {
      toast.success(`${created} aluno(s) importado(s).`);
      await fetchStudents();
    }

    if (failures.length > 0) {
      toast.error(`${failures.length} linha(s) não foram importadas. Verifique duplicados ou emails inválidos.`);
    }

    resetImport();
    setSaving(false);
  };

  const downloadExample = () => {
    const blob = new Blob(['vitor@aluno.fmpsc.edu.br,10922543211'], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-alunos.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-gray-900">
              <Users className="text-primary-600" size={36} />
              Alunos
            </h1>
            <p className="mt-2 text-gray-600">Cadastre alunos manualmente ou importe em lote por email, CPF e curso.</p>
          </div>
          <button
            onClick={downloadExample}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-5 py-3 font-bold text-primary-700 hover:border-primary-400"
          >
            <Download size={18} />
            Baixar Modelo
          </button>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900">
              <UserPlus size={20} className="text-primary-600" />
              Cadastro Manual
            </h2>
            <form onSubmit={handleManualSubmit} className="grid gap-3">
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Nome do aluno"
                maxLength={100}
                disabled={isDemo}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value.replace(/\s/g, '') })}
                placeholder="aluno@aluno.fmpsc.edu.br"
                disabled={isDemo}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
              />
              <input
                type="text"
                value={formData.course}
                onChange={(event) => setFormData({ ...formData, course: event.target.value })}
                placeholder="Curso do aluno"
                maxLength={80}
                disabled={isDemo}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
              />
              <input
                type="text"
                inputMode="numeric"
                value={formData.cpf}
                onChange={(event) => setFormData({ ...formData, cpf: event.target.value.replace(/\D/g, '').slice(0, 11) })}
                placeholder="CPF sem pontos"
                maxLength={11}
                disabled={isDemo}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isDemo || saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3 font-bold text-white hover:shadow-lg disabled:opacity-60"
              >
                <UserPlus size={18} />
                {saving ? 'Salvando...' : 'Cadastrar Aluno'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900">
              <Upload size={20} className="text-primary-600" />
              Importação
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFile}
              disabled={isDemo || saving}
              className="hidden"
            />
            <input
              type="text"
              value={importCourse}
              onChange={(event) => setImportCourse(event.target.value)}
              placeholder="Curso dos alunos importados"
              maxLength={80}
              disabled={isDemo || saving}
              className="mb-3 w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDemo || saving}
              className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/60 px-5 py-6 text-center transition-all hover:border-primary-400 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-sm">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-base font-black text-primary-900">
                  {saving ? 'Importando arquivo...' : 'Selecionar CSV'}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary-700">
                  Modelo obrigatório: email,cpf
                </p>
              </div>
            </button>

            {selectedFileName && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-2">
                <span className="min-w-0 truncate text-sm font-bold text-gray-700">{selectedFileName}</span>
                <button
                  type="button"
                  onClick={resetImport}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-red-600"
                  aria-label="Limpar arquivo"
                  title="Limpar arquivo"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <p className="mt-3 text-xs font-semibold text-gray-500">
              Informe o curso acima. O arquivo deve ser `.csv`, sem cabeçalho, com uma linha por aluno. Exemplo: vitor@aluno.fmpsc.edu.br,10922543211
            </p>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-gray-100 p-4 xl:grid-cols-[1fr_260px_320px] xl:items-center">
            <div>
              <h2 className="text-xl font-black text-gray-900">Alunos Cadastrados</h2>
              <p className="text-sm font-semibold text-gray-500">
                {totalStudents > 0
                  ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalStudents} aluno(s)`
                  : 'Nenhum aluno encontrado'}
              </p>
            </div>
            <SelectField
              value={courseFilter}
              placeholder="Todos os cursos"
              options={courseOptions}
              compact
              onChange={setCourseFilter}
            />
            <label className="relative block">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar aluno..."
                className="w-full rounded-xl border-2 border-gray-200 py-2.5 pl-10 pr-4 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                <tr>
                  <th className="px-5 py-4 text-left">Ações</th>
                  <th className="px-5 py-4 text-left">Nome</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  <th className="px-5 py-4 text-left">Curso</th>
                  <th className="px-5 py-4 text-left">CPF</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          disabled={isDemo || saving}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Editar ${student.name}`}
                          title="Editar aluno"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={isDemo || saving}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Excluir ${student.name}`}
                          title="Excluir aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">{student.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{student.email}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-700">{student.department || 'Não informado'}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{student.cpf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalStudents > pageSize && (
            <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-600">
                Página {currentPage} de {pageCount}
              </p>
              <div className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="min-w-[92px] px-2 text-center text-sm font-black text-gray-700">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                  disabled={currentPage >= pageCount}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>

        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Editar Aluno</h2>
                  <p className="text-sm text-gray-600">Atualize dados de acesso, identificação e curso.</p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Fechar edição"
                  title="Fechar"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="grid gap-4">
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                  placeholder="Nome do aluno"
                  maxLength={100}
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                />
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(event) => setEditFormData({ ...editFormData, email: event.target.value.replace(/\s/g, '') })}
                  placeholder="aluno@aluno.fmpsc.edu.br"
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                />
                <input
                  type="text"
                  value={editFormData.course}
                  onChange={(event) => setEditFormData({ ...editFormData, course: event.target.value })}
                  placeholder="Curso do aluno"
                  maxLength={80}
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={editFormData.cpf}
                  onChange={(event) => setEditFormData({ ...editFormData, cpf: event.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="CPF sem pontos"
                  maxLength={11}
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:opacity-60"
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={saving}
                    className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3 font-bold text-white transition-all hover:shadow-lg disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deletingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Excluir Aluno</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Esta ação remove o acesso do aluno e não pode ser desfeita.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingStudent(null)}
                  disabled={saving}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-60"
                  aria-label="Fechar exclusão"
                  title="Fechar"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="rounded-xl border-2 border-red-100 bg-red-50 p-4">
                <p className="font-black text-red-900">{deletingStudent.name}</p>
                <p className="mt-1 break-words text-sm font-semibold text-red-700">{deletingStudent.email}</p>
                <p className="mt-1 text-sm font-semibold text-red-700">
                  {deletingStudent.department || 'Curso não informado'}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setDeletingStudent(null)}
                  disabled={saving}
                  className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteStudent}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Excluindo...' : 'Excluir Aluno'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
