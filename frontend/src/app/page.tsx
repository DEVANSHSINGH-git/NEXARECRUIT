import Link from 'next/link';
import { ArrowRight, Brain, Target, Users, Sparkles, Shield, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">NexaRecruit</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Talent Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Transform Hiring with
            <span className="text-primary-600 block">Agentic Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            NexaRecruit combines multi-agent AI orchestration, semantic analysis, and explainable evaluation
            to deliver actionable talent intelligence for candidates and recruiters.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-3">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Intelligence-Driven Evaluation</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              One shared intelligence layer powering two experiences — candidate guidance and recruiter evaluation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="ATS-Style Scoring"
              description="Weighted evaluation across skills, experience, projects, and domain alignment with full explainability."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Multi-Agent Orchestration"
              description="Six specialized AI agents collaborate to analyze, evaluate, and recommend — powered by CrewAI."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Career Intelligence"
              description="Skill gap analysis, role recommendations, and career progression pathways based on market context."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Recruiter Decision Support"
              description="Candidate ranking, comparative analysis, and consolidated shortlisting workflows."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Semantic RAG Pipeline"
              description="Context-aware retrieval augmented generation for intelligent skill matching and role alignment."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Explainable AI"
              description="Every score comes with reasoning — strengths, weaknesses, missing skills, and actionable feedback."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How NexaRecruit Works</h2>
            <p className="text-lg text-gray-600">From upload to actionable intelligence in seconds.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard step={1} title="Upload Resume" description="Upload your resume in PDF or DOCX format." />
            <StepCard step={2} title="Input Job Description" description="Paste or enter the target job description." />
            <StepCard step={3} title="AI Evaluation" description="Multi-agent pipeline analyzes and scores your fit." />
            <StepCard step={4} title="Get Intelligence" description="Receive scores, feedback, and career recommendations." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-primary-100 text-lg mb-8">
            Join NexaRecruit and experience the future of talent intelligence.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-gray-900">NexaRecruit</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 NexaRecruit. Agentic Talent Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
        {step}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
