'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, FileText, Target, TrendingUp, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatScore, getScoreColor, getScoreBadgeClass, formatDate } from '@/lib/utils';

interface Evaluation {
  id: string;
  atsScore: number;
  skillsMatchScore: number;
  experienceScore: number;
  domainScore: number;
  feedback: any;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  createdAt: string;
  jobDescription: { title: string; content: string };
  resume: { fileName: string };
  recommendation: any;
}

export default function EvaluationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEvaluation, setShowNewEvaluation] = useState(false);
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    fetchEvaluations();
    fetchResumes();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await api.get('/candidate/evaluations');
      setEvaluations(response.data.data);
    } catch {
      toast.error('Failed to load evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await api.get('/upload/resumes');
      setResumes(response.data.data);
    } catch {
      // Silently handle
    }
  };

  const handleNewEvaluation = async () => {
    if (!resumeId || !jobDescription) {
      toast.error('Please select a resume and enter a job description');
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await api.post('/evaluations', {
        resumeId,
        jobDescription,
        jobTitle: jobTitle || undefined,
      });
      toast.success('Evaluation complete!');
      setSelectedEvaluation(response.data.data);
      setShowNewEvaluation(false);
      fetchEvaluations();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-6"><div className="h-96 skeleton rounded-xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
            <p className="text-gray-600">AI-powered resume-job fit analysis</p>
          </div>
          <button onClick={() => setShowNewEvaluation(true)} className="btn-primary">
            New Evaluation
          </button>
        </div>

        {/* New Evaluation Form */}
        {showNewEvaluation && (
          <div className="card mb-6 border-primary-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Start New Evaluation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Resume</label>
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.fileName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title (optional)</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input-field min-h-[200px]"
                  placeholder="Paste the full job description here..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleNewEvaluation} disabled={isEvaluating} className="btn-primary">
                  {isEvaluating ? 'Evaluating...' : 'Run Evaluation'}
                </button>
                <button onClick={() => setShowNewEvaluation(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Detail View */}
        {selectedEvaluation && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedEvaluation.jobDescription?.title || 'Evaluation Results'}
              </h2>
              <button onClick={() => setSelectedEvaluation(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <ScoreCard label="ATS Score" score={selectedEvaluation.atsScore} />
              <ScoreCard label="Skills Match" score={selectedEvaluation.skillsMatchScore} />
              <ScoreCard label="Experience" score={selectedEvaluation.experienceScore} />
              <ScoreCard label="Domain Fit" score={selectedEvaluation.domainScore} />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              {selectedEvaluation.strengths && (
                <div>
                  <h3 className="font-medium text-green-700 mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {(Array.isArray(selectedEvaluation.strengths) ? selectedEvaluation.strengths : []).map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedEvaluation.weaknesses && (
                <div>
                  <h3 className="font-medium text-red-700 mb-2">Areas to Improve</h3>
                  <ul className="space-y-1">
                    {(Array.isArray(selectedEvaluation.weaknesses) ? selectedEvaluation.weaknesses : []).map((w: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✗</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Missing Skills */}
            {selectedEvaluation.missingSkills && Array.isArray(selectedEvaluation.missingSkills) && selectedEvaluation.missingSkills.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvaluation.missingSkills.map((skill: string, i: number) => (
                    <span key={i} className="badge-warning">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evaluations List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Evaluation History</h2>
          {evaluations.length > 0 ? (
            <div className="space-y-3">
              {evaluations.map((eval_item) => (
                <button
                  key={eval_item.id}
                  onClick={() => setSelectedEvaluation(eval_item)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{eval_item.jobDescription?.title || 'Untitled'}</p>
                      <p className="text-sm text-gray-500">{formatDate(eval_item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getScoreColor(eval_item.atsScore)}`}>
                      {formatScore(eval_item.atsScore)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No evaluations yet</p>
              <p className="text-sm mt-1">Run your first evaluation to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${getScoreColor(score || 0)}`}>{formatScore(score)}</p>
    </div>
  );
}
