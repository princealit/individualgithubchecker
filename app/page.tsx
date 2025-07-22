import AnalyzerForm from '@/components/AnalyzerForm';

export default function Home() {
  return (
    <main className="min-h-screen py-8">
      <AnalyzerForm />
      
      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border-t border-gray-200 pt-8">
            <p className="mb-2">
              Built with Next.js, TypeScript, and OpenAI's tiktoken for accurate token counting
            </p>
            <p className="text-xs">
              This tool analyzes public GitHub repositories and excludes forks. 
              For higher rate limits, you can set the GITHUB_TOKEN environment variable.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
} 