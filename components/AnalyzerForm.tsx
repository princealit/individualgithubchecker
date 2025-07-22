'use client';

import { useState } from 'react';
import axios from 'axios';

interface AnalysisResult {
  username: string;
  total_repos_analyzed: number;
  repos_meeting_criteria: RepoAnalysis[];
  all_repo_stats: Record<string, RepoAnalysis>;
  analysis_timestamp: string;
  min_tokens_threshold: number;
  error?: string;
}

interface RepoAnalysis {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  size_kb: number;
  total_tokens: number;
  file_stats: {
    total_files: number;
    processed_files: number;
    extensions: Record<string, number>;
  };
  url: string;
  meets_criteria: boolean;
}

export default function AnalyzerForm() {
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [minTokens, setMinTokens] = useState(1000000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub profile URL or username');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/analyze', {
        username: githubUrl.trim(),
        minTokens,
        githubToken: githubToken.trim() || undefined
      });

      setResults(response.data);
      
      if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      // Show specific error message from API if available
      let errorMessage = 'Failed to analyze GitHub profile. Please check the username and try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          GitHub Repository Analyzer
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Find repositories with 1M+ tokens (excluding forks)
        </p>
        <p className="text-sm text-gray-500">
          Paste any GitHub profile URL or username to analyze their repositories
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleAnalyze} className="card mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="github-url" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Profile URL or Username
            </label>
            <input
              id="github-url"
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username or just 'username'"
              className="input-field"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Examples: https://github.com/torvalds, github.com/microsoft, or just 'octocat'
            </p>
          </div>

          <div>
            <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Personal Access Token (Optional but Recommended)
            </label>
            <input
              id="github-token"
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="github_pat_..."
              className="input-field"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-amber-600 font-medium">Recommended:</span> Without a token, you're limited to 60 requests/hour. 
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                Create a token here
              </a> 
              (only needs 'public_repo' scope)
            </p>
          </div>

          <div>
            <label htmlFor="min-tokens" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Token Threshold
            </label>
            <select
              id="min-tokens"
              value={minTokens}
              onChange={(e) => setMinTokens(Number(e.target.value))}
              className="input-field"
              disabled={loading}
            >
              <option value={100000}>100K tokens</option>
              <option value={250000}>250K tokens</option>
              <option value={500000}>500K tokens</option>
              <option value={1000000}>1M tokens (default)</option>
              <option value={2000000}>2M tokens</option>
              <option value={5000000}>5M tokens</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing repositories...
              </div>
            ) : (
              'Analyze GitHub Profile'
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && !results.error && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analysis Results for {results.username}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">
                  {formatNumber(results.total_repos_analyzed)}
                </div>
                <div className="text-sm text-blue-700">Total Repositories Analyzed</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">
                  {formatNumber(results.repos_meeting_criteria.length)}
                </div>
                <div className="text-sm text-green-700">
                  Repositories with {formatNumber(minTokens)}+ Tokens
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-900">
                  {results.repos_meeting_criteria.length > 0 ? '✅' : '❌'}
                </div>
                <div className="text-sm text-purple-700">Meets Criteria</div>
              </div>
            </div>

            {results.repos_meeting_criteria.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  🎉 Found {results.repos_meeting_criteria.length} qualifying repositories!
                </h3>
                <p className="text-sm text-green-700">
                  This user has substantial codebases that meet your token requirements.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  No repositories found with {formatNumber(minTokens)}+ tokens
                </h3>
                <p className="text-sm text-yellow-700">
                  Try lowering the threshold or check if this user has larger projects.
                </p>
              </div>
            )}
          </div>

          {/* Qualifying Repositories */}
          {results.repos_meeting_criteria.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Repositories Meeting Criteria
              </h3>
              <div className="space-y-4">
                {results.repos_meeting_criteria.map((repo) => (
                  <div key={repo.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {repo.name}
                          </a>
                        </h4>
                        {repo.description && (
                          <p className="text-gray-600 text-sm mt-1">{repo.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(repo.total_tokens)}
                        </div>
                        <div className="text-sm text-gray-500">tokens</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>⭐ {formatNumber(repo.stars)} stars</span>
                      {repo.language && <span>🔤 {repo.language}</span>}
                      <span>📁 {formatNumber(repo.file_stats.processed_files)} files processed</span>
                      <span>💾 {formatNumber(repo.size_kb)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Repositories Summary */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              All Repositories Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Repository
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stars
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(results.all_repo_stats)
                    .sort((a, b) => b.total_tokens - a.total_tokens)
                    .map((repo) => (
                    <tr key={repo.name}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {repo.name}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {repo.language || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {formatNumber(repo.total_tokens)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(repo.stars)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          repo.meets_criteria
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {repo.meets_criteria ? '✅ Qualifies' : '❌ Below threshold'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 