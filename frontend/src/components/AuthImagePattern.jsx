const AuthImagePattern = ({ title, subtitle }) => {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
        <div className="max-w-2xl text-center">
          {/* Main geometric pattern */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="relative">
                {/* Base shape */}
                <div
                  className={`
                    aspect-square rounded-2xl
                    ${i % 3 === 0 ? 'bg-primary/20' : 'bg-primary/10'}
                    ${i % 2 === 0 ? 'animate-pulse duration-3000' : ''}
                    relative overflow-hidden
                  `}
                >
                  {/* Decorative overlays */}
                  <div className={`
                    absolute inset-0
                    ${i % 3 === 0 ? 'bg-secondary/10' : ''}
                    ${i % 3 === 1 ? 'bg-accent/5' : ''}
                    ${i % 3 === 2 ? 'bg-primary/5' : ''}
                  `}>
                    {/* Moroccan geometric patterns */}
                    <div className={`
                      absolute inset-2 border-2
                      ${i % 2 === 0 ? 'border-base-content/5 rounded-lg rotate-45' : 'border-primary/10 rounded-full'}
                      transition-transform duration-500 hover:scale-105
                    `} />
                    <div className={`
                      absolute inset-4
                      ${i % 3 === 0 ? 'bg-base-content/5 rounded-full' : ''}
                      ${i % 3 === 1 ? 'rotate-45 bg-primary/5' : ''}
                      ${i % 3 === 2 ? 'bg-secondary/5 rounded-lg' : ''}
                    `} />
                    {/* Additional Moroccan patterns */}
                    <div className={`
                      absolute inset-6
                      ${i % 2 === 0 ? 'border-base-content/10 rounded-lg rotate-45' : 'border-primary/20 rounded-full'}
                      transition-transform duration-500 hover:scale-105
                    `} />
                    <div className={`
                      absolute inset-8
                      ${i % 3 === 0 ? 'bg-base-content/10 rounded-full' : ''}
                      ${i % 3 === 1 ? 'rotate-45 bg-primary/10' : ''}
                      ${i % 3 === 2 ? 'bg-secondary/10 rounded-lg' : ''}
                    `} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Text content */}
          <h2 className="text-3xl font-bold mb-4 text-primary">{title}</h2>
          <p className="text-base-content/60 text-lg">{subtitle}</p>
        </div>
      </div>
    );
  };

  export default AuthImagePattern;
