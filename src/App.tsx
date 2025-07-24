import { useState } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

function App() {
  const [showEmail, setShowEmail] = useState(false);

  const encodedEmail = 'a3Vsaml0QGJlcmtlbGV5LmVkdQ==';
  
  const handleEmailClick = () => {
    setShowEmail(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-3xl font-normal mb-2">Kuljit Uppal</h1>
          <p className="text-gray-500 uppercase tracking-wide text-sm mb-8">ENGINEER & COMPUTER SCIENTIST</p>
          
          <div className="flex items-center space-x-6 mb-12">
            <a href="https://github.com/PopsicleSnow" className="text-gray-400 hover:text-gray-100 transition-colors">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com/in/kuljitu" className="text-gray-400 hover:text-gray-100 transition-colors">
              <Linkedin size={20} />
            </a>
            <button 
              onClick={handleEmailClick}
              className="text-gray-400 hover:text-gray-100 transition-colors focus:outline-none"
            >
              <Mail size={20} />
            </button>
            {showEmail && (
              <span className="text-gray-300 text-sm ml-2">
                {atob(encodedEmail)}
              </span>
            )}
          </div>
          
          <p className="text-gray-300 leading-relaxed max-w-2xl font-roboto">
            I'm a junior at UC Berkeley studying Electrical Engineering and Computer Science. 
            I build systems and software that solve real problems. I care about security, performance, 
            and reliability.
          </p>
        </div>

        {/* Experience */}
        <div className="mb-16">
          <h2 className="text-xl font-normal mb-8">Experience</h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-100">Software Engineering Intern</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">Bkey (Summer 2025)</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Stealth
              </p>
            </div>
            
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-100">Software Engineering Intern</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">ChannelSeal (Jan 2025-May 2025)</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Protecting company-sensitive data over SaaS and cloud integrations
              </p>
            </div>
            
            <div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-100">Project Manager</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">Code for Good</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Leading a team of 5 developers to create GitHub metric visualizations
              </p>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-xl font-normal mb-8 text-gray-100">Projects</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1 text-gray-100">Market Shield</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Financial radar for tracking global conflicts/trends and their impact on markets.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 text-gray-100">Macro Tracker</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Provided access to nutrition logging at UC Berkeley dining halls and restaurants
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 text-gray-100">Settling</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
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