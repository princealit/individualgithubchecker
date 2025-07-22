# GitHub Repository Analyzer - Web Version

A beautiful web interface to analyze GitHub profiles and find repositories with 1M+ tokens (excluding forks). Built with Next.js and deployed on Vercel.

## 🌐 Live Demo

Deploy your own copy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/github-analyzer-web)

## ✨ Features

- 🎯 **Simple Interface** - Just paste a GitHub profile URL
- ✅ **Excludes Forks** - Only analyzes original repositories
- 🔢 **Accurate Token Counting** - Uses OpenAI's tiktoken
- 📊 **Beautiful Results** - Visual analysis with charts and tables
- ⚡ **Fast Analysis** - Optimized for performance
- 🔧 **Configurable Thresholds** - 100K to 5M+ token options
- 📱 **Responsive Design** - Works on all devices

## 🚀 Quick Start

### Option 1: Use the Live Version
Just visit the deployed version and paste any GitHub profile URL!

### Option 2: Deploy Your Own

1. **Clone & Deploy to Vercel:**
   ```bash
   git clone https://github.com/yourusername/github-analyzer-web
   cd github-analyzer-web
   vercel --prod
   ```

2. **Set Environment Variables (Optional):**
   In your Vercel dashboard, add:
   ```
   GITHUB_TOKEN=ghp_your_github_token_here
   ```

### Option 3: Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Environment Variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your GitHub token (optional)
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

## 📝 How to Use

1. **Paste GitHub Profile:** Enter any GitHub profile URL or username
   - `https://github.com/torvalds`
   - `github.com/microsoft` 
   - `octocat`

2. **Choose Threshold:** Select minimum token count (default: 1M)

3. **Analyze:** Click "Analyze GitHub Profile" and wait for results

4. **View Results:** See which repositories meet your criteria

## 🔑 GitHub Token (Optional)

For better performance and higher rate limits:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. No special permissions needed for public repos
4. Add to Vercel environment variables as `GITHUB_TOKEN`

**Rate Limits:**
- Without token: 60 requests/hour
- With token: 5000 requests/hour

## 🏗️ Architecture

- **Frontend:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS
- **Token Counting:** OpenAI tiktoken
- **API:** Next.js API routes
- **Deployment:** Vercel

## 📊 What Gets Analyzed

The tool analyzes these file types:
- **Languages:** `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.go`, `.rs`, etc.
- **Web:** `.html`, `.css`, `.scss`, `.json`
- **Docs:** `.md`, `.txt`
- **Config:** `.yaml`, `.yml`, `.xml`

Files > 10MB are skipped for performance.

## 🎯 Example Results

```
✅ Found 4 qualifying repositories!

crossword-ai: 755,115 tokens (TypeScript)
MY-CALENDAR-APP: 286,335 tokens (TypeScript)  
TODO-TS-APP: 275,023 tokens (TypeScript)
TASK-MANAGEMENT_DASHBOARD: 266,527 tokens (TypeScript)
```

## 🛠️ Development

### Project Structure
```
├── app/
│   ├── api/analyze/route.ts    # Analysis API endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   └── AnalyzerForm.tsx        # Main form component
├── lib/
│   └── github-analyzer.ts      # Analysis logic
└── package.json
```

### Tech Stack
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **tiktoken** - Token counting
- **Vercel** - Deployment

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/github-analyzer-web
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add `GITHUB_TOKEN` environment variable (optional)
   - Deploy!

### Deploy to Other Platforms

The app works on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Configuration

### Environment Variables
```bash
# Optional: GitHub token for higher rate limits
GITHUB_TOKEN=ghp_your_token_here
```

### Vercel Settings
```json
{
  "functions": {
    "app/api/analyze/route.ts": {
      "maxDuration": 300
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**"Rate limit exceeded"**
- Add a GitHub token to environment variables

**"User not found"**  
- Check the username spelling
- Ensure the profile is public

**Analysis takes too long**
- Large repositories with many files take time
- Vercel has a 5-minute timeout for serverless functions

### Getting Help

1. Check the browser console for errors
2. Verify the GitHub username exists
3. Try with a smaller repository first
4. Check if you're hitting rate limits

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Token counting by [tiktoken](https://github.com/openai/tiktoken)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Ready to find GitHub profiles with substantial codebases? Deploy your own copy and start analyzing!** 🚀 