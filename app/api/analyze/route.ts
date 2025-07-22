import { NextRequest, NextResponse } from 'next/server';
import { GitHubRepoAnalyzer } from '@/lib/github-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { username, minTokens = 1000000 } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Extract username from URL if full GitHub URL is provided
    let cleanUsername = username;
    if (username.includes('github.com/')) {
      const match = username.match(/github\.com\/([^\/\?]+)/);
      if (match) {
        cleanUsername = match[1];
      }
    }

    // Initialize analyzer with GitHub token if available
    const githubToken = process.env.GITHUB_TOKEN;
    const analyzer = new GitHubRepoAnalyzer(githubToken);

    // Run the analysis
    const results = await analyzer.analyzeUserProfile(cleanUsername, minTokens);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze GitHub profile' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Repository Analyzer API',
    usage: 'POST /api/analyze with { "username": "github_username", "minTokens": 1000000 }'
  });
} 