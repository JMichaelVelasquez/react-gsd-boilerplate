function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg">React GSD Boilerplate</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#start" className="hover:text-white transition-colors">Get Started</a>
            <a
              href="https://github.com/JMichaelVelasquez/react-gsd-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6">
        <section className="py-24 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Ship Faster with <span className="text-emerald-400">GSD</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            A production-ready React + TypeScript + Tailwind boilerplate with the
            Get Shit Done development system baked in. Stop configuring. Start building.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="#start"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Quick Start →
            </a>
            <a
              href="https://github.com/JMichaelVelasquez/react-gsd-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 grid md:grid-cols-3 gap-8">
          {[
            { icon: '⚛️', title: 'React 19 + TypeScript', desc: 'Latest React with full type safety out of the box.' },
            { icon: '🎨', title: 'Tailwind CSS v4', desc: 'Utility-first styling with the new Vite plugin integration.' },
            { icon: '🚀', title: 'Vite', desc: 'Lightning-fast dev server and optimised production builds.' },
            { icon: '📁', title: 'Clean Architecture', desc: 'Pre-structured src/ with components, pages, hooks, and utils.' },
            { icon: '🤖', title: 'GSD System', desc: 'AI-assisted development workflow with Claude Code integration.' },
            { icon: '🔧', title: 'Ready to Go', desc: 'ESLint, Git, and sensible defaults — just start coding.' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Quick Start */}
        <section id="start" className="py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Quick Start</h2>
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-6 max-w-2xl mx-auto font-mono text-sm space-y-2">
            <p className="text-gray-500"># Clone the repo</p>
            <p>
              <span className="text-emerald-400">$</span> git clone https://github.com/JMichaelVelasquez/react-gsd-boilerplate.git
            </p>
            <p>
              <span className="text-emerald-400">$</span> cd react-gsd-boilerplate
            </p>
            <br />
            <p className="text-gray-500"># Install &amp; run</p>
            <p>
              <span className="text-emerald-400">$</span> npm install
            </p>
            <p>
              <span className="text-emerald-400">$</span> npm run dev
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          Built with React, TypeScript, Tailwind CSS &amp; the GSD System.
        </div>
      </footer>
    </div>
  )
}

export default App
