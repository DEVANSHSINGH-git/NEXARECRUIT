'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, BarChart3, Target,
  User, LogOut, Brain, Upload, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatScore, getScoreColor, formatDate } from '@/lib/utils';

interface DashboardData {
  resumes: any[];
  evaluations: any[];
  recommendations: any[];
  stats: {
    totalEvaluations: number;
    averageScore: number;
    totalResumes: number;
  };
}

export default function CandidateDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'CANDIDATE') {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [user, router]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/candidate/dashboard');
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
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
          <SidebarLink href="/candidate/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active />
          <SidebarLink href="/candidate/upload" icon={<Upload className="w-5 h-5" />} label="Upload Resume" />
          <SidebarLink href="/candidate/evaluations" icon={<BarChart3 className="w-5 h-5" />} label="Evaluations" />
          <SidebarLink href="/candidate/recommendations" icon={<Target className="w-5 h-5" />} label="Career Guide" />
          <SidebarLink href="/candidate/profile" icon={<User className="w-5 h-5" />} label="Profile" />
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
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Candidate Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <div className="w-9 h-9 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<FileText className="w-5 h-5 text-primary-600" />}
              label="Total Resumes"
              value={data?.stats.totalResumes || 0}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-green-600" />}
              label="Evaluations"
              value={data?.stats.totalEvaluations || 0}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-purple-600" />}
              label="Average Score"
              value={formatScore(data?.stats.averageScore || 0)}
              valueClass={getScoreColor(data?.stats.averageScore || 0)}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/candidate/upload" className="card hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload Resume</h3>
                <p className="text-sm text-gray-600">Upload a new resume for evaluation</p>
              </div>
            </Link>
            <Link href="/candidate/evaluations" className="card hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">New Evaluation</h3>
                <p className="text-sm text-gray-600">Evaluate your resume against a job description</p>
              </div>
            </Link>
          </div>

          {/* Recent Evaluations */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Evaluations</h2>
            {data?.evaluations && data.evaluations.length > 0 ? (
              <div className="space-y-3">
                {data.evaluations.map((evaluation: any) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{evaluation.jobDescription?.title || 'Untitled'}</p>
                      <p className="text-sm text-gray-500">{formatDate(evaluation.createdAt)}</p>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(evaluation.atsScore)}`}>
                      {formatScore(evaluation.atsScore)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No evaluations yet. Upload a resume and start your first evaluation!</p>
              </div>
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

function StatCard({ icon, label, value, valueClass = '' }: { icon: React.ReactNode; label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${valueClass || 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:block w-64 bg-white border-r" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="h-64 skeleton rounded-xl" />
      </main>
    </div>
  );
}
