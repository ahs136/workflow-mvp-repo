import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Your Workflow Assistant</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <Link 
          href="/dashboard" 
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Dashboard →</h2>
          <p>View your tasks, progress, and get AI-powered suggestions.</p>
        </Link>

        <Link 
          href="/calendar" 
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Calendar →</h2>
          <p>Manage your schedule and organize your time effectively.</p>
        </Link>

        <Link 
          href="/tasks" 
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Tasks →</h2>
          <p>Create, organize, and track your tasks and projects.</p>
        </Link>

        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
          <p>Get intelligent suggestions for task management and productivity.</p>
        </div>
      </div>
    </div>
  )
}
