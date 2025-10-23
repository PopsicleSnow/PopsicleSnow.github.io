import { useState } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

function App() {
  const [showEmail, setShowEmail] = useState(false);

  const encodedEmail = 'a3Vsaml0IFthdF0gYmVya2VsZXkgW2RvdF0gY29t';

  const handleEmailClick = () => {
    setShowEmail(true);
  };

  // Devpost icon component
  const DevpostIcon = ({ url }: { url: string }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center ml-2 text-blue-600 hover:text-blue-800 transition-colors"
      aria-label="View on Devpost"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 280 280"
        fill="currentColor"
        className="inline-block"
      >
        <path d="M140 0c77.32 0 140 62.68 140 140s-62.68 140-140 140S0 217.32 0 140 62.68 0 140 0z"/>
        <path fill="#fff" d="M80 65h53.18c51.66 0 87.21 36.28 87.21 85s-35.55 85-87.21 85H80V65zm38.73 134h14.45c31.62 0 48.47-20.5 48.47-49s-16.85-49-48.47-49h-14.45V199z"/>
      </svg>
    </a>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-3xl font-normal mb-2">Kuljit Uppal</h1>
          
          <div className="flex items-center space-x-6 mb-12">
            <a href="https://github.com/PopsicleSnow" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com/in/kuljitu" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Linkedin size={20} />
            </a>
            <button
              onClick={handleEmailClick}
              className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
            >
              <Mail size={20} />
            </button>
            {showEmail && (
              <span className="text-gray-700 text-sm ml-2">
                {atob(encodedEmail)}
              </span>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed max-w-2xl font-roboto">
            I'm a third-year UC Berkeley student studying Electrical Engineering and Computer Science.
          </p>
          <p className="text-gray-700 leading-relaxed max-w-2xl font-roboto">
            I'm interested in security, backend systems, and performance and I'm excited about building systems and software that solve real problems. 
          </p>
        </div>

        {/* Experience */}
        <div className="mb-16">
          <h2 className="text-xl font-normal mb-8 text-gray-900">Experience</h2>
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-900">Academic Intern</h3>
              </div>
              <p className="text-gray-600 text-sm mb-2">UC Berkeley EECS - Fall 2025</p>
            </div>

            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-900">Software Engineering Intern</h3>
              </div>
              <p className="text-gray-600 text-sm mb-2">Bkey - Summer 2025</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Working on blockchain privacy and mobile development
              </p>
            </div>

            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-900">Software Engineering Intern</h3>
              </div>
              <p className="text-gray-600 text-sm mb-2">channelseal - Spring 2025</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Protecting company-sensitive data over SaaS and cloud integrations
              </p>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-xl font-normal mb-8 text-gray-900">Projects</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1 text-gray-900">
                Market Shield
                <DevpostIcon url="https://devpost.com/software/marketshield" />
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Financial radar for tracking global conflicts/trends and their impact on markets.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1 text-gray-900">
                <a href="https://ucbmacros.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Macro Tracker</a>
                <a
                  href="https://ucbmacros.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center ml-2"
                  aria-label="Visit Macro Tracker"
                >
                  <img
                    src="https://ucbmacros.com/static/favicon-96x96.png"
                    alt="Macro Tracker icon"
                    className="w-4 h-4 inline-block"
                  />
                </a>
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Provides access to nutrition logging at 10+ UC Berkeley dining halls and restaurants
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1 text-gray-900">
                Settling
                <DevpostIcon url="https://devpost.com/software/settling" />
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Personalized immigration assistance platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;