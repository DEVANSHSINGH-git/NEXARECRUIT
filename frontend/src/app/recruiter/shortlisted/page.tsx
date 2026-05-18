'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, CheckSquare, Brain, LogOut,
  Star, Mail, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatScore, getScoreColor, formatDate } from '@/lib/utils';

export default function ShortlistedPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'RECRUITER') {
      router.push('/login');
      return;
    }
    fetchShortlisted();
  }, [user, router]);

  const fetchShortlisted = async () => {
    try {
      const response = await api.get('/recruiter/shortlisted');
      setShortlisted(response.data.data);
    } catch {
      toast.error('Failed to load shortlisted candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Brain className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-lg">NexaRecruit</span>
        </div>
        <nav className="px-4 py-6 space-y-1">
          <Link href="/recruiter/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/recruiter/candidates" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Users className="w-5 h-5" />
            <span>Candidates</span>
          </Link>
          <Link href="/recruiter/shortlisted" className="flex items-center gap-3 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium">
            <CheckSquare className="w-5 h-5" />
            <span>Shortlisted</span>
          </Link>
        </nav>
        <div className="absolute bottom-0 w-full px-4 py-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shortlisted Candidates</h1>
              <p className="text-gray-600 mt-1">{shortlisted.length} candidates shortlisted</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse h-24" />
              ))}
            </div>
          ) : shortlisted.length === 0 ? (
            <div className="card text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlisted candidates yet</h3>
              <p className="text-gray-600 mb-4">Go to candidates and shortlist top performers</p>
              <Link href="/recruiter/candidates" className="btn-primary inline-block">
                Browse Candidates
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {shortlisted.map((item) => (
                <div key={item.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {item.evaluation?.resume?.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.evaluation?.resume?.user?.name || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {item.evaluation?.resume?.user?.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(item.evaluation?.atsScore || 0)}`}>
                        {formatScore(item.evaluation?.atsScore || 0)}
                      </div>
                      <p className="text-xs text-gray-500">ATS Score</p>
                      {item.evaluation?.jobDescription?.title && (
                        <p className="text-xs text-gray-400 mt-1">{item.evaluation.jobDescription.title}</p>
                      )}
                    </div>
                  </div>
                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 italic">"{item.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
