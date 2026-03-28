import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { SearchContext } from './core/strategy/SearchContext';
import { NaiveSearch } from './core/strategy/NaiveSearch';
import { RabinKarpSearch } from './core/strategy/RabinKarpSearch';
import { KMPSearch } from './core/strategy/KMPSearch';
import { BoyerMooreSearch } from './core/strategy/BoyerMooreSearch';
import type { SearchStep, SearchResult } from './core/strategy/models';

const ALGORITHMS = {
  naive: new NaiveSearch(),
  rabinkarp: new RabinKarpSearch(),
  kmp: new KMPSearch(),
  boyermoore: new BoyerMooreSearch()
};

function App() {
  const [text, setText] = useState<string>('');
  const [pattern, setPattern] = useState<string>('');
  const [algorithmKey, setAlgorithmKey] = useState<keyof typeof ALGORITHMS>('naive');
  const [context, setContext] = useState<SearchContext>(new SearchContext(ALGORITHMS.naive));
  
  // Execution states
  const [isStepMode, setIsStepMode] = useState(false);
  const [generator, setGenerator] = useState<Generator<SearchStep, SearchResult, unknown> | null>(null);
  const [currentStep, setCurrentStep] = useState<SearchStep | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContext(new SearchContext(ALGORITHMS[algorithmKey]));
  }, [algorithmKey]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    let combinedText = '';
    
    for (const file of files) {
      const content = await file.text();
      combinedText += content + '\n';
    }
    setText(combinedText);
    resetState();
  };

  const resetState = () => {
    setIsStepMode(false);
    setGenerator(null);
    setCurrentStep(null);
    setResult(null);
    setLogs([]);
  };

  const handleRunAll = () => {
    if (!text || !pattern) {
      alert("Por favor, carregue um texto e digite um padrão.");
      return;
    }
    resetState();
    
    const contextObj = new SearchContext(ALGORITHMS[algorithmKey]);
    const res = contextObj.execute(text, pattern);
    setResult(res);
  };

  const handleStartStepByStep = () => {
    if (!text || !pattern) {
      alert("Por favor, carregue um texto e digite um padrão.");
      return;
    }
    resetState();
    setIsStepMode(true);
    
    const gen = context.executeStepByStep(text, pattern);
    setGenerator(gen);
    setLogs([`Iniciando execução Passo a Passo com ${context.getStrategyName()}`]);
  };

  const handleNextStep = () => {
    if (!generator) return;
    
    const { value, done } = generator.next();
    
    if (done) {
      setResult(value as SearchResult);
      setGenerator(null);
      setLogs(prev => [...prev, `Execução finalizada. ${value.occurrences.length} ocorrências e ${value.comparisons} comparações.`]);
    } else {
      const step = value as SearchStep;
      setCurrentStep(step);
      if (step.description) {
         setLogs(prev => [...prev, `[Passo ${prev.length}] ${step.description}`]);
      }
    }
  };

  // Render a slice of text to prevent performance issues with huge texts
  const windowSize = 80;
  let textToRender = '';
  let highlightStartIndex = -1;
  let offset = 0;

  if (currentStep) {
    const centerIndex = currentStep.textIndex;
    offset = Math.max(0, centerIndex - Math.floor(windowSize / 2));
    textToRender = text.substring(offset, offset + windowSize).replace(/\n/g, ' ');
    highlightStartIndex = currentStep.textIndex - offset;
  } else {
    textToRender = text.substring(0, windowSize).replace(/\n/g, ' ');
    highlightStartIndex = 0;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Buscador de Padrões</h1>
        <p>Visualizador interativo de Algoritmos de Busca em Strings</p>
      </header>

      <main className="main-content">
        <aside className="glass-panel">
          <div className="control-group">
            <label>1. Carregar Textos (.txt)</label>
            <input type="file" multiple accept=".txt" onChange={handleFileUpload} />
            <small style={{color: 'var(--text-muted)'}}>{text.length > 0 ? `Tamanho do Texto: ${text.length} caracteres.` : 'Nenhum texto carregado.'}</small>
          </div>

          <div className="control-group">
            <label>2. String de Busca (Pattern)</label>
            <input 
              type="text" 
              value={pattern} 
              onChange={e => setPattern(e.target.value)} 
              placeholder="Digite o que deseja buscar..."
            />
            <small style={{color: 'var(--text-muted)', marginTop: '0.5rem'}}>Tamanho do Padrão: {pattern.length} caracteres.</small>
          </div>

          <div className="control-group">
            <label>3. Escolha o Algoritmo</label>
            <select value={algorithmKey} onChange={e => setAlgorithmKey(e.target.value as keyof typeof ALGORITHMS)}>
              <option value="naive">Naive (Força Bruta)</option>
              <option value="rabinkarp">Rabin-Karp</option>
              <option value="kmp">KMP (Knuth-Morris-Pratt)</option>
              <option value="boyermoore">Boyer-Moore</option>
            </select>
            <small style={{marginTop: '0.5rem', color: 'var(--accent-primary)'}}>
              Complexidade: {context.getTheoreticalComplexity()}
            </small>
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={handleRunAll} disabled={isStepMode && !!generator}>
              Executar Tudo
            </button>
            <button className="btn btn-secondary" onClick={handleStartStepByStep}>
              Passo a Passo
            </button>
          </div>

          {result && !generator && (
            <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h4>Ocorrências</h4>
                  <div className="value" style={{color: 'var(--accent-success)'}}>{result.occurrences.length}</div>
                </div>
                <div className="metric-card">
                  <h4>Comparações</h4>
                  <div className="value">{result.comparisons}</div>
                </div>
                <div className="metric-card">
                  <h4>Tempo</h4>
                  <div className="value" style={{fontSize: '1.2rem'}}>{result.timeMs.toFixed(3)} ms</div>
                </div>
              </div>
              
              <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--panel-border)'}}>
                <h4 style={{color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase'}}>Análise Real vs Teórica</h4>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5'}}>
                  Tamanho do Texto (N) = <strong>{text.length}</strong> | Padrão (M) = <strong>{pattern.length}</strong><br/>
                  Total de Comparações = <strong>{result.comparisons}</strong><br/>
                  Para o <strong>{context.getStrategyName()}</strong> (Teoria: {context.getTheoreticalComplexity()}), a proporção de comparações por caractere lido (C/N) foi de <strong>{(result.comparisons / Math.max(1, text.length)).toFixed(3)}x</strong>.
                </p>
              </div>
            </div>
          )}
        </aside>

        <section className="glass-panel visualization">
          {isStepMode ? (
            <>
              <div className="button-group" style={{marginTop: 0, marginBottom: '1rem'}}>
                <button className="btn btn-primary" onClick={handleNextStep} disabled={!generator}>
                  Próximo Passo {String.fromCharCode(8594)}
                </button>
              </div>

              <div className="text-viewer">
                {textToRender.split('').map((char, idx) => {
                  let className = "char";
                  
                  const isWithinPatternWindow = idx >= highlightStartIndex && idx < highlightStartIndex + pattern.length;
                  const isCurrentComparison = currentStep && idx === highlightStartIndex + currentStep.patternIndex;
                  
                  if (isWithinPatternWindow) {
                    className += " highlight";
                  }
                  
                  if (isCurrentComparison) {
                    if (currentStep.match) className += " match";
                    else if (currentStep.found) className += " found";
                    else className += " compare";
                  }

                  return <span key={idx} className={className}>{char}</span>;
                })}
                
                {/* Render pattern directly beneath */}
                <div className="pattern-viewer" style={{marginLeft: `${highlightStartIndex * 20}px`}}>
                  {pattern.split('').map((pChar, pIdx) => {
                     const isCurrentlyComparing = currentStep && pIdx === currentStep.patternIndex;
                     return (
                       <span key={pIdx} className="pattern-char" style={{ 
                         borderBottom: isCurrentlyComparing ? '2px solid var(--accent-warning)' : 'none',
                         color: isCurrentlyComparing ? (currentStep.match ? 'var(--accent-success)' : (!currentStep.match && currentStep.description.includes('Diferença') ? 'var(--accent-danger)' : 'var(--accent-warning)')) : '#fbbf24'
                       }}>
                         {pChar}
                       </span>
                     );
                  })}
                </div>
              </div>

              {currentStep && (
                <>
                  {/* Auxiliary Tables */}
                  {currentStep.lps && (
                     <div className="tables-viewer">
                       <h4 style={{marginBottom: '0.5rem'}}>Tabela LPS (Longest Prefix Suffix)</h4>
                       <table>
                         <tbody>
                           <tr>
                             <th>Padrão</th>
                             {pattern.split('').map((c, i) => <td key={i}>{c}</td>)}
                           </tr>
                           <tr>
                             <th>LPS</th>
                             {currentStep.lps.map((val, i) => <td key={i} style={{color: i === currentStep.patternIndex - 1 ? 'var(--accent-warning)' : 'inherit'}}>{val}</td>)}
                           </tr>
                         </tbody>
                       </table>
                     </div>
                  )}

                  {currentStep.badCharTable && (
                    <div className="tables-viewer">
                       <h4 style={{marginBottom: '0.5rem'}}>Tabela Bad Character (Última Ocorrência)</h4>
                       <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                         {Object.entries(currentStep.badCharTable).map(([char, index]) => (
                           <div key={char} style={{background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px'}}>
                             <strong style={{color: 'var(--accent-warning)'}}>{char}</strong>: {index}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                  
                  {currentStep.hashText !== undefined && (
                    <div className="metrics-grid" style={{marginTop: 0}}>
                      <div className="metric-card">
                         <h4>Hash do Texto (Janela)</h4>
                         <div className="value">{currentStep.hashText}</div>
                      </div>
                      <div className="metric-card">
                         <h4>Hash do Padrão</h4>
                         <div className="value" style={{color: currentStep.hashText === currentStep.hashPattern ? 'var(--accent-success)' : 'inherit'}}>
                           {currentStep.hashPattern}
                         </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{display: 'flex', gap: '2rem', marginBottom: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--panel-border)'}}>
                 <div><strong style={{color:'var(--text-muted)'}}>Índice Cursado do Texto (i):</strong> {currentStep ? currentStep.textIndex : 0}</div>
                 <div><strong style={{color:'var(--text-muted)'}}>Total de Comparações Realizadas:</strong> <span style={{color: 'var(--accent-warning)', fontWeight: 'bold'}}>{currentStep ? currentStep.comparisonsCount : 0}</span></div>
              </div>

              <div className="log-panel">
                <h4 style={{marginBottom: '1rem', color: 'var(--text-muted)'}}>Log de Execução</h4>
                {logs.map((log, idx) => (
                  <div key={idx} className="log-entry">
                    <span className="step">{(idx).toString().padStart(3, '0')}</span>
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center'}}>
              <div style={{fontSize: '4rem', marginBottom: '1rem', opacity: 0.2}}>&#x1F50D;</div>
              <h2 style={{color: 'var(--text-main)', marginBottom: '0.5rem'}}>Nenhuma execução ativa</h2>
              <p>Carregue um arquivo, defina o padrão e escolha "Executar Tudo" para o resultado final ou "Passo a Passo" para analisar a complexidade comportamental (LPS, saltos, hash).</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
