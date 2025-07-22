import { NextRequest, NextResponse } from 'next/server';
import { GitHubRepoAnalyzer } from '@/lib/github-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { username, minTokens = 1000000, githubToken } = await request.json();

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

    // Use user-provided token, fallback to environment variable, or use no token
    const tokenToUse = githubToken || process.env.GITHUB_TOKEN;
    
    console.log('GitHub token provided by user:', !!githubToken);
    console.log('GitHub token from environment:', !!process.env.GITHUB_TOKEN);
    console.log('Using token:', !!tokenToUse);
    console.log('Analyzing user:', cleanUsername);

    // Initialize analyzer with the token (user-provided or environment)
    const analyzer = new GitHubRepoAnalyzer(tokenToUse);

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
        errorMessage = 'GitHub API rate limit exceeded. Please provide a GitHub Personal Access Token for higher rate limits.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'GitHub user not found. Please check the username and try again.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. This might be due to rate limiting. Please provide a GitHub Personal Access Token.';
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
    usage: 'POST /api/analyze with { "username": "github_username", "minTokens": 1000000, "githubToken": "optional_github_token" }',
    note: 'For higher rate limits (5000 vs 60 requests/hour), provide your GitHub Personal Access Token',
    create_token: 'https://github.com/settings/tokens (only needs public_repo scope)',
    environment_token_configured: !!process.env.GITHUB_TOKEN
  });
} 