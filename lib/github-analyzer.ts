import { encoding_for_model } from 'tiktoken';

interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  size: number;
  html_url: string;
  fork: boolean;
  owner: {
    login: string;
  };
}

interface FileInfo {
  path: string;
  type: string;
  size: number;
  download_url?: string;
}

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

export class GitHubRepoAnalyzer {
  private githubToken?: string;
  private tokenizer: any;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
    try {
      this.tokenizer = encoding_for_model("gpt-3.5-turbo");
    } catch (error) {
      console.warn('Could not initialize tokenizer:', error);
      this.tokenizer = null;
    }
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repo-Analyzer'
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    return fetch(url, { headers });
  }

  async getUserRepos(username: string): Promise<Repository[]> {
    const repos: Repository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `https://api.github.com/users/${username}/repos?page=${page}&per_page=${perPage}&type=owner&sort=updated&direction=desc`;
      
      const response = await this.fetchWithAuth(url);
      
      if (response.status === 404) {
        throw new Error(`User '${username}' not found`);
      } else if (response.status === 403) {
        throw new Error('Rate limit exceeded. Please provide a GitHub token or wait.');
      } else if (!response.ok) {
        throw new Error(`Error fetching repos: ${response.status}`);
      }

      const pageRepos: Repository[] = await response.json();
      if (!pageRepos.length) break;

      // Filter out forks
      const nonForkRepos = pageRepos.filter(repo => !repo.fork);
      repos.push(...nonForkRepos);

      if (pageRepos.length < perPage) break;
      page++;
    }

    return repos;
  }

  async getRepoContents(owner: string, repoName: string, path: string = '', depth: number = 0, fileCount: { count: number } = { count: 0 }): Promise<FileInfo[]> {
    // Safety limits to prevent infinite loading
    const MAX_DEPTH = 5;
    const MAX_FILES = 1000;
    
    // Stop if we've gone too deep or found too many files
    if (depth > MAX_DEPTH || fileCount.count > MAX_FILES) {
      return [];
    }

    // Skip problematic directories
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'vendor', 'target', '__pycache__'];
    const pathName = path.split('/').pop() || '';
    if (skipDirs.includes(pathName)) {
      return [];
    }

    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    
    try {
      const response = await this.fetchWithAuth(url);
      if (!response.ok) return [];

      const contents = await response.json();
      const contentArray = Array.isArray(contents) ? contents : [contents];
      
      const files: FileInfo[] = [];
      
      for (const item of contentArray) {
        // Stop if we've hit the file limit
        if (fileCount.count > MAX_FILES) break;

        if (item.type === 'file') {
          files.push(item);
          fileCount.count++;
        } else if (item.type === 'dir') {
          // Recursively get directory contents with increased depth
          const subFiles = await this.getRepoContents(owner, repoName, item.path, depth + 1, fileCount);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      console.error(`Error fetching contents for ${owner}/${repoName}/${path}:`, error);
      return [];
    }
  }

  async downloadFileContent(downloadUrl: string): Promise<string> {
    try {
      // Add timeout protection (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await this.fetchWithAuth(downloadUrl);
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        // Limit file size to prevent memory issues
        if (text.length > 500000) { // 500KB max
          return text.substring(0, 500000);
        }
        return text;
      }
      return '';
    } catch (error) {
      console.error('Error downloading file:', error);
      return '';
    }
  }

  countTokensInText(text: string): number {
    if (!this.tokenizer || !text) return 0;
    
    try {
      const tokens = this.tokenizer.encode(text);
      return tokens.length;
    } catch (error) {
      console.error('Error counting tokens:', error);
      return 0;
    }
  }

  async analyzeRepository(repo: Repository): Promise<{ totalTokens: number; fileStats: any }> {
    const owner = repo.owner.login;
    const repoName = repo.name;

    // Get all files in the repository
    const files = await this.getRepoContents(owner, repoName);

    let totalTokens = 0;
    const fileStats = {
      total_files: files.length,
      processed_files: 0,
      extensions: {} as Record<string, number>
    };

    // Code file extensions to analyze
    const codeExtensions = new Set([
      '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.sh',
      '.sql', '.html', '.css', '.scss', '.less', '.xml', '.json', '.yaml', '.yml',
      '.md', '.txt', '.r', '.m', '.pl', '.lua', '.dart', '.elm', '.ex', '.exs'
    ]);

    for (const fileInfo of files) {
      // Limit processing to prevent infinite loading (max 200 files per repo)
      if (fileStats.processed_files >= 200) {
        console.log(`Stopping analysis for ${repo.name} - processed 200 files`);
        break;
      }

      const filePath = fileInfo.path;
      const fileExt = '.' + filePath.split('.').pop()?.toLowerCase() || '';

      // Skip non-code files and very large files
      if (!codeExtensions.has(fileExt)) continue;
      if (fileInfo.size > 10 * 1024 * 1024) continue; // Skip files > 10MB

      // Download and analyze file content
      if (fileInfo.download_url) {
        const content = await this.downloadFileContent(fileInfo.download_url);
        if (content) {
          const fileTokens = this.countTokensInText(content);
          totalTokens += fileTokens;
          
          fileStats.processed_files++;
          
          if (fileStats.extensions[fileExt]) {
            fileStats.extensions[fileExt] += fileTokens;
          } else {
            fileStats.extensions[fileExt] = fileTokens;
          }
        }
      }
    }

    return { totalTokens, fileStats };
  }

  async analyzeUserProfile(username: string, minTokens: number = 1000000): Promise<AnalysisResult> {
    try {
      // Get user repositories
      const repos = await this.getUserRepos(username);
      if (!repos.length) {
        return {
          username,
          total_repos_analyzed: 0,
          repos_meeting_criteria: [],
          all_repo_stats: {},
          analysis_timestamp: new Date().toISOString(),
          min_tokens_threshold: minTokens,
          error: 'No repositories found or user does not exist'
        };
      }

      const results: AnalysisResult = {
        username,
        total_repos_analyzed: 0,
        repos_meeting_criteria: [],
        all_repo_stats: {},
        analysis_timestamp: new Date().toISOString(),
        min_tokens_threshold: minTokens
      };

      for (const repo of repos) {
        try {
          const { totalTokens, fileStats } = await this.analyzeRepository(repo);

          const repoAnalysis: RepoAnalysis = {
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            size_kb: repo.size,
            total_tokens: totalTokens,
            file_stats: fileStats,
            url: repo.html_url,
            meets_criteria: totalTokens >= minTokens
          };

          results.all_repo_stats[repo.name] = repoAnalysis;
          results.total_repos_analyzed++;

          if (totalTokens >= minTokens) {
            results.repos_meeting_criteria.push(repoAnalysis);
          }
        } catch (error) {
          console.error(`Error analyzing repository ${repo.name}:`, error);
          continue;
        }
      }

      return results;
    } catch (error) {
      return {
        username,
        total_repos_analyzed: 0,
        repos_meeting_criteria: [],
        all_repo_stats: {},
        analysis_timestamp: new Date().toISOString(),
        min_tokens_threshold: minTokens,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 