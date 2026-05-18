'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BarChart3, CheckSquare,
  Brain, LogOut, Menu, X, TrendingUp, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatScore, getScoreColor, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalCandidates: number;
    totalEvaluations: number;
    averageScore: number;
  };
  recentEvaluations: any[];
  topCandidates: any[];
}

export default function RecruiterDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'RECRUITER') {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [user, router]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/recruiter/dashboard');
      setData(response.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlist = async (evaluationId: string) => {
    try {
      await api.post('/recruiter/shortlist', { evaluationId });
      toast.success('Candidate shortlisted!');
    } catch {
      toast.error('Failed to shortlist');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="hidden lg:block w-64 bg-white border-r" />
        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
          <div className="h-96 skeleton rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Brain className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-lg">NexaRecruit</span>
        </div>
        <nav className="px-4 py-6 space-y-1">
          <SidebarLink href="/recruiter/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active />
          <SidebarLink href="/recruiter/candidates" icon={<Users className="w-5 h-5" />} label="Candidates" />
          <SidebarLink href="/recruiter/evaluations" icon={<BarChart3 className="w-5 h-5" />} label="Evaluations" />
          <SidebarLink href="/recruiter/shortlisted" icon={<CheckSquare className="w-5 h-5" />} label="Shortlisted" />
        </nav>
        <div className="absolute bottom-0 w-full px-4 py-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Recruiter Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{data?.stats.totalCandidates || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Evaluations</p>
                <p className="text-2xl font-bold text-gray-900">{data?.stats.totalEvaluations || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data?.stats.averageScore || 0)}`}>
                  {formatScore(data?.stats.averageScore || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Top Candidates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Candidates</h2>
              <Link href="/recruiter/candidates" className="text-sm text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
            {data?.topCandidates && data.topCandidates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Candidate</th>
                      <th className="pb-3 font-medium">Position</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.topCandidates.map((candidate: any) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {candidate.resume?.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{candidate.resume?.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{candidate.resume?.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-700">{candidate.jobDescription?.title || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`font-bold ${getScoreColor(candidate.atsScore)}`}>
                            {formatScore(candidate.atsScore)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-500">{formatDate(candidate.createdAt)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleShortlist(candidate.id)}
                            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                          >
                            Shortlist
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No candidates evaluated yet</p>
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Evaluations</h2>
            {data?.recentEvaluations && data.recentEvaluations.length > 0 ? (
              <div className="space-y-3">
                {data.recentEvaluations.slice(0, 5).map((evaluation: any) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {evaluation.resume?.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{evaluation.resume?.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{evaluation.jobDescription?.title || 'Untitled'}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${getScoreColor(evaluation.atsScore)}`}>
                      {formatScore(evaluation.atsScore)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-gray-500 text-sm">No recent evaluations</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
