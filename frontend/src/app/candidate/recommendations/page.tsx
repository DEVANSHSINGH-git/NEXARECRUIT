'use client';

import { useState, useEffect } from 'react';
import { Target, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RecommendationsPage() {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [targetDomain, setTargetDomain] = useState('');

  const generateRecommendations = async () => {
    if (!resumeText || resumeText.length < 50) {
      toast.error('Please paste your resume content (min 50 characters)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/candidate/recommendations', {
        resumeText,
        currentRole,
        experienceYears,
        targetDomain,
      });

      setRecommendations(response.data.data);
      toast.success('Career recommendations generated!');
    } catch (error: any) {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Career Intelligence</h1>
          <p className="text-gray-600 mt-1">AI-powered career guidance and skill gap analysis</p>
        </div>

        {!recommendations && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Career Recommendations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role (optional)</label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Frontend Developer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                    className="input-field"
                    min={0}
                    max={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Domain (optional)</label>
                  <input
                    type="text"
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    className="input-field"
                    placeholder="e.g., AI/ML, Cloud, FinTech"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume Content</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="input-field min-h-[200px]"
                  placeholder="Paste your resume content here..."
                />
              </div>
              <button onClick={generateRecommendations} disabled={isLoading} className="btn-primary w-full">
                {isLoading ? 'Analyzing...' : 'Generate Career Recommendations'}
              </button>
            </div>
          </div>
        )}

        {recommendations && (
          <div className="space-y-6">
            {/* Recommended Roles */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Recommended Roles
              </h2>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommended_roles?.map((role: string, i: number) => (
                  <span key={i} className="badge-info text-sm px-3 py-1.5">{role}</span>
                ))}
              </div>
            </div>

            {/* Career Roadmap */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Career Roadmap
              </h2>
              <div className="space-y-4">
                {recommendations.career_roadmap?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step || i + 1}
                      </div>
                      {i < (recommendations.career_roadmap.length - 1) && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900">{step.action}</p>
                      <p className="text-sm text-gray-500">{step.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                Skill Gaps to Address
              </h2>
              <div className="flex flex-wrap gap-2">
                {recommendations.skill_gaps?.map((skill: string, i: number) => (
                  <span key={i} className="badge-warning text-sm px-3 py-1.5">{skill}</span>
                ))}
              </div>
            </div>

            {/* Upskilling */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Upskilling Suggestions
              </h2>
              <div className="space-y-3">
                {recommendations.upskilling_suggestions?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.skill}</p>
                      <p className="text-sm text-gray-600">{item.resource} ({item.type})</p>
                    </div>
                    <span className={`badge ${item.priority === 'high' ? 'badge-danger' : item.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insights */}
            {recommendations.market_insights && (
              <div className="card bg-primary-50 border-primary-200">
                <h2 className="text-lg font-semibold text-primary-900 mb-2">Market Insights</h2>
                <p className="text-primary-800">{recommendations.market_insights}</p>
              </div>
            )}

            <button
              onClick={() => setRecommendations(null)}
              className="btn-secondary w-full"
            >
              Generate New Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
