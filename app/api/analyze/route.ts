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

    // Check if GitHub token is available
    const githubToken = process.env.GITHUB_TOKEN;
    console.log('GitHub token available:', !!githubToken);
    console.log('Analyzing user:', cleanUsername);

    // Initialize analyzer with GitHub token if available
    const analyzer = new GitHubRepoAnalyzer(githubToken);

    // Run the analysis
    const results = await analyzer.analyzeUserProfile(cleanUsername, minTokens);
    
    // Check if the analyzer returned an error
    if (results.error) {
      console.error('Analyzer returned error:', results.error);
      return NextResponse.json(
        { error: results.error },
        { status: 400 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze GitHub profile';
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        errorMessage = 'GitHub API rate limit exceeded. Please try again in a few minutes or add a GitHub token.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'GitHub user not found. Please check the username and try again.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. This might be due to rate limiting or a private repository.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub Repository Analyzer API',
    usage: 'POST /api/analyze with { "username": "github_username", "minTokens": 1000000 }',
    github_token_configured: !!process.env.GITHUB_TOKEN
  });
} 