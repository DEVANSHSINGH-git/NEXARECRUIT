'use client';

import { useState, useEffect } from 'react';
import { Search, Users, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatScore, getScoreColor, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function RecruiterCandidatesPage() {
  const { user } = useAuthStore();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page]);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/recruiter/candidates', {
        params: { page: pagination.page, limit: 20 },
      });
      setCandidates(response.data.data.candidates);
      setPagination(response.data.data.pagination);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-600">{pagination.total} candidates in the system</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name or email..."
                className="input-field pl-10"
              />
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => {
            const latestEval = candidate.resumes?.[0]?.evaluations?.[0];
            return (
              <div
                key={candidate.id}
                className="card hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                    {candidate.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-500">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {latestEval ? (
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getScoreColor(latestEval.atsScore)}`}>
                        {formatScore(latestEval.atsScore)}
                      </p>
                      <p className="text-xs text-gray-500">Latest Score</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No evaluation</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(candidate.createdAt)}</span>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
              className="btn-secondary text-sm"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm"
            >
              Next
            </button>
          </div>
        )}

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No candidates found</p>
          </div>
        )}
      </div>
    </div>
  );
}
